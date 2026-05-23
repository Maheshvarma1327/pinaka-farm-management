import Animal from '../models/Animal.js';

// @desc    Get all animals
// @route   GET /api/animals
// @access  Private
export const getAnimals = async (req, res, next) => {
  try {
    const animals = await Animal.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json(animals);
  } catch (error) {
    next(error);
  }
};

// @desc    Get animal by ID
// @route   GET /api/animals/:id
// @access  Private
export const getAnimalById = async (req, res, next) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal || animal.isDeleted) {
      res.status(404);
      throw new Error('Animal not found');
    }
    res.status(200).json(animal);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new animal
// @route   POST /api/animals
// @access  Private
export const registerAnimal = async (req, res, next) => {
  try {
    const { 
      animalNo, 
      earTag, 
      dob, 
      sex, 
      breed, 
      currentWeight, 
      source, 
      supplier, 
      lifecycleStage, 
      currentPen,
      operator,
      notes 
    } = req.body;

    const exists = await Animal.findOne({ animalNo });
    if (exists) {
      res.status(400);
      throw new Error('Animal Number already exists');
    }

    const animal = await Animal.create({
      animalNo,
      earTag,
      dob,
      sex,
      breed,
      currentWeight,
      source,
      supplier,
      lifecycleStage: lifecycleStage || 'Piglet',
      currentPen,
      operationalStatus: 'Active',
      operator,
      notes
    });

    res.status(201).json(animal);
  } catch (error) {
    next(error);
  }
};

// @desc    Update animal record
// @route   PUT /api/animals/:id
// @access  Private
export const updateAnimal = async (req, res, next) => {
  try {
    const animal = await Animal.findById(req.params.id);

    if (!animal || animal.isDeleted) {
      res.status(404);
      throw new Error('Animal not found');
    }

    // Disallow changing the core animalNo after creation for safety
    const { animalNo, ...updateFields } = req.body;

    Object.assign(animal, updateFields);
    const updatedAnimal = await animal.save();
    
    res.status(200).json(updatedAnimal);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete animal
// @route   DELETE /api/animals/:id
// @access  Private
export const deleteAnimal = async (req, res, next) => {
  try {
    const animal = await Animal.findById(req.params.id);

    if (!animal || animal.isDeleted) {
      res.status(404);
      throw new Error('Animal not found');
    }

    animal.isDeleted = true;
    animal.lifecycleStage = 'Dead';
    animal.operationalStatus = 'Culled';
    await animal.save();
    
    res.status(200).json({ message: 'Animal logically removed' });
  } catch (error) {
    next(error);
  }
};
