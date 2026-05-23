import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication endpoints
router.post('/signup', signup);
router.post('/login', login);

// Protected session validation endpoint
router.get('/me', protect, getMe);

export default router;
