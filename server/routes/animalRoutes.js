import express from 'express';
import {
  getAnimals,
  getAnimalById,
  registerAnimal,
  updateAnimal,
  deleteAnimal
} from '../controllers/animalController.js';

const router = express.Router();

router.route('/')
  .get(getAnimals)
  .post(registerAnimal);

router.route('/:id')
  .get(getAnimalById)
  .put(updateAnimal)
  .delete(deleteAnimal);

export default router;
