# EV-Smart-Grid: Project File Guide

This document explains the role of every key file and directory in your Spatio-Temporal AFML project.

## 🏗️ Core Architecture (Model & Logic)

| Directory / File | Role |
| :--- | :--- |
| **`central-server/`** | **The Brain.** This acts as the "Parameter Server" in Federated Learning. |
| ├── `aggregator_job.py` | Implementation of the **AFML Weighted Aggregation**. It collects model weights from Kafka and computes the new Global Meta-Model. |
| └── `model.py` | Defines the **CSOP-GRU** (Cell-Specific Occupancy Prediction) architecture. |
| **`edge-clients/`** | **The Power Plants.** These simulate local charging stations. |
| ├── `client_node.py` | Simulates a station training locally using the **Adaptive Reptile (AR)** algorithm before streaming weights to Kafka. |
| └── `guangzhou_train/` | The raw dataset containing occupancy history for dozens of EV stations. |
| **`global_meta_model.pth`** | The actual trained weights of your model. This is what you "load" to make predictions. |

---

## 📊 Analytics & Benchmarking

| File Name | Purpose |
| :--- | :--- |
| **`evaluate.py`** | The main evaluation script. It calculates **MSE, MAE, RMSE, and R2 Scores** for all stations. |
| **`scripts/comparative_analysis.py`**| **Scientific Validation.** This script compares your Spatio-Temporal model against the "Basic AFML" from the original research paper to prove your improvements. |
| **`evaluation_metrics.csv`** | A summary of accuracy metrics for every station in the system. |
| **`comparison_results/`** | Contains the generated plots (Bar charts) showing that your model outperforms the baseline. |

---

## 💻 Monitoring Dashboard (Full-Stack)

| Directory / File | Role |
| :--- | :--- |
| **`dashboard/frontend/`** | **The User Interface.** A modern React application to visualize predictions. |
| ├── `src/App.jsx` | Main dashboard layout with real-time charts. |
| ├── `tailwind.config.js` | Styling configuration for a premium dark-mode look. |
| **`dashboard/backend/`** | **The Middleware.** Connects the ML models to the Frontend. |
| ├── `server.js` | The main Express server node. |
| ├── `historical_replay.js` | API to stream past data for "Simulation Replays." |
| ├── `replay_data.json` | Pre-processed data for smooth UI demonstrations. |

---

## ⚙️ Infrastructure & Deployment

| File Name | Purpose |
| :--- | :--- |
| **`docker-compose.yml`** | Configures Apache Kafka and Zookeeper (the communication backbone). |
| **`render.yaml`** | Configuration for cloud deployment (if needed). |
| **`.gitignore`** | Tells Git to ignore large datasets and local caches. |

> [!TIP]
> If "sir" asks about the **Communication Protocol**, tell him we use **Apache Kafka** to handle the high-velocity asynchronous model updates from edge stations.
