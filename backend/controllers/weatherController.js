const { getCurrentWeather } = require('../services/weatherService');
const { query, validationResult } = require('express-validator');

/**
 * GET /api/weather/current?location=Nashik
 * Serve weather data from MongoDB cache (populated by background job)
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
      const result = await getCurrentWeather(location);

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
