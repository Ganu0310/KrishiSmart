const { getSoilCondition } = require('../services/soilService');
const { param, validationResult } = require('express-validator');

/**
 * GET /api/soil/:location
 * Get soil condition data from MongoDB cache
 */
const getSoil = [
  // Validation
  param('location')
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

      const { location } = req.params;
      const result = await getSoilCondition(location);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json({
        success: true,
        ...result.data,
        staleData: result.staleData,
      });
    } catch (error) {
      console.error('Soil controller error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve soil data',
      });
    }
  },
];

module.exports = { getSoil };
