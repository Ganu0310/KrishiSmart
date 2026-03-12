/**
 * asyncHandler - eliminates try/catch boilerplate in async route handlers.
 * Wraps an async function and passes any thrown error to next() so the
 * global error handler catches it automatically.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
