const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  totalPiles: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  predictedOccupancy: { type: Number, default: 0 },
  neighbors: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now }
});

// Enable geospatial queries
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
