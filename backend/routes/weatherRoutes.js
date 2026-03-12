const express = require('express');
const { getWeather } = require('../controllers/weatherController');
const { getForecast } = require('../controllers/forecastController');

const router = express.Router();

// GET /api/weather?location=Nashik     - current cached weather
// GET /api/weather/forecast?location=  - 7-day daily forecast (Open-Meteo)
router.get('/forecast', getForecast);
router.get('/', getWeather);

module.exports = router;
