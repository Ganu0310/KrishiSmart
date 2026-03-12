const MarketPrice = require('../models/MarketPrice');
const { param, query, validationResult } = require('express-validator');

/**
 * GET /api/market-prices/:crop/trend
 * Analyzes price history from MongoDB to compute trend direction,
 * price range, and best mandi to sell.
 */
const getMarketTrend = [
  param('crop')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Crop name must be 2-30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Crop name must contain only letters and spaces'),
  query('days')
    .optional()
    .isInt({ min: 3, max: 90 })
    .withMessage('days must be between 3 and 90')
    .toInt(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const crop = req.params.crop.toLowerCase().trim();
    const days = req.query.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const prices = await MarketPrice.find({
        crop,
        date: { $gte: since },
      })
        .sort({ date: 1 })
        .lean();

      if (!prices.length) {
        return res.status(404).json({
          success: false,
          message: `No price data found for "${crop}" in the last ${days} days.`,
        });
      }

      // Compute trend by comparing first-half avg to second-half avg
      const half = Math.floor(prices.length / 2);
      const firstHalf = prices.slice(0, half || 1);
      const secondHalf = prices.slice(half);

      const avg = (arr) =>
        arr.reduce((sum, p) => sum + (p.modalPrice || p.price || 0), 0) / arr.length;

      const firstAvg = avg(firstHalf);
      const secondAvg = avg(secondHalf);
      const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

      let trend = 'stable';
      if (changePercent > 3) trend = 'rising';
      else if (changePercent < -3) trend = 'falling';

      // Group by market to find best price
      const byMarket = {};
      prices.forEach((p) => {
        const market = p.market || p.mandi || 'Unknown';
        if (!byMarket[market]) byMarket[market] = [];
        byMarket[market].push(p.modalPrice || p.price || 0);
      });

      const marketSummaries = Object.entries(byMarket).map(([market, vals]) => {
        const marketAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { market, avgModalPrice: Math.round(marketAvg), dataPoints: vals.length };
      });

      marketSummaries.sort((a, b) => b.avgModalPrice - a.avgModalPrice);
      const bestMandi = marketSummaries[0] || null;

      // Recent data points for charting (last 14 days max)
      const chartData = prices.slice(-14).map((p) => ({
        date: p.date,
        modalPrice: p.modalPrice || p.price || 0,
        market: p.market || p.mandi,
      }));

      const allPrices = prices.map((p) => p.modalPrice || p.price || 0).filter(Boolean);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const currentPrice = allPrices[allPrices.length - 1] || 0;

      // Advice based on trend
      let sellingAdvice = '';
      if (trend === 'rising') {
        sellingAdvice = `📈 Prices are rising (+${changePercent.toFixed(1)}% over ${days} days). Consider holding stock for 3–5 more days for better returns.`;
      } else if (trend === 'falling') {
        sellingAdvice = `📉 Prices are falling (${changePercent.toFixed(1)}% over ${days} days). Sell soon to minimize losses.`;
      } else {
        sellingAdvice = `📊 Prices are stable. Sell at ${bestMandi?.market || 'your nearest mandi'} for the best returns.`;
      }

      return res.json({
        success: true,
        crop,
        analysisPeriodDays: days,
        trend,
        changePercent: parseFloat(changePercent.toFixed(2)),
        currentPrice,
        priceRange: { min: minPrice, max: maxPrice },
        bestMandi,
        allMarkets: marketSummaries,
        sellingAdvice,
        chartData,
        dataPoints: prices.length,
      });
    } catch (error) {
      console.error('Market trend error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to compute market trend' });
    }
  },
];

module.exports = { getMarketTrend };
