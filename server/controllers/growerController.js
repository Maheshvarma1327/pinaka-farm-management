import Grower from '../models/Grower.js';
import Sow from '../models/Sow.js';
import Boar from '../models/Boar.js';
import CustomError from '../utils/customError.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * Fetch all grower records, ignoring soft-deleted ones.
 */
export const getGrowers = asyncHandler(async (req, res, next) => {
  const { status, penNo, sex, search } = req.query;
  const filter = { isDeleted: false };
  
  if (status) filter.status = status;
  if (penNo) filter.penNo = penNo;
  if (sex) filter.sex = sex;
  if (search) {
    filter.$or = [
      { animalNo: { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } },
      { penNo: { $regex: search, $options: 'i' } }
    ];
  }

  const growers = await Grower.find(filter).sort({ createdAt: -1 });
  apiResponse(res, 200, growers, 'Grower records retrieved successfully');
});

/**
 * Fetch detail card for a single grower.
 */
export const getGrowerById = asyncHandler(async (req, res, next) => {
  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }
  apiResponse(res, 200, grower, 'Grower details retrieved successfully');
});

/**
 * Create/register a new grower record.
 */
export const createGrower = asyncHandler(async (req, res, next) => {
  const { animalNo, dob, sex, breed, sireNo, damNo, birthWeight, weaningWeight, penNo, status, notes } = req.body;

  // 1. Double check unique ID
  const existing = await Grower.findOne({ animalNo: animalNo.toUpperCase(), isDeleted: false });
  if (existing) {
    throw new CustomError(`Animal Number ID '${animalNo}' already exists in active registers.`, 400);
  }

  const grower = new Grower({
    animalNo,
    dob,
    sex,
    breed,
    sireNo,
    damNo,
    birthWeight,
    weaningWeight,
    penNo,
    status,
    notes,
    createdBy: req.user ? req.user.id : null
  });

  // If weaning weight is supplied at creation, populate weaning weight log
  if (weaningWeight) {
    grower.weightLogs.push({
      date: new Date(),
      type: 'Weaning',
      weight: weaningWeight,
      notes: 'Initial weaning weight',
      enteredBy: req.user ? req.user.name : 'System'
    });
  }

  const saved = await grower.save();
  apiResponse(res, 201, saved, 'Grower record registered successfully');
});

/**
 * Update general core grower fields.
 */
export const updateGrower = asyncHandler(async (req, res, next) => {
  const { sex, breed, sireNo, damNo, penNo, notes, weaningWeight, slaughterDate } = req.body;

  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  if (sex) grower.sex = sex;
  if (breed) grower.breed = breed;
  if (sireNo) grower.sireNo = sireNo;
  if (damNo) grower.damNo = damNo;
  if (penNo) grower.penNo = penNo;
  if (notes !== undefined) grower.notes = notes;
  if (weaningWeight !== undefined) grower.weaningWeight = weaningWeight;
  if (slaughterDate !== undefined) grower.slaughterDate = slaughterDate;

  // Update weaning weight log if needed
  if (weaningWeight) {
    const weanIndex = grower.weightLogs.findIndex(w => w.type === 'Weaning');
    if (weanIndex >= 0) {
      grower.weightLogs[weanIndex].weight = weaningWeight;
    } else {
      grower.weightLogs.push({
        date: new Date(),
        type: 'Weaning',
        weight: weaningWeight,
        notes: 'Updated weaning weight log',
        enteredBy: req.user ? req.user.name : 'System'
      });
    }
  }

  const updated = await grower.save();
  apiResponse(res, 200, updated, 'Grower record updated successfully');
});

/**
 * Soft delete grower record.
 */
export const deleteGrower = asyncHandler(async (req, res, next) => {
  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  // Soft delete flag
  grower.isDeleted = true;
  await grower.save();

  apiResponse(res, 200, null, 'Grower record card archived (soft-deleted) successfully');
});

/**
 * Add a periodic weekly/monthly weight log.
 */
export const addGrowerWeight = asyncHandler(async (req, res, next) => {
  const { date, type, weight, notes } = req.body;

  if (!type || weight === undefined) {
    throw new CustomError('Please specify the weight logging type and value.', 400);
  }

  const numericWeight = Number(weight);
  if (isNaN(numericWeight) || numericWeight <= 0) {
    throw new CustomError('Weight must be a positive number.', 400);
  }

  const logDate = date ? new Date(date) : new Date();
  if (logDate > new Date()) {
    throw new CustomError('Future dates are not allowed for weight entry.', 400);
  }

  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  grower.weightLogs.push({
    date: logDate,
    type,
    weight: numericWeight,
    notes: notes || '',
    enteredBy: req.user ? req.user.name : 'System'
  });

  const updated = await grower.save();
  apiResponse(res, 200, updated, 'Weight log recorded successfully');
});

/**
 * Update an existing weight log.
 */
