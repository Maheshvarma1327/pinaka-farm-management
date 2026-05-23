/**
 * Wraps asynchronous Express route handlers to automatically catch errors
 * and forward them to the global error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
