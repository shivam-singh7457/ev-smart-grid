import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
import json
import time
import os
import glob
from kafka import KafkaProducer
from datetime import datetime
from model import CSOP_GRU

# --- BDS & FL CONFIGURATION ---
KAFKA_BROKER = 'localhost:9092'
TOPIC_NAME = 'local_model_updates'
DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'guangzhou_train', '*.xlsx')

def tensor_to_list(state_dict):
    """Converts PyTorch tensors to standard Python lists for Kafka JSON serialization"""
    return {k: v.cpu().numpy().tolist() for k, v in state_dict.items()}

def json_serializer(data):
    return json.dumps(data).encode('utf-8')

def train_local_reptile(df, current_global_weights=None, k_steps=5, learning_rate=0.001):
    """Implements the local Adaptive Reptile (AR) k-step SGD training"""
    # 1. Prepare the data (Occupancy Rate)
    df['total'] = pd.to_numeric(df['total'], errors='coerce')
    df['busy'] = pd.to_numeric(df['busy'], errors='coerce')
    df['occupancy'] = df.apply(lambda row: row['busy'] / row['total'] if row['total'] > 0 else 0, axis=1)
    
    # Simple sequence prep (using past 12 steps to predict the next)
    seq_length = 12
    data_values = df['occupancy'].values
    
    # If we don't have enough data, skip
    if len(data_values) <= seq_length:
        return None, len(data_values)
        
    X, y = [], []
    for i in range(len(data_values) - seq_length):
        X.append(data_values[i:i+seq_length])
        y.append(data_values[i+seq_length])
        
    X_tensor = torch.tensor(X, dtype=torch.float32).unsqueeze(-1)
    y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(-1)
    
    # 2. Initialize Model
    local_model = CSOP_GRU()
    if current_global_weights:
        local_model.load_state_dict(current_global_weights)
        
    criterion = nn.MSELoss()
    optimizer = optim.Adam(local_model.parameters(), lr=learning_rate)
    
    # 3. k-step SGD (Reptile Logic)
    local_model.train()
    for step in range(k_steps):
        optimizer.zero_grad()
        predictions = local_model(X_tensor)
        loss = criterion(predictions, y_tensor)
        loss.backward()
        optimizer.step()
        
    local_state = local_model.state_dict()
    if current_global_weights is not None:
        meta_lr = 0.1 # Adaptive Reptile beta step-size
        final_weights = {}
        for name, param in local_state.items():
            final_weights[name] = current_global_weights[name] + meta_lr * (param - current_global_weights[name])
        return final_weights, len(data_values)
    else:
        return local_state, len(data_values)

def start_federated_clients():
    print("[*] Initializing Edge Nodes for Asynchronous Federated Learning...")
    try:
        producer = KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER], 
            value_serializer=json_serializer,
            api_version_auto_timeout_ms=5000,
            request_timeout_ms=10000,
            max_request_size=5 * 1024 * 1024,  # 5MB — model weights are ~1.4MB per message
            buffer_memory=50 * 1024 * 1024  # 50MB buffer for 50 rounds
        )
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Could not connect to Apache Kafka at {KAFKA_BROKER}.")
        print("[!] The AFML pipeline requires Kafka to be running to transfer model weights.")
        print("[!] Please run `sudo docker compose up -d` in the root EV-smart-grid directory.")
        print(f"[!] System Error detail: {e}")
        return
    
    all_files = glob.glob(DATA_FOLDER)
    
    # To simulate real AFML, try to load the latest global weights from the shared root
    global_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'global_meta_model.pth')
    
    for global_round in range(1, 501):
        print(f"\n================ [Global Round {global_round}] ================")
        
        for file in all_files:
            station_id = os.path.basename(file).split('.')[0]
            df = pd.read_excel(file)
            
            print(f"[*] Station {station_id} initiating local Adaptive Reptile training...")
            
            # In this 'real' environment, fetch current global weights every round if they exist
            current_weights = None
            if os.path.exists(global_model_path):
                current_weights = torch.load(global_model_path, map_location='cpu')
                
            # Run local training
            local_weights, data_size = train_local_reptile(df, current_global_weights=current_weights, k_steps=5)
            
            if local_weights is None: continue
            
            # Construct the AFML Payload
            payload = {
                "station_id": station_id,
                "S_j": data_size,                 # Information Richness parameter
                "C_j": global_round,              # Information Staleness parameter
                "weights": tensor_to_list(local_weights), # The actual learned knowledge
                "timestamp": str(datetime.now())
            }
            
            # Fire weights to Kafka
            producer.send(TOPIC_NAME, value=payload)
            print(f"[+] KAFKA STREAM -> Uploaded local model parameters for {station_id} (Data Size: {data_size})")
            
            time.sleep(1) # Simulate asynchronous network delay between stations finishing

if __name__ == "__main__":
    start_federated_clients()