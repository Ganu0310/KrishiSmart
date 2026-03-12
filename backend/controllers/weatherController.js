const { getCurrentWeather, fetchAndCacheWeather } = require('../services/weatherService');
const { query, validationResult } = require('express-validator');

/**
 * GET /api/gov-data/weather/current?location=Nashik
 * Serve weather data from MongoDB cache (populated by background job).
 * Falls back to a live WeatherUnion fetch if the cache is empty.
 */
const getWeather = [
  // Validation
  query('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Location must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Location must contain only letters and spaces'),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array(),
        });
      }

      const location = req.query.location || process.env.DEFAULT_LOCATION || 'Nashik';
      let result = await getCurrentWeather(location);

      // If no data in cache, fetch live and cache it now
      if (!result.success) {
        console.log(`[Weather] No cache for "${location}", fetching live from WeatherUnion...`);
        const fetched = await fetchAndCacheWeather(location);
        if (fetched) {
          result = await getCurrentWeather(location);
        }
      }

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json({
        success: true,
        source: 'cache',
        ...result.data,
        staleData: result.staleData,
      });
    } catch (error) {
      console.error('Weather controller error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve weather data',
      });
    }
  },
];

module.exports = { getWeather };
