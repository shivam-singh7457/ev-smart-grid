const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

router.get('/status/:id', predictController.getStationStatus);
router.get('/performance', predictController.getPerformanceData);
router.get('/', predictController.getAllStations);

module.exports = router;
