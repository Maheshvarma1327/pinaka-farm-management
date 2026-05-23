import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CustomError from '../utils/customError.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * Signs standard JSON Web Token containing identity and RBAC parameters.
 */
const signToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      status: user.status 
    },
    process.env.JWT_SECRET || 'pinaka_super_secure_enterprise_secret_key_2026',
    { expiresIn: '24h' }
  );
};

/**
 * Register a new farm user account.
 */
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // 1. Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('This email address is already registered. Please log in.', 400);
  }

  // 2. Prevent arbitrary admin accounts during registration - force first user to Admin, others to Viewer/role
  const isFirstUser = (await User.countDocuments({})) === 0;
  const finalRole = isFirstUser ? 'Admin' : (role || 'Viewer');

  // 3. Create the user
  const newUser = await User.create({
    name,
    email,
    password,
    role: finalRole
  });

  // 4. Generate JWT
  const token = signToken(newUser);

  // 5. Exclude password from return payload
  newUser.password = undefined;

  apiResponse(res, 201, { user: newUser, token }, 'User account registered successfully');
});

/**
 * Authenticate existing user credentials.
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    throw new CustomError('Please provide both email address and password.', 400);
  }

  // 2. Locate user and explicitly request hashed password selection
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new CustomError('Invalid credentials. Please verify your email and password.', 401);
  }

  // 3. Check if user account is deactivated
  if (user.status === 'Inactive') {
    throw new CustomError('Your account has been deactivated. Please contact the administrator.', 403);
  }

  // 4. Sign JWT
  const token = signToken(user);

  // 5. Clear password from response
  user.password = undefined;

  apiResponse(res, 200, { user, token }, 'Logged in successfully');
});

/**
 * Fetch profile details of current session holder.
 */
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new CustomError('Session user no longer exists.', 404);
  }

  apiResponse(res, 200, { user }, 'Session verified');
});

export default { signup, login, getMe };
