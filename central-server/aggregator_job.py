import os
import sys
import torch
import json
import numpy as np
import socket
import subprocess
from datetime import datetime
from collections import OrderedDict

# Ensure model can be imported regardless of execution directory
sys.path.append(os.path.dirname(__file__))
from model import CSOP_GRU

try:
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

from kafka import KafkaConsumer

# --- BDS & FL CONFIGURATION ---
KAFKA_BROKER = "localhost:9092"
TOPIC_NAME = "local_model_updates"
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "ev_smart_grid"
COLLECTION_NAME = "global_training_logs"

# How many station updates to collect before aggregating one global round
STATIONS_PER_ROUND = 32
TOTAL_ROUNDS = 500

# Initialize the Global Meta-Model on the Driver
global_model = CSOP_GRU()

def calculate_wa_weights(local_updates, current_global_round_i, beta=0.5):
    """
    Implements the Weighted Aggregation (WA) from the IEEE AFML Paper.
    Balances Information Richness (IR) and Information Staleness (IS).
    Equation (3): w_j = beta * IR_j + (1-beta) * IS_j
    """
    total_data_size = sum([update['S_j'] for update in local_updates])
    
    # Staleness penalty: e^{-(i - C_j)} — exponential DECAY for outdated models
    total_staleness = sum([np.exp(-(current_global_round_i - update['C_j'])) for update in local_updates])
    
    aggregated_weights = OrderedDict()
    
    for update in local_updates:
        S_j = update['S_j']
        C_j = update['C_j']
        local_weights = update['weights']
        
        # 1. Information Richness (Reward more data)
        IR_j = S_j / total_data_size if total_data_size > 0 else 0
        
        # 2. Information Staleness (Penalize outdated asynchronous uploads)
        IS_j = np.exp(-(current_global_round_i - C_j)) / total_staleness if total_staleness > 0 else 0
        
        # 3. Final Aggregation Weight
        w_j = (beta * IR_j) + ((1 - beta) * IS_j)
        
        # 4. Apply to Neural Network Tensors
        for layer_name, param in local_weights.items():
            if layer_name not in aggregated_weights:
                aggregated_weights[layer_name] = param.clone().float() * w_j
            else:
                aggregated_weights[layer_name] += param.clone().float() * w_j
                
    return aggregated_weights

def log_to_mongo(global_round, local_updates):
    """Sink training metadata to MongoDB for the web dashboard"""
    if not MONGO_AVAILABLE:
        return
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        log_entry = {
            "global_round": global_round,
            "stations_participated": [u['station_id'] for u in local_updates],
            "total_data_samples_processed": sum([u['S_j'] for u in local_updates]),
            "timestamp": str(datetime.now())
        }
        collection.insert_one(log_entry)
        client.close()
    except Exception as e:
        print(f"[!] MongoDB Sink Error (non-critical): {e}")

def check_kafka_connection(broker):
    host, port = broker.split(':')
    try:
        with socket.create_connection((host, int(port)), timeout=5):
            return True
    except OSError:
        return False

