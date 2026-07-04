/**
 * Wraps an async Express route/controller function so any thrown error
 * or rejected promise is automatically forwarded to next(), which routes
 * it to the central error-handling middleware. Avoids repetitive try/catch
 * blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
