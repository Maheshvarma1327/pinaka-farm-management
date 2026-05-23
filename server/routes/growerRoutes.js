import express from 'express';
import { 
  getGrowers, 
  getGrowerById, 
  createGrower, 
  updateGrower, 
  deleteGrower, 
  addGrowerWeight, 
  updateGrowerWeight, 
  deleteGrowerWeight, 
  updateGrowerStatus,
  promoteGrowerToSow,
  promoteGrowerToBoar
} from '../controllers/growerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection universally to all grower routes
router.use(protect);

// Base REST routes
router.route('/')
  .get(getGrowers)
  .post(restrictTo('Admin', 'Farm Worker'), createGrower);

router.route('/:id')
  .get(getGrowerById)
  .put(restrictTo('Admin', 'Farm Worker'), updateGrower)
  .delete(restrictTo('Admin'), deleteGrower);

// Weight APIs (supporting both singular and plural sub-resource paths)
router.route('/:id/weights')
  .post(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), addGrowerWeight);

router.route('/:id/weight')
  .post(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), addGrowerWeight);

router.route('/:id/weights/:weightId')
  .put(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), updateGrowerWeight)
  .delete(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), deleteGrowerWeight);

router.route('/:id/weight/:weightId')
  .put(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), updateGrowerWeight)
  .delete(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), deleteGrowerWeight);

// Breeder Promotion APIs
router.post('/:id/promote/sow', restrictTo('Admin', 'Farm Worker'), promoteGrowerToSow);
router.post('/:id/promote/boar', restrictTo('Admin', 'Farm Worker'), promoteGrowerToBoar);

// Status Transition API
router.route('/:id/status')
  .post(restrictTo('Admin', 'Farm Worker', 'Veterinarian'), updateGrowerStatus);

export default router;
