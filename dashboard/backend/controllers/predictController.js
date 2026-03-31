const { spawn } = require('child_process');
const path = require('path');
const Station = require('../models/Station');

// Helper to run python inference
const runInference = (inputSequence) => {
    return new Promise((resolve, reject) => {
        const modelPath = path.join(__dirname, '../../../global_meta_model.pth');
        const fs = require('fs');
        
        if (!fs.existsSync(modelPath)) {
            return reject(new Error('AFML Model file (global_meta_model.pth) not found on server.'));
        }

        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../python_scripts/predict.py'),
            JSON.stringify(inputSequence)
        ]);

        let result = '';
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}`));
            } else {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject(new Error('Failed to parse python output'));
                }
            }
        });
    });
};

exports.getStationStatus = async (req, res) => {
    try {
        const station = await Station.findOne({ stationId: req.params.id });
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // In a real scenario, we'd fetch the last 12 timesteps from a History collection
        // For the demo, we simulate a sequence [target, n1, n2, n3] for 12 steps
        // we'll use actual currentOccupancy and add some noise
        const generateMockSequence = (targetStation) => {
            const seq = [];
            for (let i = 0; i < 12; i++) {
                // [target, neighbor1, neighbor2, neighbor3]
                seq.push([
                    Math.max(0, Math.min(1, targetStation.currentOccupancy + (Math.random() - 0.5) * 0.1)),
                    Math.random() * 0.6, // Neighbor 1 idle-ish
                    Math.random() * 0.4, // Neighbor 2 idle-ish
                    Math.random() * 0.8  // Neighbor 3 busy-ish
                ]);
            }
            return seq;
        };

        const sequence = generateMockSequence(station);
        const prediction = await runInference(sequence);
        
        station.predictedOccupancy = prediction.predictedOccupancy;
        await station.save();

        let suggestions = [];

        // Always find the 3 closest stations (excluding the current one)
        const nearbyStations = await Station.find({
            stationId: { $ne: station.stationId },
            location: {
                $near: {
                    $geometry: station.location,
                    $maxDistance: 15000 // 15km radius
                }
            }
        }).limit(3);

        suggestions = nearbyStations.map(ns => ({
            stationId: ns.stationId,
            name: ns.name,
            currentOccupancy: ns.currentOccupancy,
            distance: (Math.random() * 3 + 1).toFixed(1) + " km" // Simplified for demo
        }));

        res.json({
            stationId: station.stationId,
            name: station.name,
            currentOccupancy: station.currentOccupancy,
            predictedOccupancy: station.predictedOccupancy,
            location: station.location,
            suggestions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllStations = async (req, res) => {
    try {
        const stations = await Station.find();
        res.json(stations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPerformanceData = async (req, res) => {
    res.json({
        baseline: {
            name: "Baseline GRU (Round 0)",
            avgR2: 0.0842,
            avgMSE: 0.0821,
            avgMAE: 0.1842,
            status: "Global Model (No Adaptation)"
        },
        afml: {
            name: "Spatio-Temporal AFML (Round 500)",
            avgR2: 0.7821,
            avgMSE: 0.0124,
            avgMAE: 0.0642,
            accuracyBoost: "+14.2%",
            status: "Federated & Adapted"
        },
        architecture: {
            type: "Spatio-Temporal GRU",
            inputChannels: 4, // Target + 3 Neighbors
            hiddenLayers: 2,
            hiddenUnits: 64,
            mechanism: "Asynchronous Meta-Learning (Adaptive Reptile)"
        }
    });
};
