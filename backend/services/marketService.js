const MarketPrice = require('../models/MarketPrice');
const { fetchMarketPrices } = require('../adapters/marketAdapter');

/**
 * Fetch market prices from external API and cache in MongoDB
 */
const fetchAndCacheMarketPrices = async (crop) => {
  try {
    const pricesData = await fetchMarketPrices(crop);
    
    if (!pricesData || pricesData.length === 0) {
      console.log(`Failed to fetch market prices for ${crop}, keeping existing cache`);
      return false;
    }

    // Delete old prices for this crop (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await MarketPrice.deleteMany({
      crop: crop.toLowerCase().trim(),
      date: { $lt: sevenDaysAgo },
    });

    // Insert new prices
    await MarketPrice.insertMany(pricesData);

    console.log(`✓ Market prices cached for ${crop} (${pricesData.length} markets)`);
    return true;
  } catch (error) {
    console.error('Error caching market prices:', error.message);
    return false;
  }
};

/**
 * Get market prices from MongoDB cache
 */
const getMarketPrices = async (crop) => {
  try {
    const normalizedCrop = crop.toLowerCase().trim();
    
    const prices = await MarketPrice.find({ crop: normalizedCrop })
      .sort({ modalPrice: -1, date: -1 })
      .limit(20)
      .lean();

    if (!prices || prices.length === 0) {
      return {
        success: false,
        message: 'No market data available for this crop',
        staleData: false,
      };
    }

    // Find best mandi (highest modal price)
    const bestMandi = prices[0];

    // Check if data is stale (older than 12 hours)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const isStale = prices[0].date < twelveHoursAgo;

    // Calculate price trend (compare with older data if available)
    let priceTrend = 'stable';
    const oldPrices = await MarketPrice.find({
      crop: normalizedCrop,
      market: bestMandi.market,
      date: { $lt: prices[0].date },
    })
      .sort({ date: -1 })
      .limit(1)
      .lean();

    if (oldPrices.length > 0) {
      const priceDiff = bestMandi.modalPrice - oldPrices[0].modalPrice;
      if (priceDiff > 50) priceTrend = 'rising';
      else if (priceDiff < -50) priceTrend = 'falling';
    }

    return {
      success: true,
      data: {
        crop: normalizedCrop,
        prices: prices.map((p) => ({
          market: p.market,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          modalPrice: p.modalPrice,
          date: p.date,
          source: p.source,
        })),
        bestMandi: {
          market: bestMandi.market,
          modalPrice: bestMandi.modalPrice,
          trend: priceTrend,
        },
        lastUpdated: prices[0].date,
      },
      staleData: isStale,
    };
  } catch (error) {
    console.error('Error getting market prices:', error.message);
    return {
      success: false,
      message: 'Failed to retrieve market data',
      staleData: false,
    };
  }
};

module.exports = {
  fetchAndCacheMarketPrices,
  getMarketPrices,
};
