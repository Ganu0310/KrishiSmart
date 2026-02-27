const express = require('express');
const { getMarketPrice } = require('../controllers/marketPriceController');

const router = express.Router();

// GET /api/market-prices/:crop
router.get('/:crop', getMarketPrice);

module.exports = router;
