const express = require('express');
const { getMarketPrice } = require('../controllers/marketPriceController');
const { getMarketTrend } = require('../controllers/marketTrendController');

const router = express.Router();

// GET /api/market-prices/:crop/trend   - price trend analysis (must come before /:crop)
router.get('/:crop/trend', getMarketTrend);

// GET /api/market-prices/:crop
router.get('/:crop', getMarketPrice);

module.exports = router;
