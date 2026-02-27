/**
 * Cache Analyzer Utility
 * Analyzes cached government data for admin monitoring
 */

const WeatherCache = require('../models/WeatherCache');
const MarketPrice = require('../models/MarketPrice');
const SoilCondition = require('../models/SoilCondition');
const Advisory = require('../models/Advisory');

/**
 * Get cache statistics for all data sources
 */
const getCacheStatistics = async () => {
  try {
    // Weather cache stats
    const weatherCount = await WeatherCache.countDocuments();
    const weatherStale = await WeatherCache.countDocuments({
      updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Older than 2 hours
    });
    const weatherLatest = await WeatherCache.findOne().sort({ updatedAt: -1 });

    // Market price stats
    const marketCount = await MarketPrice.countDocuments();
    const marketStale = await MarketPrice.countDocuments({
      lastUpdated: { $lt: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // Older than 12 hours
    });
    const marketLatest = await MarketPrice.findOne().sort({ lastUpdated: -1 });

    // Soil condition stats
    const soilCount = await SoilCondition.countDocuments();
    const soilStale = await SoilCondition.countDocuments({
      lastUpdated: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
    });
    const soilLatest = await SoilCondition.findOne().sort({ lastUpdated: -1 });

    // Advisory stats
    const advisoryCount = await Advisory.countDocuments();
    const advisoryStale = await Advisory.countDocuments({
      generatedAt: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // Older than 6 hours
    });
    const advisoryLatest = await Advisory.findOne().sort({ generatedAt: -1 });

    return {
      weather: {
        totalRecords: weatherCount,
        staleRecords: weatherStale,
        freshRecords: weatherCount - weatherStale,
        stalePercentage: weatherCount > 0 ? ((weatherStale / weatherCount) * 100).toFixed(1) : 0,
        lastUpdated: weatherLatest?.updatedAt || null,
        locations: await WeatherCache.distinct('location'),
      },
      market: {
        totalRecords: marketCount,
        staleRecords: marketStale,
        freshRecords: marketCount - marketStale,
        stalePercentage: marketCount > 0 ? ((marketStale / marketCount) * 100).toFixed(1) : 0,
        lastUpdated: marketLatest?.lastUpdated || null,
        crops: await MarketPrice.distinct('crop'),
        markets: await MarketPrice.distinct('market'),
      },
      soil: {
        totalRecords: soilCount,
        staleRecords: soilStale,
        freshRecords: soilCount - soilStale,
        stalePercentage: soilCount > 0 ? ((soilStale / soilCount) * 100).toFixed(1) : 0,
        lastUpdated: soilLatest?.lastUpdated || null,
        locations: await SoilCondition.distinct('location'),
      },
      advisory: {
        totalRecords: advisoryCount,
        staleRecords: advisoryStale,
        freshRecords: advisoryCount - advisoryStale,
        stalePercentage: advisoryCount > 0 ? ((advisoryStale / advisoryCount) * 100).toFixed(1) : 0,
        lastUpdated: advisoryLatest?.generatedAt || null,
        crops: await Advisory.distinct('crop'),
        locations: await Advisory.distinct('location'),
      },
    };
  } catch (error) {
    console.error('Cache statistics error:', error);
    throw error;
  }
};

/**
 * Get data quality metrics
 */
const getDataQuality = async () => {
  try {
    const expectedLocations = ['Nashik', 'Pune', 'Mumbai', 'Ahmednagar', 'Solapur', 'Sangli', 'Satara', 'Kolhapur'];
    const expectedCrops = ['grape', 'onion', 'tomato', 'wheat', 'rice'];

    // Check location coverage for weather and soil
    const weatherLocations = await WeatherCache.distinct('location');
    const soilLocations = await SoilCondition.distinct('location');

    // Check crop coverage for market
    const marketCrops = await MarketPrice.distinct('crop');

    // Calculate coverage percentages
    const weatherCoverage = (weatherLocations.length / expectedLocations.length) * 100;
    const soilCoverage = (soilLocations.length / expectedLocations.length) * 100;
    const marketCoverage = (marketCrops.length / expectedCrops.length) * 100;

    // Find missing data
    const missingWeatherLocations = expectedLocations.filter(
      (loc) => !weatherLocations.includes(loc)
    );
    const missingSoilLocations = expectedLocations.filter(
      (loc) => !soilLocations.includes(loc)
    );
    const missingMarketCrops = expectedCrops.filter(
      (crop) => !marketCrops.includes(crop)
    );

    return {
      coverage: {
        weather: weatherCoverage.toFixed(1),
        soil: soilCoverage.toFixed(1),
        market: marketCoverage.toFixed(1),
        overall: ((weatherCoverage + soilCoverage + marketCoverage) / 3).toFixed(1),
      },
      missing: {
        weatherLocations: missingWeatherLocations,
        soilLocations: missingSoilLocations,
        marketCrops: missingMarketCrops,
      },
      completeness: {
        weather: weatherLocations.length >= expectedLocations.length,
        soil: soilLocations.length >= expectedLocations.length,
        market: marketCrops.length >= expectedCrops.length,
      },
    };
  } catch (error) {
    console.error('Data quality error:', error);
    throw error;
  }
};

/**
 * Clear cache for a specific source
 */
const clearCache = async (source) => {
  try {
    let result;

    switch (source) {
      case 'weather':
        result = await WeatherCache.deleteMany({});
        break;
      case 'market':
        result = await MarketPrice.deleteMany({});
        break;
      case 'soil':
        result = await SoilCondition.deleteMany({});
        break;
      case 'advisory':
        result = await Advisory.deleteMany({});
        break;
      default:
        throw new Error('Invalid source');
    }

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error('Clear cache error:', error);
    throw error;
  }
};

module.exports = {
  getCacheStatistics,
  getDataQuality,
  clearCache,
};
