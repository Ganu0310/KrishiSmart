const { getMarketPrices } = require('../services/marketService');
const MarketPrice = require('../models/MarketPrice');
const { param, body, query, validationResult } = require('express-validator');

/**
 * GET /api/market-prices/:crop
 * Serve market prices from MongoDB cache (populated by background job)
 */
const getMarketPrice = [
  // Validation
  param('crop')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Crop name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Crop name must contain only letters and spaces'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
      }

      const { crop } = req.params;
      const result = await getMarketPrices(crop);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json({
        success: true,
        ...result.data,
        staleData: result.staleData,
      });
    } catch (error) {
      console.error('Market price controller error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve market prices' });
    }
  },
];

/**
 * GET /api/admin/market-prices
 * Get all market prices with pagination and filtering
 */
const getMarketPricesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, crop, market, source, search } = req.query;
    const query = {};

    if (crop) query.crop = crop.toLowerCase();
    if (market) query.market = { $regex: market, $options: 'i' };
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { crop: { $regex: search, $options: 'i' } },
        { market: { $regex: search, $options: 'i' } },
      ];
    }

    const prices = await MarketPrice.find(query)
      .sort({ date: -1, lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await MarketPrice.countDocuments(query);

    res.json({
      success: true,
      data: prices,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get prices error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/admin/market-prices
 * Create a new market price entry manually
 */
const createMarketPrice = [
  body('crop').trim().notEmpty().withMessage('Crop is required'),
  body('market').trim().notEmpty().withMessage('Market is required'),
  body('minPrice').isNumeric().withMessage('Min Price must be a number'),
  body('maxPrice').isNumeric().withMessage('Max Price must be a number'),
  body('modalPrice').isNumeric().withMessage('Modal Price must be a number'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { crop, market, minPrice, maxPrice, modalPrice, date } = req.body;

      const newPrice = new MarketPrice({
        crop: crop.toLowerCase(),
        market,
        minPrice,
        maxPrice,
        modalPrice,
        date: date || new Date(),
        source: 'manual',
        lastUpdated: new Date()
      });

      await newPrice.save();
      res.status(201).json({ success: true, data: newPrice });
    } catch (error) {
      console.error('Create price error:', error.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
];

/**
 * PUT /api/admin/market-prices/:id
 * Update an existing market price entry
 */
const updateMarketPrice = [
  param('id').isMongoId().withMessage('Invalid ID'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = { ...req.body, lastUpdated: new Date() };
      
      if (updateData.crop) updateData.crop = updateData.crop.toLowerCase();

      const updatedPrice = await MarketPrice.findByIdAndUpdate(id, updateData, { new: true });

      if (!updatedPrice) {
        return res.status(404).json({ success: false, message: 'Price entry not found' });
      }

      res.json({ success: true, data: updatedPrice });
    } catch (error) {
      console.error('Update price error:', error.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
];

/**
 * DELETE /api/admin/market-prices/:id
 * Delete a market price entry
 */
const deleteMarketPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MarketPrice.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Price entry not found' });
    }

    res.json({ success: true, message: 'Price entry deleted' });
  } catch (error) {
    console.error('Delete price error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  getMarketPrice, 
  getMarketPricesAdmin, 
  createMarketPrice, 
  updateMarketPrice, 
  deleteMarketPrice 
};
