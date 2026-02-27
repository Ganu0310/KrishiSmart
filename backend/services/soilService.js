const SoilCondition = require('../models/SoilCondition');
const { fetchSoilData } = require('../adapters/soilAdapter');

/**
 * Fetch soil data from external API and cache in MongoDB
 */
const fetchAndCacheSoilData = async (location) => {
  try {
    const soilData = await fetchSoilData(location);
    
    if (!soilData) {
      console.log(`Failed to fetch soil data for ${location}, keeping existing cache`);
      return false;
    }

    // Update or create soil condition entry
    await SoilCondition.findOneAndUpdate(
      { location: location.toLowerCase().trim() },
      soilData,
      { upsert: true, new: true }
    );

    console.log(`✓ Soil data cached for ${location}`);
    return true;
  } catch (error) {
    console.error('Error caching soil data:', error.message);
    return false;
  }
};

/**
 * Get soil condition from MongoDB cache
 */
const getSoilCondition = async (location) => {
  try {
    const normalizedLocation = location.toLowerCase().trim();
    
    const cached = await SoilCondition.findOne({ location: normalizedLocation })
      .sort({ lastUpdated: -1 })
      .lean();

    if (!cached) {
      // Return safe default values if no data
      return {
        success: true,
        data: {
          location,
          soilMoisture: 'medium',
          droughtRisk: 'low',
          lastUpdated: null,
          note: 'Using default values - no data available for this location',
        },
        staleData: true,
      };
    }

    // Check if data is stale (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isStale = cached.lastUpdated < twentyFourHoursAgo;

    return {
      success: true,
      data: {
        location: cached.location,
        soilMoisture: cached.soilMoisture,
        droughtRisk: cached.droughtRisk,
        lastUpdated: cached.lastUpdated,
      },
      staleData: isStale,
    };
  } catch (error) {
    console.error('Error getting soil condition:', error.message);
    return {
      success: false,
      message: 'Failed to retrieve soil data',
      staleData: false,
    };
  }
};

module.exports = {
  fetchAndCacheSoilData,
  getSoilCondition,
};
