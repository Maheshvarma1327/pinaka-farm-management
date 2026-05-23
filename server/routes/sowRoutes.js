import express from 'express';
import {
  createSow,
  importFromGrower,
  getSows,
  getSowById,
  addHeatRecord,
  addBreedingRecord,
  confirmPregnancy,
  addFarrowingRecord,
  addTreatmentRecord,
  getHeatAlerts
} from '../controllers/sowController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection universally to all sow routes
router.use(protect);

// Global alerts route (placed before dynamic parameters to avoid route collision)
router.get('/heat-alerts', getHeatAlerts);

// Base REST routes
router.route('/')
  .get(getSows)
  .post(restrictTo('Admin', 'Farm Worker'), createSow);

router.post('/import-grower', restrictTo('Admin', 'Farm Worker'), importFromGrower);

router.route('/:id')
  .get(getSowById);

// Reproductive and Mating workflows
router.post('/:id/heat', restrictTo('Admin', 'Farm Worker'), addHeatRecord);
router.post('/:id/breeding', restrictTo('Admin', 'Farm Worker'), addBreedingRecord);
router.post('/:id/pregnancy', restrictTo('Admin', 'Farm Worker'), confirmPregnancy);
router.post('/:id/farrowing', restrictTo('Admin', 'Farm Worker'), addFarrowingRecord);
router.post('/:id/treatment', restrictTo('Admin', 'Farm Worker', 'Veterinarian'), addTreatmentRecord);

export default router;
