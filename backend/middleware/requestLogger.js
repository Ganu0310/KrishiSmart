/**
 * Request Logger Middleware
 * Logs each request with method, URL, status code, and response time.
 * Replaces the basic console.log in server.js with structured output.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Color-code status for terminal readability
    let statusStr = `${statusCode}`;
    if (statusCode >= 500) statusStr = `\x1b[31m${statusCode}\x1b[0m`;      // Red
    else if (statusCode >= 400) statusStr = `\x1b[33m${statusCode}\x1b[0m`; // Yellow
    else if (statusCode >= 200) statusStr = `\x1b[32m${statusCode}\x1b[0m`; // Green

    const method = req.method.padEnd(6);
    const url = req.originalUrl || req.url;

    console.log(`[${new Date().toISOString()}] ${method} ${url} → ${statusStr} (${duration}ms)`);
  });

  next();
};

module.exports = requestLogger;
