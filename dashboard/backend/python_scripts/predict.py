import sys
import os
import json
import torch

# Add central-server to path to find model.py
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'central-server'))
from model import CSOP_GRU

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input data provided"}))
        sys.exit(1)

    try:
        # Input should be a JSON string representing list of shape (12, 4)
        input_data = json.loads(sys.argv[1])
        
        # Convert to tensor: (Batch=1, Seq=12, Features=4)
        X = torch.tensor([input_data], dtype=torch.float32)
        
        # Load model
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'global_meta_model.pth')
        
        model = CSOP_GRU(input_dim=4)
        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location='cpu'))
        else:
            print(json.dumps({"error": "global_meta_model.pth not found"}))
            sys.exit(1)
            
        model.eval()
        with torch.no_grad():
            prediction = model(X).item()
            
        # Optional: Apply some clipping to be safe (0 to 1 domain)
        prediction = max(0.0, min(1.0, prediction))
        
        print(json.dumps({"predictedOccupancy": prediction}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
