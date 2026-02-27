const { generateAdvisory, getLatestAdvisory } = require('../services/advisoryEngine');
const { param, validationResult } = require('express-validator');

/**
 * GET /api/advisory/:crop/:location
 * Generate or retrieve agricultural advisory
 */
const getAdvisory = [
  // Validation
  param('crop')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Crop name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Crop name must contain only letters and spaces'),
  
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

      const { crop, location } = req.params;

      // Check if recent advisory exists (less than 6 hours old)
      const latestResult = await getLatestAdvisory(crop, location);
      
      if (latestResult.success && !latestResult.staleData) {
        // Return cached advisory if fresh
        return res.json({
          success: true,
          ...latestResult.data,
          cached: true,
        });
      }

      // Generate new advisory
      const result = await generateAdvisory(crop, location);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Emit Socket.io event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('new_advisory', {
          crop,
          location,
          timestamp: new Date(),
        });
      }

      return res.json({
        success: true,
        ...result.data,
        cached: false,
      });
    } catch (error) {
      console.error('Advisory controller error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate advisory',
      });
    }
  },
];

module.exports = { getAdvisory };
