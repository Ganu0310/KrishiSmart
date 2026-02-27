const cron = require('node-cron');
const weatherJob = require('./weatherJob');
const marketJob = require('./marketJob');
const soilJob = require('./soilJob');
const { setNextRun } = require('../utils/jobTracker');

const jobs = [];

/**
 * Calculate next run time based on cron expression
 */
const getNextRunTime = (cronExpression) => {
  // Simple calculation - in production use a cron parser library
  const now = new Date();
  
  if (cronExpression === '0 * * * *') { // Every hour
    const next = new Date(now);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  } else if (cronExpression === '0 */6 * * *') { // Every 6 hours
    const next = new Date(now);
    next.setHours(next.getHours() + 6, 0, 0, 0);
    return next;
  } else if (cronExpression === '0 */12 * * *') { // Every 12 hours
    const next = new Date(now);
    next.setHours(next.getHours() + 12, 0, 0, 0);
    return next;
  }
  return null;
};

const startJobs = () => {
  console.log('\n🚀 Starting background jobs...\n');

  // Weather job - runs every hour
  const weatherCron = cron.schedule('0 * * * *', weatherJob);
  jobs.push({ name: 'weather', cron: weatherCron });
  setNextRun('weather', getNextRunTime('0 * * * *'));
  console.log('🌤️  [Weather Job] Scheduled to run every hour');
  console.log('🌤️  [Weather Job] Running initial fetch...');
  weatherJob();

  // Market job - runs every 6 hours
  const marketCron = cron.schedule('0 */6 * * *', marketJob);
  jobs.push({ name: 'market', cron: marketCron });
  setNextRun('market', getNextRunTime('0 */6 * * *'));
  console.log('💰 [Market Job] Scheduled to run every 6 hours');
  console.log('💰 [Market Job] Running initial fetch...');
  marketJob();

  // Soil job - runs every 12 hours
  const soilCron = cron.schedule('0 */12 * * *', soilJob);
  jobs.push({ name: 'soil', cron: soilCron });
  setNextRun('soil', getNextRunTime('0 */12 * * *'));
  console.log('🌱 [Soil Job] Scheduled to run every 12 hours');
  console.log('🌱 [Soil Job] Running initial fetch...');
  soilJob();

  console.log('\n✓ All background jobs initialized successfully\n');
};

const stopJobs = () => {
  console.log('\n🛑 Stopping background jobs...');
  jobs.forEach((job) => {
    job.cron.stop();
    console.log(`✓ Stopped ${job.name} job`);
  });
  console.log('✓ All jobs stopped\n');
};

module.exports = { startJobs, stopJobs };
