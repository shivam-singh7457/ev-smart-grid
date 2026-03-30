import torch
import torch.nn as nn

class CSOP_GRU(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=3, output_dim=1):
        super(CSOP_GRU, self).__init__()
        
        # Three GRU Layers as evaluated in the paper
        self.gru = nn.GRU(
            input_size=input_dim, 
            hidden_size=hidden_dim, 
            num_layers=num_layers, 
            batch_first=True
        )
        
        # Fully Connected Layers for final occupancy prediction
        self.fc1 = nn.Linear(hidden_dim, 32)
        self.fc2 = nn.Linear(32, 16)
        self.fc3 = nn.Linear(16, output_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        # x shape: (batch_size, sequence_length, features)
        gru_out, _ = self.gru(x)
        last_step_out = gru_out[:, -1, :] # Take the final time step
        
        out = self.relu(self.fc1(last_step_out))
        out = self.relu(self.fc2(out))
        out = self.fc3(out)
        return out