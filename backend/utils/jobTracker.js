/**
 * Job Tracker Utility
 * Tracks execution of background jobs for admin monitoring
 */

const jobStats = {
  weather: {
    lastRun: null,
    nextRun: null,
    successCount: 0,
    failureCount: 0,
    lastError: null,
    isRunning: false,
  },
  market: {
    lastRun: null,
    nextRun: null,
    successCount: 0,
    failureCount: 0,
    lastError: null,
    isRunning: false,
  },
  soil: {
    lastRun: null,
    nextRun: null,
    successCount: 0,
    failureCount: 0,
    lastError: null,
    isRunning: false,
  },
};

const executionLogs = {
  weather: [],
  market: [],
  soil: [],
};

const MAX_LOGS = 50; // Keep last 50 execution logs per job

/**
 * Record job start
 */
const recordJobStart = (jobName) => {
  if (jobStats[jobName]) {
    jobStats[jobName].isRunning = true;
    jobStats[jobName].lastRun = new Date();
  }
};

/**
 * Record job success
 */
const recordJobSuccess = (jobName, details = {}) => {
  if (jobStats[jobName]) {
    jobStats[jobName].isRunning = false;
    jobStats[jobName].successCount++;
    jobStats[jobName].lastError = null;

    // Add to execution logs
    if (executionLogs[jobName]) {
      executionLogs[jobName].unshift({
        timestamp: new Date(),
        status: 'success',
        details,
      });

      // Keep only last MAX_LOGS entries
      if (executionLogs[jobName].length > MAX_LOGS) {
        executionLogs[jobName] = executionLogs[jobName].slice(0, MAX_LOGS);
      }
    }
  }
};

/**
 * Record job failure
 */
const recordJobFailure = (jobName, error) => {
  if (jobStats[jobName]) {
    jobStats[jobName].isRunning = false;
    jobStats[jobName].failureCount++;
    jobStats[jobName].lastError = error.message || String(error);

    // Add to execution logs
    if (executionLogs[jobName]) {
      executionLogs[jobName].unshift({
        timestamp: new Date(),
        status: 'failure',
        error: error.message || String(error),
      });

      // Keep only last MAX_LOGS entries
      if (executionLogs[jobName].length > MAX_LOGS) {
        executionLogs[jobName] = executionLogs[jobName].slice(0, MAX_LOGS);
      }
    }
  }
};

/**
 * Set next run time for a job
 */
const setNextRun = (jobName, nextRunDate) => {
  if (jobStats[jobName]) {
    jobStats[jobName].nextRun = nextRunDate;
  }
};

/**
 * Get all job statistics
 */
const getAllJobStats = () => {
  return {
    jobs: Object.keys(jobStats).map((jobName) => ({
      name: jobName,
      ...jobStats[jobName],
      recentLogs: executionLogs[jobName]?.slice(0, 10) || [],
    })),
  };
};

/**
 * Get statistics for a specific job
 */
const getJobStats = (jobName) => {
  if (!jobStats[jobName]) {
    return null;
  }

  return {
    name: jobName,
    ...jobStats[jobName],
    recentLogs: executionLogs[jobName]?.slice(0, 10) || [],
  };
};

/**
 * Reset statistics for a job
 */
const resetJobStats = (jobName) => {
  if (jobStats[jobName]) {
    jobStats[jobName].successCount = 0;
    jobStats[jobName].failureCount = 0;
    jobStats[jobName].lastError = null;
    executionLogs[jobName] = [];
  }
};

module.exports = {
  recordJobStart,
  recordJobSuccess,
  recordJobFailure,
  setNextRun,
  getAllJobStats,
  getJobStats,
  resetJobStats,
};
