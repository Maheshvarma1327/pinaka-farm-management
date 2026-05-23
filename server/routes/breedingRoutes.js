import express from 'express';
import {
  getBreedings,
  getBreedingById,
  createBreeding,
  confirmPregnancy,
  markFailedBreeding,
  returnToHeat
} from '../controllers/breedingController.js';

const router = express.Router();

router.route('/')
  .get(getBreedings)
  .post(createBreeding);

router.route('/:id')
  .get(getBreedingById);

router.route('/:id/confirm-pregnancy')
  .put(confirmPregnancy);

router.route('/:id/fail')
  .put(markFailedBreeding);

router.route('/:id/return-heat')
  .put(returnToHeat);

export default router;
