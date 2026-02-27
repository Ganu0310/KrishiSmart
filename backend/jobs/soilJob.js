const { fetchAndCacheSoilData } = require('../services/soilService');
const { recordJobStart, recordJobSuccess, recordJobFailure } = require('../utils/jobTracker');

// Predefined locations to fetch soil data for
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
 * Soil Job - Runs every 12 hours
 * Fetches soil condition data for all predefined locations
 */
const soilJob = async () => {
  console.log('\n🌱 [Soil Job] Starting soil data fetch...');
  const startTime = Date.now();

  recordJobStart('soil');

  try {
    const results = await Promise.allSettled(
      LOCATIONS.map((location) => fetchAndCacheSoilData(location))
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✓ [Soil Job] Completed in ${duration}s - Success: ${successful}, Failed: ${failed}`
    );

    recordJobSuccess('soil', {
      duration,
      successful,
      failed,
      locations: LOCATIONS.length,
    });
  } catch (error) {
    console.error('❌ [Soil Job] Fatal error:', error.message);
    recordJobFailure('soil', error);
  }
};

module.exports = soilJob;
