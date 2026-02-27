const { getAllJobStats } = require('../utils/jobTracker');
const { getCacheStatistics, getDataQuality, clearCache } = require('../utils/cacheAnalyzer');
const weatherService = require('../services/weatherService');
const marketService = require('../services/marketService');
const soilService = require('../services/soilService');

/**
 * @desc    Get status of all background jobs
 * @route   GET /api/admin/gov-data/jobs
 * @access  Admin
 */
const getJobStatus = async (req, res) => {
  try {
    const jobStats = getAllJobStats();

    res.json({
      success: true,
      ...jobStats,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job status',
    });
  }
};

/**
 * @desc    Get cache statistics for all data sources
 * @route   GET /api/admin/gov-data/cache-stats
 * @access  Admin
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = await getCacheStatistics();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
    });
  }
};

/**
 * @desc    Manually trigger data refresh for a specific source
 * @route   POST /api/admin/gov-data/refresh/:source
 * @access  Admin
 */
const manualRefresh = async (req, res) => {
  try {
    const { source } = req.params;
    const validSources = ['weather', 'market', 'soil'];

    if (!validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        message: `Invalid source. Must be one of: ${validSources.join(', ')}`,
      });
    }

    let result;

    switch (source) {
      case 'weather':
        // Fetch weather for all locations
        const weatherLocations = ['Nashik', 'Pune', 'Mumbai', 'Ahmednagar', 'Solapur', 'Sangli', 'Satara', 'Kolhapur'];
        const weatherPromises = weatherLocations.map((location) =>
          weatherService.fetchAndCacheWeather(location)
        );
        await Promise.all(weatherPromises);
        result = { locationsUpdated: weatherLocations.length };
        break;

      case 'market':
        // Fetch market prices for all crops
        const crops = ['grape', 'onion', 'tomato', 'wheat', 'rice'];
        const marketPromises = crops.map((crop) =>
          marketService.fetchAndCacheMarketPrices(crop)
        );
        await Promise.all(marketPromises);
        result = { cropsUpdated: crops.length };
        break;

      case 'soil':
        // Fetch soil data for all locations
        const soilLocations = ['Nashik', 'Pune', 'Mumbai', 'Ahmednagar', 'Solapur', 'Sangli', 'Satara', 'Kolhapur'];
        const soilPromises = soilLocations.map((location) =>
          soilService.fetchAndCacheSoil(location)
        );
        await Promise.all(soilPromises);
        result = { locationsUpdated: soilLocations.length };
        break;
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('data_refreshed', { source, timestamp: new Date() });
    }

    res.json({
      success: true,
      message: `${source} data refreshed successfully`,
      ...result,
    });
  } catch (error) {
    console.error('Manual refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh data',
      error: error.message,
    });
  }
};

/**
 * @desc    Get API usage statistics
 * @route   GET /api/admin/gov-data/api-usage
 * @access  Admin
 */
const getApiUsage = async (req, res) => {
  try {
    // This is a simplified version. In production, you'd track actual API calls
    const usage = {
      openWeather: {
        callsToday: 0, // Would be tracked in real implementation
        limit: 1000, // Free tier limit
        remaining: 1000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      agmarknet: {
        callsToday: 0,
        limit: 10000,
        remaining: 10000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      soilApi: {
        callsToday: 0,
        limit: 5000,
        remaining: 5000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    };

    res.json({
      success: true,
      usage,
      note: 'API usage tracking is simplified. Implement detailed tracking for production.',
    });
  } catch (error) {
    console.error('Get API usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API usage',
    });
  }
};

/**
 * @desc    Clear cache for a specific data source
 * @route   DELETE /api/admin/gov-data/cache/:source
 * @access  Admin
 */
const clearCacheBySource = async (req, res) => {
  try {
    const { source } = req.params;
    const validSources = ['weather', 'market', 'soil', 'advisory'];

    if (!validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        message: `Invalid source. Must be one of: ${validSources.join(', ')}`,
      });
    }

    const result = await clearCache(source);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('cache_cleared', { source, timestamp: new Date() });
    }

    res.json({
      success: true,
      message: `${source} cache cleared successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
};

/**
 * @desc    Get data quality metrics
 * @route   GET /api/admin/gov-data/data-quality
 * @access  Admin
 */
const getDataQualityMetrics = async (req, res) => {
  try {
    const quality = await getDataQuality();

    res.json({
      success: true,
      quality,
    });
  } catch (error) {
    console.error('Get data quality error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data quality metrics',
    });
  }
};

module.exports = {
  getJobStatus,
  getCacheStats,
  manualRefresh,
  getApiUsage,
  clearCacheBySource,
  getDataQualityMetrics,
};
