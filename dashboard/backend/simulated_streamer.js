const mongoose = require('mongoose');
const Station = require('./models/Station');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://123ad0061_db_user:shivam123@cluster-new.nqraqjm.mongodb.net/?appName=Cluster-new';

const updateRandomStations = async () => {
    try {
        // Pick 5 random stations
        const stations = await Station.aggregate([{ $sample: { size: 5 } }]);
        
        for (let station of stations) {
            // New random occupancy
            const newOccupancy = Math.random();
            const lastUpdated = new Date();

            await Station.updateOne(
                { _id: station._id },
                { 
                    $set: { 
                        currentOccupancy: newOccupancy,
                        lastUpdated: lastUpdated
                    } 
                }
            );
            console.log(`[Simulation] Updated Station ${station.stationId}: ${newOccupancy.toFixed(2)}`);
        }
    } catch (err) {
        console.error('[Simulation Error]:', err);
    }
};

const runSimulation = async () => {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Simulation Streamer Connected to MongoDB');

        // Every 60 seconds
        setInterval(updateRandomStations, 60000);
        
        // Initial run
        updateRandomStations();
    } catch (err) {
        console.error('[Simulation Connection Error]:', err);
    }
};

runSimulation();
