const mongoose = require('mongoose');
const Station = require('./models/Station');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://123ad0061_db_user:shivam123@cluster-new.nqraqjm.mongodb.net/?appName=Cluster-new';

let currentIndex = 0;
let replayData = null;

const loadReplayData = () => {
    try {
        const dataPath = path.join(__dirname, 'replay_data.json');
        replayData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log('✅ Real Historical Data Loaded for Replay');
    } catch (err) {
        console.error('❌ Failed to load replay data:', err);
    }
};

const updateStationsFromHistory = async () => {
    if (!replayData) return;

    try {
        const stationIds = Object.keys(replayData);
        
        for (let stationId of stationIds) {
            const history = replayData[stationId].occupancy;
            const newOccupancy = history[currentIndex % history.length];
            
            await Station.updateOne(
                { stationId: stationId },
                { 
                    $set: { 
                        currentOccupancy: newOccupancy,
                        lastUpdated: new Date()
                    } 
                }
            );
        }
        
        console.log(`[Replay] Step ${currentIndex}: Updated all 35 stations with real historical data.`);
        currentIndex++;
    } catch (err) {
        console.error('[Replay Error]:', err);
    }
};

const runReplay = async () => {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Historical Replay Connected to MongoDB');

        loadReplayData();

        // Every 10 seconds, move to the next historical data point
        setInterval(updateStationsFromHistory, 10000);
        
        // Initial run
        updateStationsFromHistory();
    } catch (err) {
        console.error('[Replay Connection Error]:', err);
    }
};

runReplay();
