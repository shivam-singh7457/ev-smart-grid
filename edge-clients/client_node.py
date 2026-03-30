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
DATA_FOLDER = './guangzhou_train/*.xlsx'

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
        # In a full loop, you load the weights downloaded from the server here
        pass 
        
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
        
    return local_model.state_dict(), len(data_values)

def start_federated_clients():
    print("[*] Initializing Edge Nodes for Asynchronous Federated Learning...")
    producer = KafkaProducer(bootstrap_servers=[KAFKA_BROKER], value_serializer=json_serializer)
    
    all_files = glob.glob(DATA_FOLDER)
    global_round = 1 # Simulating the first global training round
    
    for file in all_files:
        station_id = os.path.basename(file).split('.')[0]
        df = pd.read_excel(file)
        
        print(f"\n[*] Station {station_id} initiating local Adaptive Reptile training...")
        
        # Run local training
        local_weights, data_size = train_local_reptile(df, k_steps=5)
        
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
        
        time.sleep(2) # Simulate asynchronous network delay between stations finishing

if __name__ == "__main__":
    start_federated_clients()