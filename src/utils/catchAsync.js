/**
 * Wraps an asynchronous route handler to catch any errors and pass them to the next middleware.
 * @param {function} fn The async route handler function.
 * @returns {function} A new function that handles promise rejections.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;