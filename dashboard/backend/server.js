const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://123ad0061_db_user:shivam123@cluster-new.nqraqjm.mongodb.net/?appName=Cluster-new';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
const stationRoutes = require('./routes/stationRoutes');
app.use('/api/stations', stationRoutes);

app.get('/api/health', (req, res) => {
  const status = mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected';
  res.json({ status, timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('AFML EV Smart Grid API Running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
