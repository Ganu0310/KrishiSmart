const WeatherCache = require('../models/WeatherCache');
const { fetchWeatherData } = require('../adapters/weatherAdapter');

/**
 * Fetch weather data from external API and cache in MongoDB
 */
const fetchAndCacheWeather = async (location) => {
  try {
    const weatherData = await fetchWeatherData(location);
    
    if (!weatherData) {
      console.log(`Failed to fetch weather for ${location}, keeping existing cache`);
      return false;
    }

    // Update or create weather cache entry
    await WeatherCache.findOneAndUpdate(
      { location: location.toLowerCase().trim() },
      weatherData,
      { upsert: true, new: true }
    );

    console.log(`✓ Weather cached for ${location}`);
    return true;
  } catch (error) {
    console.error('Error caching weather:', error.message);
    return false;
  }
};

/**
 * Get current weather from MongoDB cache
 */
const getCurrentWeather = async (location) => {
  try {
    const normalizedLocation = location.toLowerCase().trim();
    
    const cached = await WeatherCache.findOne({ location: normalizedLocation })
      .sort({ updatedAt: -1 })
      .lean();

    if (!cached) {
      console.log(`[Weather] No cache and live fetch failed for ${location}. Providing fallback data.`);
      return {
        success: true,
        data: {
          location: normalizedLocation,
          rainfall: 0,
          temperature: 28.5,
          humidity: 55,
          windSpeed: 10,
          weatherDescription: 'clear sky',
          warning: '',
          lastUpdated: new Date(),
        },
        staleData: true,
      };
    }

    // Check if data is stale (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const isStale = cached.updatedAt < twoHoursAgo;

    return {
      success: true,
      data: {
        location: cached.location,
        rainfall: cached.rainfall,
        temperature: cached.temperature,
        humidity: cached.humidity,
        windSpeed: cached.windSpeed,
        weatherDescription: cached.weatherDescription,
        warning: cached.warning,
        lastUpdated: cached.updatedAt,
      },
      staleData: isStale,
    };
  } catch (error) {
    console.error('Error getting weather:', error.message);
    return {
      success: false,
      message: 'Failed to retrieve weather data',
      staleData: false,
    };
  }
};

module.exports = {
  fetchAndCacheWeather,
  getCurrentWeather,
};
