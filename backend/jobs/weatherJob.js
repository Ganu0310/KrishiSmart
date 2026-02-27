const { fetchAndCacheWeather } = require('../services/weatherService');
const { recordJobStart, recordJobSuccess, recordJobFailure } = require('../utils/jobTracker');

// Predefined locations to fetch weather for
const LOCATIONS = [
  'Nashik',
  'Pune',
  'Mumbai',
  'Ahmednagar',
  'Solapur',
  'Sangli',
  'Satara',
  'Kolhapur',
];

/**
 * Weather Job - Runs every 1 hour
 * Fetches weather data for all predefined locations
 */
const weatherJob = async () => {
  console.log('\n🌤️  [Weather Job] Starting weather data fetch...');
  const startTime = Date.now();

  recordJobStart('weather');

  try {
    const results = await Promise.allSettled(
      LOCATIONS.map((location) => fetchAndCacheWeather(location))
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✓ [Weather Job] Completed in ${duration}s - Success: ${successful}, Failed: ${failed}`
    );

    recordJobSuccess('weather', {
      duration,
      successful,
      failed,
      locations: LOCATIONS.length,
    });
  } catch (error) {
    console.error('❌ [Weather Job] Fatal error:', error.message);
    recordJobFailure('weather', error);
  }
};

module.exports = weatherJob;
