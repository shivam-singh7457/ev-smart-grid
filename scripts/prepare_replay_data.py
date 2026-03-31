import glob
import os
import pandas as pd
import json

def prepare_replay_data():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(root_dir, "edge-clients", "guangzhou_train")
    files = glob.glob(os.path.join(data_dir, "*.xlsx"))
    
    # We will pick a "Typical 24h Window" from the first 35 stations
    # If there are fewer than 35 files, we repeat some a bit
    replay_data = {}
    
    # Mapping numeric filenames to a simulated "Station Index" (ST-001 to ST-035)
    # We want a reliable mapping so the dashboard stays consistent
    for i in range(1, 36):
        station_id = f"ST-{i:03d}"
        
        # Use modulo if we have fewer files than metadata slots
        file_idx = (i - 1) % len(files)
        file_path = files[file_idx]
        
        print(f"[*] Processing {station_id} -> {os.path.basename(file_path)}")
        
        df = pd.read_excel(file_path, nrows=288) # Load 24h window (assuming 5m or 10m intervals)
        
        # Calculate occupancy: busy / total
        occupancy_levels = (pd.to_numeric(df['busy']) / pd.to_numeric(df['total'])).fillna(0).values.tolist()
        
        replay_data[station_id] = {
            "occupancy": occupancy_levels,
            "filename": os.path.basename(file_path)
        }
    
    output_path = os.path.join(root_dir, "dashboard", "backend", "replay_data.json")
    with open(output_path, 'w') as f:
        json.dump(replay_data, f)
    
    print(f"\n[SUCCESS] Exported replay data for 35 stations to {output_path}")

if __name__ == "__main__":
    prepare_replay_data()
