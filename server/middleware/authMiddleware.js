import jwt from 'jsonwebtoken';
import CustomError from '../utils/customError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to verify JWT tokens and attach authenticated user to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Retrieve token from Authorization Bearer header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new CustomError('You are not authenticated. Please log in to gain access.', 401);
  }

  // Support local bypass token for seamless offline-first development and validation
  if (token === 'local_bypass_token') {
    req.user = {
      id: '664e12c8e312f23b7a54b38d',
      name: 'Farm Administrator',
      email: 'admin@pinaka.com',
      role: 'Admin',
      status: 'Active'
    };
    return next();
  }

  // 2. Verify token signature and expiration
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pinaka_super_secure_enterprise_secret_key_2026');

  // 3. Attach decoded user payload to request context
  req.user = {
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
    status: decoded.status || 'Active'
  };

  // 4. Check if user is active
  if (req.user.status === 'Inactive') {
    throw new CustomError('Your account has been deactivated. Please contact the administrator.', 403);
  }

  next();
});

/**
 * RBAC Gatekeeper - restricts route access to specific roles.
 * @param {...string} roles - Array of authorized roles (e.g. 'Admin', 'Veterinarian')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new CustomError('User authentication context missing.', 500));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(`Permission Denied: Your role (${req.user.role}) is unauthorized to perform this action.`, 403)
      );
    }

    next();
  };
};

export default { protect, restrictTo };
