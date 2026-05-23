import CustomError from '../utils/customError.js';

/**
 * Express middleware to capture and process all backend exceptions,
 * outputting standard JSON payloads.
 */
export const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log detailed error stack during development
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.error('\x1b[31m[API Router Exception]:\x1b[0m', err);
  }

  // 1. Mongoose Bad ObjectId cast error
  if (err.name === 'CastError') {
    const message = `Resource not found under specified ID: ${err.value}`;
    error = new CustomError(message, 404);
  }

  // 2. MongoDB Duplicate Key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value entry: '${value}' already exists for field '${field}'.`;
    error = new CustomError(message, 400);
  }

  // 3. Mongoose Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new CustomError(message, 400);
  }

  // 4. JWT invalid signature error
  if (err.name === 'JsonWebTokenError') {
    error = new CustomError('Access token is invalid or corrupt. Please re-authenticate.', 401);
  }

  // 5. JWT token expired error
  if (err.name === 'TokenExpiredError') {
    error = new CustomError('Your login session has expired. Please log in again.', 401);
  }

  // Generate standardized response payload
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    status: error.status || 'error',
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorMiddleware;
