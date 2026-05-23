import Breeding from '../models/Breeding.js';
import Sow from '../models/Sow.js';
import Boar from '../models/Boar.js';

// @desc    Get all breeding records
// @route   GET /api/breedings
// @access  Private
export const getBreedings = async (req, res, next) => {
  try {
    const breedings = await Breeding.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json(breedings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get breeding by ID
// @route   GET /api/breedings/:id
// @access  Private
export const getBreedingById = async (req, res, next) => {
  try {
    const breeding = await Breeding.findById(req.params.id);
    if (!breeding || breeding.isDeleted) {
      res.status(404);
      throw new Error('Breeding record not found');
    }
    res.status(200).json(breeding);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new breeding record
// @route   POST /api/breedings
// @access  Private
export const createBreeding = async (req, res, next) => {
  try {
    const { sowId, sowNo, boarId, boarNo, heatReferenceId, heatDate, serviceDate, matingType, operator, notes } = req.body;

    const sow = await Sow.findById(sowId);
    const boar = await Boar.findById(boarId);

    if (!sow || !boar) {
      res.status(400);
      throw new Error('Invalid Sow or Boar ID');
    }

    const sDate = new Date(serviceDate || Date.now());
    const pregCheckDate = new Date(sDate.getTime() + (21 * 24 * 60 * 60 * 1000));
    const estFarrowingDate = new Date(sDate.getTime() + (114 * 24 * 60 * 60 * 1000));

    const breeding = await Breeding.create({
      sowId,
      sowNo,
      boarId,
      boarNo,
      heatReferenceId,
      heatDate,
      serviceDate: sDate,
      matingType,
      operator,
      pregnancyCheckDate: pregCheckDate,
      expectedFarrowingDate: estFarrowingDate,
      pregnancyResult: 'Pending Confirmation',
      breedingStatus: 'Pregnancy Pending',
      notes,
      statusHistory: [{
        newStatus: 'Pregnancy Pending',
        updatedBy: operator || 'System',
        notes: 'Breeding record created.'
      }]
    });

    res.status(201).json(breeding);
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm Pregnancy
// @route   PUT /api/breedings/:id/confirm-pregnancy
// @access  Private
export const confirmPregnancy = async (req, res, next) => {
  try {
    const { operator, notes } = req.body;
    const breeding = await Breeding.findById(req.params.id);

    if (!breeding || breeding.isDeleted) {
      res.status(404);
      throw new Error('Breeding record not found');
    }

    breeding.pregnancyResult = 'Pregnant Confirmed';
    breeding.breedingStatus = 'Pregnant Confirmed';
    breeding.statusHistory.push({
      newStatus: 'Pregnant Confirmed',
      updatedBy: operator || 'System',
      notes: notes || 'Pregnancy confirmed via check.'
    });

    const updatedBreeding = await breeding.save();
    res.status(200).json(updatedBreeding);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Failed Breeding
// @route   PUT /api/breedings/:id/fail
// @access  Private
export const markFailedBreeding = async (req, res, next) => {
  try {
    const { operator, notes } = req.body;
    const breeding = await Breeding.findById(req.params.id);

    if (!breeding || breeding.isDeleted) {
      res.status(404);
      throw new Error('Breeding record not found');
    }

    breeding.pregnancyResult = 'Failed Breeding';
    breeding.breedingStatus = 'Failed Breeding';
    breeding.statusHistory.push({
      newStatus: 'Failed Breeding',
      updatedBy: operator || 'System',
      notes: notes || 'Breeding failed or aborted.'
    });

    const updatedBreeding = await breeding.save();
    res.status(200).json(updatedBreeding);
  } catch (error) {
    next(error);
  }
};

// @desc    Return Sow to Heat
// @route   PUT /api/breedings/:id/return-heat
// @access  Private
export const returnToHeat = async (req, res, next) => {
  try {
    const { operator, notes } = req.body;
    const breeding = await Breeding.findById(req.params.id);

    if (!breeding || breeding.isDeleted) {
      res.status(404);
      throw new Error('Breeding record not found');
    }

    breeding.pregnancyResult = 'Returned To Heat';
    breeding.breedingStatus = 'Returned To Heat';
    breeding.statusHistory.push({
      newStatus: 'Returned To Heat',
      updatedBy: operator || 'System',
      notes: notes || 'Sow returned to heat cycle.'
    });

    const updatedBreeding = await breeding.save();
    res.status(200).json(updatedBreeding);
  } catch (error) {
    next(error);
  }
};
