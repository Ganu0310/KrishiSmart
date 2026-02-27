const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');
const { getMarketPrice } = require('../controllers/marketPriceController');
const { getSoil } = require('../controllers/soilController');
const { getAdvisory } = require('../controllers/govAdvisoryController');

/**
 * Government Data Integration Routes
 * All data served from MongoDB cache (populated by background jobs)
 */

// Weather endpoint
router.get('/weather/current', ...getWeather);

// Market prices endpoint
router.get('/market/:crop', getMarketPrice);

// Soil condition endpoint
router.get('/soil/:location', getSoil);

// Smart advisory endpoint
router.get('/advisory/:crop/:location', getAdvisory);

module.exports = router;
