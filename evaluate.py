import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for overnight runs
import matplotlib.pyplot as plt
import glob
import os
import sys
import argparse

# Add central-server to path to find model.py
sys.path.append(os.path.join(os.path.dirname(__file__), 'central-server'))
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from model import CSOP_GRU

print("--- [DEBUG] SCRIPT STARTED ---")

def evaluate_for_research(model_path, data_folder, k_steps=5):
    print(f"--- [DEBUG] Searching for model: {model_path}")
    if not os.path.exists(model_path):
        print(f"--- [WARNING] Model file '{model_path}' not found in {os.getcwd()}")
        print("--- [INFO] Creating a dummy untrained global_meta_model.pth for evaluation purposes...")
        dummy_model = CSOP_GRU()
        torch.save(dummy_model.state_dict(), model_path)
        print("--- [INFO] Dummy model created successfully.")

    # Load Model
    global_model = CSOP_GRU()
    global_model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    print("--- [DEBUG] Model loaded successfully.")

    # Find Files
    print(f"--- [DEBUG] Searching for data files in: {data_folder}")
    test_files = glob.glob(data_folder)
    print(f"--- [DEBUG] Files found: {len(test_files)}")
    
    if not test_files:
        print("--- [ERROR] No files found! Check if 'guangzhou_train' folder exists and has .xlsx files.")
        return None, None

    results = []
    # To store data for the first station to visualize "Actual vs Predicted"
    sample_vis_data = None 

    for file in test_files:
        station_name = os.path.basename(file)
        print(f"--- [DEBUG] Processing Station: {station_name}")
        
        try:
            df = pd.read_excel(file)
            # Ensure columns exist
            if 'busy' not in df.columns or 'total' not in df.columns:
                print(f"--- [SKIP] Columns 'busy'/'total' missing in {station_name}")
                continue
                
            data = (pd.to_numeric(df['busy']) / pd.to_numeric(df['total'])).fillna(0).values
            
            seq_length = 12
            X, y = [], []
            for i in range(len(data) - seq_length):
                X.append(data[i:i+seq_length])
                y.append(data[i+seq_length])
            
            X = torch.tensor(X, dtype=torch.float32).unsqueeze(-1)
            y = torch.tensor(y, dtype=torch.float32).unsqueeze(-1)

            # Split
            split = int(len(X) * 0.8)
            X_sup, X_query = X[:split], X[split:]
            y_sup, y_query = y[:split], y[split:]

            # STEP 1: Zero-Shot
            global_model.eval()
            with torch.no_grad():
                preds_zero = global_model(X_query).numpy()
                mse_zero = mean_squared_error(y_query, preds_zero)

            # STEP 2: Adaptation
            local_task_model = CSOP_GRU()
            local_task_model.load_state_dict(global_model.state_dict())
            optimizer = torch.optim.Adam(local_task_model.parameters(), lr=0.001)
            criterion = nn.MSELoss()

            for _ in range(k_steps):
                optimizer.zero_grad()
                output = local_task_model(X_sup)
                loss = criterion(output, y_sup)
                loss.backward()
                optimizer.step()

            # STEP 3: Final Eval
            local_task_model.eval()
            with torch.no_grad():
                preds_adapted = local_task_model(X_query).numpy()
                mse_adapted = mean_squared_error(y_query, preds_adapted)
                mae_adapted = mean_absolute_error(y_query, preds_adapted)
                rmse_adapted = np.sqrt(mse_adapted)
                r2 = r2_score(y_query, preds_adapted)

            if sample_vis_data is None:
                # Save the first station's data for plotting line plot and scatter
                sample_vis_data = {
                    "station_name": station_name,
                    "y_true": y_query.numpy().flatten(),
                    "y_pred": preds_adapted.flatten()
                }

            results.append({
                "Station": station_name,
                "Base_MSE": mse_zero,
                "Adapted_MSE": mse_adapted,
                "Adapted_MAE": mae_adapted,
                "Adapted_RMSE": rmse_adapted,
                "R2": r2
            })
            print(f"--- [OK] Evaluated {station_name} | MSE: {mse_adapted:.4f} | R2: {r2:.4f}")

        except Exception as e:
            print(f"--- [ERROR] Failed processing {station_name}: {e}")

    return pd.DataFrame(results), sample_vis_data