export const updateGrowerWeight = asyncHandler(async (req, res, next) => {
  const { date, type, weight, notes } = req.body;
  const { id, weightId } = req.params;

  const numericWeight = Number(weight);
  if (weight !== undefined && (isNaN(numericWeight) || numericWeight <= 0)) {
    throw new CustomError('Weight must be a positive number.', 400);
  }

  if (date && new Date(date) > new Date()) {
    throw new CustomError('Future dates are not allowed for weight entry.', 400);
  }

  const grower = await Grower.findOne({ _id: id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${id}`, 404);
  }

  const log = grower.weightLogs.id(weightId);
  if (!log) {
    throw new CustomError('Weight entry not found in grower record', 404);
  }

  if (date) log.date = date;
  if (type) log.type = type;
  if (weight !== undefined) log.weight = numericWeight;
  if (notes !== undefined) log.notes = notes;
  log.enteredBy = req.user ? req.user.name : 'System';

  const updated = await grower.save();
  apiResponse(res, 200, updated, 'Weight log updated successfully');
});

/**
 * Delete a specific weight log.
 */
export const deleteGrowerWeight = asyncHandler(async (req, res, next) => {
  const { id, weightId } = req.params;

  const grower = await Grower.findOne({ _id: id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${id}`, 404);
  }

  const logIndex = grower.weightLogs.findIndex(w => w._id.toString() === weightId);
  if (logIndex === -1) {
    throw new CustomError('Weight entry not found in grower record', 404);
  }

  // Prevent deleting initial birth weight log
  if (grower.weightLogs[logIndex].type === 'Birth') {
    throw new CustomError('Initial Birth Weight log cannot be deleted.', 400);
  }

  grower.weightLogs.splice(logIndex, 1);
  const updated = await grower.save();
  apiResponse(res, 200, updated, 'Weight log deleted successfully');
});

/**
 * Transition operational status and register history entry.
 */
export const updateGrowerStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks } = req.body;

  if (!status) {
    throw new CustomError('Please specify the new operational status.', 400);
  }

  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  const previousStatus = grower.status;
  grower.status = status;
  grower.statusHistory.push({
    previousStatus,
    newStatus: status,
    updatedBy: req.user ? req.user.name : 'System',
    notes: remarks || `Status transitioned to ${status}`,
    updatedAt: new Date()
  });

  const updated = await grower.save();
  apiResponse(res, 200, updated, `Status transitioned to ${status} successfully`);
});

/**
 * Promote a female grower to Sow breeding records.
 */
export const promoteGrowerToSow = asyncHandler(async (req, res, next) => {
  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  if (grower.sex !== 'Female') {
    throw new CustomError('Only female growers can be promoted to Sow.', 400);
  }

  if (grower.status === 'Promoted to Sow') {
    throw new CustomError('This grower is already promoted to Sow.', 400);
  }

  // 1. Create the new Sow record
  const sow = new Sow({
    animalNo: grower.animalNo,
    source: 'GrowerPromotion',
    growerId: grower._id,
    dob: grower.dob,
    breed: grower.breed,
    sireNo: grower.sireNo,
    damNo: grower.damNo,
    birthWeight: grower.birthWeight,
    latestWeight: grower.latestWeight || grower.birthWeight,
    penNo: grower.penNo,
    status: 'Active',
    createdBy: req.user ? req.user.id : null
  });
  await sow.save();

  // 2. Update Grower status, references & history arrays
  const previousStatus = grower.status;
  grower.status = 'Promoted to Sow';
  grower.promotedTo = 'Sow';
  grower.promotedAt = new Date();
  grower.sowId = sow._id;
  
  grower.statusHistory.push({
    previousStatus,
    newStatus: 'Promoted to Sow',
    updatedBy: req.user ? req.user.name : 'System',
    notes: 'Moved grower into Sow breeding records.',
    updatedAt: new Date()
  });

  grower.promotionHistory.push({
    type: 'Sow',
    promotedAt: new Date(),
    promotedBy: req.user ? req.user.name : 'System',
    destinationModule: 'Sow Breeding'
  });

  const updated = await grower.save();
  apiResponse(res, 200, { grower: updated, sow }, 'Grower promoted to Sow breeding records successfully');
});

/**
 * Promote a male grower to Boar breeding records.
 */
export const promoteGrowerToBoar = asyncHandler(async (req, res, next) => {
  const grower = await Grower.findOne({ _id: req.params.id, isDeleted: false });
  if (!grower) {
    throw new CustomError(`No grower record found under ID ${req.params.id}`, 404);
  }

  if (grower.sex !== 'Male') {
    throw new CustomError('Only male growers can be promoted to Boar.', 400);
  }

  if (grower.status === 'Promoted to Boar') {
    throw new CustomError('This grower is already promoted to Boar.', 400);
  }

  // 1. Create the new Boar record
  const boar = new Boar({
    animalNo: grower.animalNo,
    source: 'GrowerPromotion',
    growerId: grower._id,
    dob: grower.dob,
    breed: grower.breed,
    sireNo: grower.sireNo,
    damNo: grower.damNo,
    birthWeight: grower.birthWeight,
    latestWeight: grower.latestWeight || grower.birthWeight,
    penNo: grower.penNo,
    status: 'Active',
    createdBy: req.user ? req.user.id : null
  });
  await boar.save();

  // 2. Update Grower status, references & history arrays
  const previousStatus = grower.status;
  grower.status = 'Promoted to Boar';
  grower.promotedTo = 'Boar';
  grower.promotedAt = new Date();
  grower.boarId = boar._id;

  grower.statusHistory.push({
    previousStatus,
    newStatus: 'Promoted to Boar',
    updatedBy: req.user ? req.user.name : 'System',
    notes: 'Moved grower into Boar breeding records.',
    updatedAt: new Date()
  });

  grower.promotionHistory.push({
    type: 'Boar',
    promotedAt: new Date(),
    promotedBy: req.user ? req.user.name : 'System',
    destinationModule: 'Boar Breeding'
  });

  const updated = await grower.save();
  apiResponse(res, 200, { grower: updated, boar }, 'Grower promoted to Boar breeding records successfully');
});

export default { 
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
};
