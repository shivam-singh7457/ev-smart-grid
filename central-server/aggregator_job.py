import os
import sys
import pyspark

# --- 1. THE WINDOWS OVERRIDE (Forward Slashes!) ---
# This forces the Python paths and the winutils.exe location so PySpark doesn't crash
os.environ['HADOOP_HOME'] = "C:/hadoop"
os.environ['PYSPARK_PYTHON'] = sys.executable
os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable

# --- Dynamically Resolve Scala Version ---
# Spark 4.x dropped Scala 2.12 and upgraded to Scala 2.13
spark_version = pyspark.__version__
spark_major = int(spark_version.split('.')[0])
scala_version = "2.13" if spark_major >= 4 else "2.12"
KAFKA_PACKAGE = f"org.apache.spark:spark-sql-kafka-0-10_{scala_version}:{spark_version}"

from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from pymongo import MongoClient
import torch
import json
import numpy as np
from datetime import datetime
from model import CSOP_GRU

# --- 2. BDS & FL CONFIGURATION ---
KAFKA_BROKER = "localhost:9092"
TOPIC_NAME = "local_model_updates"
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "ev_smart_grid"
COLLECTION_NAME = "global_training_logs"

# Initialize the Global Meta-Model on the PySpark Driver
global_model = CSOP_GRU()
global_round = 1

def calculate_wa_weights(local_updates, current_global_round_i, beta=0.5):
    """
    Implements the Weighted Aggregation (WA) from the IEEE AFML Paper.
    Balances Information Richness (IR) and Information Staleness (IS).
    """
    total_data_size = sum([update['S_j'] for update in local_updates])
    
    # Calculate total staleness penalty across all received asynchronous models
    total_staleness = sum([np.exp(-(update['C_j'] - current_global_round_i)) for update in local_updates])
    
    aggregated_weights = {}
    
    for update in local_updates:
        S_j = update['S_j']
        C_j = update['C_j']
        local_model = update['weights']
        
        # 1. Information Richness (Reward more data)
        IR_j = S_j / total_data_size if total_data_size > 0 else 0
        
        # 2. Information Staleness (Penalize delayed asynchronous uploads)
        IS_j = np.exp(-(C_j - current_global_round_i)) / total_staleness if total_staleness > 0 else 0
        
        # 3. Final Aggregation Weight
        w_j = (beta * IR_j) + ((1 - beta) * IS_j)
        
        # 4. Apply to Neural Network Tensors
        for layer_name, param in local_model.items():
            if layer_name not in aggregated_weights:
                aggregated_weights[layer_name] = param * w_j
            else:
                aggregated_weights[layer_name] += param * w_j
                
    return aggregated_weights

def process_federated_batch(df, epoch_id):
    """Executes on every micro-batch of models received from Kafka"""
    global global_model, global_round
    
    rows = df.collect()
    if not rows: return
    
    local_updates = []
    for row in rows:
        try:
            data = json.loads(row['value_str'])
            # Deserialize Python lists back into PyTorch Tensors
            weights = {k: torch.tensor(v) for k, v in data['weights'].items()}
            local_updates.append({
                'station_id': data['station_id'],
                'S_j': data['S_j'],
                'C_j': data['C_j'],
                'weights': weights
            })
        except Exception as e:
            print(f"[!] Error parsing tensor weights: {e}")
            
    if not local_updates: return
    
    print(f"\n[*] [Round {global_round}] PySpark intercepted {len(local_updates)} asynchronous local models.")
    print(f"[*] Applying AFML Weighted Aggregation...")
    
    # Run the math to create the new global parameters
    new_global_weights = calculate_wa_weights(local_updates, global_round)
    
    # Update the Master PyTorch Model
    global_model.load_state_dict(new_global_weights)
    print(f"[+] Global Meta-Model successfully updated!")
    
    # Sink the training metadata to MongoDB for the web dashboard
    try:
        client = MongoClient(MONGO_URI)
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
        print("[!] MongoDB Sink Error:", e)
        
    global_round += 1

def start_central_aggregator():
    print("[*] Initializing PySpark Federated Parameter Server...")
    
    # --- 3. THE NUCLEAR JAVA OVERRIDE (Forward Slashes & Dynamic Kafka!) ---
    spark = SparkSession.builder \
        .appName("AFML_Central_Aggregator") \
        .config("spark.jars.packages", KAFKA_PACKAGE) \
        .config("spark.driver.extraJavaOptions", "-Dhadoop.home.dir=C:/hadoop") \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("ERROR")

    # Consume the weight stream from Kafka
    raw_stream = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BROKER) \
        .option("subscribe", TOPIC_NAME) \
        .option("startingOffsets", "latest") \
        .load()

    # Extract the JSON string
    parsed_stream = raw_stream.selectExpr("CAST(value AS STRING) as value_str")

    print("[*] Parameter Server Online. Waiting for asynchronous model updates...")

    # Route the micro-batches to our custom PyTorch aggregation function
    query = parsed_stream.writeStream \
        .outputMode("append") \
        .foreachBatch(process_federated_batch) \
        .start()

    query.awaitTermination()

if __name__ == "__main__":
    start_central_aggregator()