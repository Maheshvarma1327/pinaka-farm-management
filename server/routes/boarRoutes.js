import express from 'express';
import {
  createBoar,
  importFromGrower,
  getBoars,
  getBoarById,
  updateBoarStatus,
  markPuberty,
  markBreedingReady,
  markBreedingActive,
  getBoarAnalytics,
  getBoarServiceHistory
} from '../controllers/boarController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware universally to all boar routes
router.use(protect);

// Base CRUD REST endpoints
router.route('/')
  .get(getBoars)
  .post(restrictTo('Admin', 'Farm Worker'), createBoar);

router.post('/import-grower', restrictTo('Admin', 'Farm Worker'), importFromGrower);

router.route('/:id')
  .get(getBoarById);

// Reproductive tracking and status transitions
router.put('/:id/status', restrictTo('Admin', 'Farm Worker'), updateBoarStatus);
router.put('/:id/puberty', restrictTo('Admin', 'Farm Worker'), markPuberty);
router.put('/:id/breeding-ready', restrictTo('Admin', 'Farm Worker'), markBreedingReady);
router.put('/:id/breeding-active', restrictTo('Admin', 'Farm Worker'), markBreedingActive);

// Analytics and references history
router.get('/:id/analytics', getBoarAnalytics);
router.get('/:id/service-history', getBoarServiceHistory);

export default router;
