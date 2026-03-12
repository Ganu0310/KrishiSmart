const { fetchForecast } = require('../adapters/forecastAdapter');
const { assessPestRisk } = require('../utils/pestRiskEngine');
const { getCurrentWeather } = require('../services/weatherService');
const { query, validationResult } = require('express-validator');

const locationValidator = query('location')
  .optional()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Location must be 2-50 characters')
  .matches(/^[a-zA-Z\s_]+$/)
  .withMessage('Location must contain only letters, spaces, or underscores');

/**
 * GET /api/weather/forecast
 * 7-day daily forecast from Open-Meteo (free, no API key needed)
 */
const getForecast = [
  locationValidator,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const location = req.query.location || process.env.DEFAULT_LOCATION || 'Nashik';

    try {
      const data = await fetchForecast(location);
      if (!data) {
        return res.status(503).json({
          success: false,
          message: 'Weather forecast unavailable. Please try again later.',
        });
      }
      return res.json({ success: true, ...data });
    } catch (error) {
      console.error('Forecast controller error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch forecast' });
    }
  },
];

/**
 * GET /api/advisory/pest-risk?crop=grape&location=Nashik
 * Pest & disease risk assessment using live weather from cache
 */
const getPestRisk = [
  query('crop')
    .trim()
    .isIn(['grape', 'onion', 'tomato'])
    .withMessage('Unsupported crop. Use grape, onion, or tomato.'),
  locationValidator,

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const crop = req.query.crop.toLowerCase();
    const location = req.query.location || process.env.DEFAULT_LOCATION || 'Nashik';

    try {
      // Get latest cached weather
      const weatherResult = await getCurrentWeather(location);

      if (!weatherResult.success) {
        return res.status(404).json({
          success: false,
          message: 'No weather data available for this location. Ensure weather cache is populated.',
        });
      }

      const weather = weatherResult.data;
      const assessment = assessPestRisk(crop, {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        windSpeed: weather.windSpeed,
      });

      return res.json({
        success: true,
        staleWeatherData: weatherResult.staleData,
        ...assessment,
      });
    } catch (error) {
      console.error('Pest risk controller error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to assess pest risk' });
    }
  },
];

module.exports = { getForecast, getPestRisk };
