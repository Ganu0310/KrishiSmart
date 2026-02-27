const { fetchAndCacheMarketPrices } = require('../services/marketService');
const { recordJobStart, recordJobSuccess, recordJobFailure } = require('../utils/jobTracker');

// Supported crops
const CROPS = ['grape', 'onion', 'tomato', 'wheat', 'rice'];

/**
 * Market Job - Runs every 6 hours
 * Fetches market prices for all supported crops
 */
const marketJob = async () => {
  console.log('\n💰 [Market Job] Starting market price fetch...');
  const startTime = Date.now();

  recordJobStart('market');

  try {
    const results = await Promise.allSettled(
      CROPS.map((crop) => fetchAndCacheMarketPrices(crop))
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✓ [Market Job] Completed in ${duration}s - Success: ${successful}, Failed: ${failed}`
    );

    recordJobSuccess('market', {
      duration,
      successful,
      failed,
      crops: CROPS.length,
    });
  } catch (error) {
    console.error('❌ [Market Job] Fatal error:', error.message);
    recordJobFailure('market', error);
  }
};

module.exports = marketJob;
