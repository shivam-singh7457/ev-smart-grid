const mongoose = require('mongoose');
const Station = require('./models/Station');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://123ad0061_db_user:shivam123@cluster-new.nqraqjm.mongodb.net/?appName=Cluster-new';

const seedStations = async () => {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB for Seeding');

        // Clear existing stations
        await Station.deleteMany({});
        console.log('🗑️  Cleared existing stations');

        // Load generated metadata
        const metadataPath = path.join(__dirname, 'stations_metadata.json');
        const stations = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        // Initial occupancy: random
        const stationsWithOccupancy = stations.map(s => ({
            ...s,
            currentOccupancy: Math.random(),
            predictedOccupancy: Math.random()
        }));

        await Station.insertMany(stationsWithOccupancy);
        console.log(`✨ Successfully seeded ${stationsWithOccupancy.length} stations!`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

seedStations();