def start_central_aggregator():
    print("=" * 60)
    print("[*] AFML Central Aggregator — Real Kafka Consumer Mode")
    print("=" * 60)
    
    if not check_kafka_connection(KAFKA_BROKER):
        print(f"\n[CRITICAL ERROR] Could not connect to Apache Kafka at {KAFKA_BROKER}.")
        print("[!] Please run `sudo docker compose up -d` in the root EV-smart-grid directory.")
        return
    
    print(f"[+] Connected to Kafka at {KAFKA_BROKER}")
    print(f"[*] Subscribing to topic: '{TOPIC_NAME}'")
    print(f"[*] Will aggregate every {STATIONS_PER_ROUND} station updates into one global round.")
    
    consumer = KafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=[KAFKA_BROKER],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='latest',
        enable_auto_commit=True,
        consumer_timeout_ms=43200000,  # 12 hours for overnight runs
        max_partition_fetch_bytes=5 * 1024 * 1024,  # 5MB to handle large weight payloads
        fetch_max_bytes=10 * 1024 * 1024  # 10MB total fetch
    )
    
    print("[*] Parameter Server Online. Waiting for asynchronous model updates...\n")
    
    # --- PERSISTENT INCREMENTAL LEARNING ---
    global_round = 1
    root_dir = os.path.dirname(os.path.dirname(__file__))
    model_path = os.path.join(root_dir, "global_meta_model.pth")
    
    # 1. Model Load Logic & Error Handling
    if os.path.exists(model_path):
        try:
            global_model.load_state_dict(torch.load(model_path, map_location='cpu'))
            print(f"\n🔄 [RESUME] Successfully loaded existing global meta-model from '{model_path}'.")
        except Exception as e:
            print(f"\n[!] WARNING: Failed to load '{model_path}'. It may be corrupted.")
            print(f"[!] Exception: {e}")
            print(f"[!] Initializing a fresh global model instead.")
    else:
        print("\n[*] No existing global meta-model found. Starting fresh.")

    # 2. State Recovery from MongoDB
    if MONGO_AVAILABLE:
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]
            
            # Find the latest entry by sorting global_round descending
            latest_log = collection.find_one(sort=[("global_round", -1)])
            if latest_log and "global_round" in latest_log:
                global_round = latest_log["global_round"] + 1
                print(f"🔄 [SYNC] Recovered state from MongoDB. Resuming at Global Round {global_round}.")
            client.close()
        except Exception as e:
            print(f"[!] Warning: Could not recover state from MongoDB: {e}")
            print(f"[*] Defaulting to Round {global_round}.")
    
    round_buffer = []
    
    for message in consumer:
        try:
            data = message.value
            
            # Deserialize Python lists back into PyTorch Tensors
            weights = {k: torch.tensor(v, dtype=torch.float32) for k, v in data['weights'].items()}
            
            round_buffer.append({
                'station_id': data['station_id'],
                'S_j': data['S_j'],
                'C_j': data['C_j'],
                'weights': weights
            })
            
            print(f"  [<-] Received model from Station {data['station_id']} "
                  f"(buffer: {len(round_buffer)}/{STATIONS_PER_ROUND})")
            
        except Exception as e:
            print(f"[!] Error parsing message: {e}")
            continue
        
        # Once we have enough updates, aggregate into a global round
        if len(round_buffer) >= STATIONS_PER_ROUND:
            print(f"\n{'='*60}")
            print(f"[*] [Round {global_round}] Aggregating {len(round_buffer)} local models...")
            print(f"[*] Applying AFML Weighted Aggregation (Eq. 3)...")
            
            # Run WA to create new global parameters
            new_global_weights = calculate_wa_weights(round_buffer, global_round)
            
            # Update the Master PyTorch Model
            global_model.load_state_dict(new_global_weights)
            print(f"[+] Global Meta-Model successfully updated!")
            
            # Save the weights to disk for the evaluation script
            model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "global_meta_model.pth")
            torch.save(global_model.state_dict(), model_path)
            print(f"[+] Master weights saved to '{model_path}'")
            
            # Log to MongoDB
            log_to_mongo(global_round, round_buffer)
            
            print(f"{'='*60}\n")
            
            round_buffer = []
            global_round += 1
            
            # Auto-evaluate every 20 rounds and save round-stamped results
            if (global_round - 1) % 20 == 0:
                eval_round = global_round - 1
                print(f"\n📊 [AUTO-EVAL] Running evaluation at round {eval_round}...")
                root_dir = os.path.dirname(os.path.dirname(__file__))
                eval_script = os.path.join(root_dir, "evaluate.py")
                try:
                    result = subprocess.run(
                        [sys.executable, eval_script, "--round", str(eval_round)],
                        cwd=root_dir,
                        capture_output=True, text=True, timeout=300
                    )
                    if result.returncode == 0:
                        print(f"✅ [AUTO-EVAL] Round {eval_round} evaluation saved to evaluation_results/")
                    else:
                        print(f"[!] Evaluation error: {result.stderr[-500:]}")
                except Exception as e:
                    print(f"[!] Auto-evaluation failed: {e}")
            
            if global_round > TOTAL_ROUNDS:
                # Run final evaluation
                print(f"\n📊 [FINAL-EVAL] Running final evaluation...")
                root_dir = os.path.dirname(os.path.dirname(__file__))
                eval_script = os.path.join(root_dir, "evaluate.py")
                try:
                    subprocess.run(
                        [sys.executable, eval_script, "--round", str(TOTAL_ROUNDS)],
                        cwd=root_dir, capture_output=True, text=True, timeout=300
                    )
                    print(f"✅ [FINAL-EVAL] Final evaluation saved!")
                except Exception as e:
                    print(f"[!] Final evaluation failed: {e}")
                
                print(f"\n[DONE] Completed {TOTAL_ROUNDS} global rounds of federated aggregation!")
                break
    
    # Handle any remaining buffered updates
    if round_buffer:
        print(f"\n[*] Final partial round: Aggregating {len(round_buffer)} remaining models...")
        new_global_weights = calculate_wa_weights(round_buffer, global_round)
        global_model.load_state_dict(new_global_weights)
        model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "global_meta_model.pth")
        torch.save(global_model.state_dict(), model_path)
        print(f"[+] Final model saved to '{model_path}'")
    
    consumer.close()
    print("[*] Aggregator shut down cleanly.")

if __name__ == "__main__":
    start_central_aggregator()