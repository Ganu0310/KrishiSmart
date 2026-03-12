const Scheme = require('../models/Scheme');
const { query, validationResult } = require('express-validator');

/**
 * GET /api/schemes
 * Returns matching government schemes with optional filtering.
 * Query params: crop, state, type, search, page, limit
 */
const getSchemes = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('crop').optional().trim().isLength({ max: 30 }),
  query('state').optional().trim().isLength({ max: 50 }),
  query('type').optional().isIn(['subsidy', 'insurance', 'loan', 'training', 'equipment', 'other']),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { crop, state, type, search, page = 1, limit = 20 } = req.query;
      const filter = { isActive: true };

      if (crop) {
        filter.applicableCrops = { $in: [crop.toLowerCase(), 'all'] };
      }
      if (state) {
        filter.applicableStates = {
          $in: [new RegExp(state.trim(), 'i'), 'all'],
        };
      }
      if (type) {
        filter.schemeType = type;
      }
      if (search) {
        filter.$or = [
          { schemeName: { $regex: search, $options: 'i' } },
          { benefitSummary: { $regex: search, $options: 'i' } },
          { ministry: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Scheme.countDocuments(filter);
      const schemes = await Scheme.find(filter)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return res.json({
        success: true,
        data: schemes,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get schemes error:', error.message);
      return res.status(500).json({ success: false, message: 'Server error retrieving schemes' });
    }
  },
];

/**
 * GET /api/schemes/:id
 * Get a single scheme by MongoDB ID
 */
const getSchemeById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    return res.json({ success: true, data: scheme });
  } catch (error) {
    console.error('Get scheme error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSchemes, getSchemeById };