def plot_metrics(df_results, vis_data, output_dir, suffix=""):
    if df_results.empty:
        return
        
    print("\n--- [INFO] Generating Visualizations...")
    plt.style.use('seaborn-v0_8-darkgrid')
    fig = plt.figure(figsize=(20, 15))
    
    # 1. Base vs Adapted MSE (Grouped Bar Chart)
    ax1 = plt.subplot(2, 2, 1)
    stations = df_results['Station']
    x = np.arange(len(stations))
    width = 0.35
    ax1.bar(x - width/2, df_results['Base_MSE'], width, label='Zero-Shot (Base) MSE', color='lightcoral')
    ax1.bar(x + width/2, df_results['Adapted_MSE'], width, label='Adapted MSE', color='mediumseagreen')
    ax1.set_xlabel('Stations', fontweight='bold')
    ax1.set_ylabel('Mean Squared Error (MSE)', fontweight='bold')
    ax1.set_title('Base vs. Adapted Model Performance', fontsize=14, fontweight='bold')
    ax1.set_xticks(x)
    
    # Simple fix for overlapping labels: only show every Nth label if there are too many
    if len(stations) > 10:
        ax1.set_xticklabels(stations, rotation=45, ha="right", fontsize=8)
    else:
        ax1.set_xticklabels(stations, rotation=45, ha="right")
    ax1.legend()
    
    # 2. R2 Score Distribution
    ax2 = plt.subplot(2, 2, 2)
    ax2.bar(stations, df_results['R2'], color='dodgerblue')
    ax2.axhline(y=0, color='r', linestyle='--')
    ax2.set_xlabel('Stations', fontweight='bold')
    ax2.set_ylabel('R2 Score', fontweight='bold')
    ax2.set_title('R2 Score per Station', fontsize=14, fontweight='bold')
    ax2.set_xticks(x)
    if len(stations) > 10:
        ax2.set_xticklabels(stations, rotation=45, ha="right", fontsize=8)
    else:
        ax2.set_xticklabels(stations, rotation=45, ha="right")
    ax2.set_ylim([max(-1, df_results['R2'].min() - 0.2), min(1.0, df_results['R2'].max() + 0.1)])

    # 3. Actual vs Predicted Over Time for Sample Station
    if vis_data:
        ax3 = plt.subplot(2, 2, 3)
        y_true = vis_data['y_true']
        y_pred = vis_data['y_pred']
        time_steps = np.arange(len(y_true))
        ax3.plot(time_steps, y_true, label='Actual Occupancy', color='blue', alpha=0.7)
        ax3.plot(time_steps, y_pred, label='Predicted Occupancy', color='orange', alpha=0.8, linestyle='--')
        ax3.set_xlabel('Time Steps', fontweight='bold')
        ax3.set_ylabel('Occupancy Rate', fontweight='bold')
        ax3.set_title(f'Actual vs. Predicted Occupancy ({vis_data["station_name"]})', fontsize=14, fontweight='bold')
        ax3.legend()

        # 4. Scatter Plot: True vs Predicted
        ax4 = plt.subplot(2, 2, 4)
        ax4.scatter(y_true, y_pred, color='purple', alpha=0.6, edgecolors='w', s=50)
        # Plot perfect prediction line
        min_val = min(min(y_true), min(y_pred))
        max_val = max(max(y_true), max(y_pred))
        ax4.plot([min_val, max_val], [min_val, max_val], 'k--', lw=2, label='Perfect Prediction')
        ax4.set_xlabel('Actual Occupancy', fontweight='bold')
        ax4.set_ylabel('Predicted Occupancy', fontweight='bold')
        ax4.set_title(f'Prediction Accuracy Scatter ({vis_data["station_name"]})', fontsize=14, fontweight='bold')
        ax4.legend()

    plt.tight_layout()
    # Save the plot explicitly
    plot_path = os.path.join(output_dir, f"evaluation_plots{suffix}.png")
    plt.savefig(plot_path, dpi=150)
    plt.close(fig)
    print(f"--- [INFO] Visualizations saved to {plot_path}")

# CRITICAL: Ensure this is exactly at the bottom with NO indentation
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--round', type=int, default=0, help='Current global round number (0 = manual run)')
    args = parser.parse_args()
    
    print("--- [DEBUG] Main block entered.")
    print(f"--- [DEBUG] Current Directory: {os.getcwd()}")
    
    # Setup output directory
    root_dir = os.path.dirname(__file__)
    output_dir = os.path.join(root_dir, "evaluation_results")
    os.makedirs(output_dir, exist_ok=True)
    
    suffix = f"_round_{args.round}" if args.round > 0 else ""
    
    # Run the function
    data_path = os.path.join(root_dir, "edge-clients", "guangzhou_train", "*.xlsx")
    model_path = os.path.join(root_dir, "global_meta_model.pth")
    df_results, vis_data = evaluate_for_research(model_path, data_path)
    
    if df_results is not None and not df_results.empty:
        print("\n" + "="*80)
        round_label = f" (Round {args.round})" if args.round > 0 else ""
        print(f"{'AFML FINAL RESULTS' + round_label:^80}")
        print("="*80)
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        try:
            print(df_results.to_markdown(index=False))
        except ImportError:
            print(df_results)
        
        plot_metrics(df_results, vis_data, output_dir, suffix)
        
        # Save results to CSV
        results_csv = os.path.join(output_dir, f"evaluation_metrics{suffix}.csv")
        df_results.to_csv(results_csv, index=False)
        print(f"\n--- [INFO] Metrics CSV saved to {results_csv}")
        
        # Also save a copy to root for quick access
        df_results.to_csv(os.path.join(root_dir, "evaluation_metrics.csv"), index=False)
    else:
        print("\n--- [ERROR] Script finished with no data to show.")