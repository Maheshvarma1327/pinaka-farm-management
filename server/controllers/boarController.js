import Boar from '../models/Boar.js';
import Grower from '../models/Grower.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import CustomError from '../utils/customError.js';

// @desc    Register a new Boar manually
// @route   POST /api/boars
// @access  Private
export const createBoar = asyncHandler(async (req, res, next) => {
  const { 
    animalNo, 
    dob, 
    breed, 
    sireNo, 
    damNo, 
    birthWeight, 
    latestWeight, 
    penNo, 
    notes, 
    pubertyDate, 
    diseaseTestResult, 
    congenitalDefects, 
    rudimentaryTeats, 
    breedingStatus, 
    status 
  } = req.body;

  const exists = await Boar.findOne({ animalNo: animalNo.toUpperCase().trim() });
  if (exists) {
    return next(new CustomError(`Animal tag '${animalNo}' already registered in Boar database.`, 400));
  }

  const boar = new Boar({
    animalNo: animalNo.toUpperCase().trim(),
    dob,
    breed,
    sireNo: sireNo || 'UNKNOWN',
    damNo: damNo || 'UNKNOWN',
    birthWeight: Number(birthWeight || 1.5),
    latestWeight: Number(latestWeight || birthWeight || 1.5),
    penNo,
    notes: notes || '',
    status: status || 'Active',
    pubertyDate,
    diseaseTestResult: diseaseTestResult || 'Negative',
    congenitalDefects: congenitalDefects || 'None',
    rudimentaryTeats: Number(rudimentaryTeats || 0),
    breedingStatus: breedingStatus || 'Growing',
    source: 'Direct',
    createdBy: req.user?._id
  });

  // Push initial status history
  boar.statusHistory.push({
    previousStatus: 'None',
    newStatus: status || 'Active',
    updatedBy: req.user?.name || 'System',
    notes: 'Initial manual registration of Boar breeder.',
    date: new Date()
  });

  await boar.save();

  res.status(201).json(ApiResponse.success(boar, 'Boar registered successfully.'));
});

// @desc    Import/Promote Male Grower to Boar
// @route   POST /api/boars/import-grower
// @access  Private
export const importFromGrower = asyncHandler(async (req, res, next) => {
  const { growerId, notes } = req.body;

  const grower = await Grower.findById(growerId);
  if (!grower) {
    return next(new CustomError('Grower record not found.', 404));
  }

  if (grower.sex !== 'Male') {
    return next(new CustomError('Only male growers can be promoted to Boar.', 400));
  }

  // Validate Age: >= 150 days
  const dob = new Date(grower.dob);
  const ageInDays = Math.ceil((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24));
  if (ageInDays < 150) {
    return next(new CustomError(`Grower is only ${ageInDays} days old. Promotion requires a minimum age of 150 days.`, 400));
  }

  const exists = await Boar.findOne({ animalNo: grower.animalNo });
  if (exists) {
    return next(new CustomError(`Grower '${grower.animalNo}' is already registered in the Boar records.`, 400));
  }

  // Create Boar Record
  const boar = new Boar({
    animalNo: grower.animalNo,
    dob: grower.dob,
    breed: grower.breed,
    sireNo: grower.sireNo || 'UNKNOWN',
    damNo: grower.damNo || 'UNKNOWN',
    birthWeight: grower.birthWeight,
    latestWeight: grower.latestWeight || grower.birthWeight,
    penNo: grower.penNo,
    status: 'Active',
    breedingStatus: 'Growing',
    source: 'GrowerPromotion',
    growerId: grower._id,
    notes: notes || grower.notes || 'Imported and promoted from Grower Module.',
    createdBy: req.user?._id
  });

  // Add status history
  boar.statusHistory.push({
    previousStatus: 'None',
    newStatus: 'Active',
    updatedBy: req.user?.name || 'System',
    notes: 'Promoted from grower record and imported.',
    date: new Date()
  });

  boar.promotionHistory.push({
    growerId: grower._id,
    animalNo: grower.animalNo,
    promotedAt: new Date(),
    promotedBy: req.user?.name || 'System',
    notes: notes || 'Grower promoted to breeding registry.'
  });

  await boar.save();

  // Update Grower Status
  const previousStatus = grower.status;
  grower.status = 'Promoted to Boar';
  grower.statusHistory.push({
    previousStatus,
    newStatus: 'Promoted to Boar',
    updatedBy: req.user?.name || 'System',
    notes: 'Promoted and moved to Boar breeding records.',
    updatedAt: new Date()
  });

  grower.promotionHistory.push({
    type: 'Boar',
    promotedAt: new Date(),
    promotedBy: req.user?.name || 'System',
    destinationModule: 'Boar Breeding'
  });

  await grower.save();

  res.status(201).json(ApiResponse.success({ boar, grower }, 'Male grower successfully promoted and imported to Boars.'));
});

// @desc    Get all Boars with optional queries
// @route   GET /api/boars
// @access  Private
export const getBoars = asyncHandler(async (req, res, next) => {
  const { search, status, breed, penNo, breedingStatus } = req.query;
  const query = { isDeleted: false };

  if (status) query.status = status;
  if (breedingStatus) query.breedingStatus = breedingStatus;
  if (breed) query.breed = breed;
  if (penNo) query.penNo = { $regex: penNo, $options: 'i' };

  if (search) {
    query.$or = [
      { animalNo: { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } },
      { penNo: { $regex: search, $options: 'i' } }
    ];
  }

  const boars = await Boar.find(query).sort({ createdAt: -1 });

  res.status(200).json(ApiResponse.success(boars, 'Boar records retrieved successfully.'));
});

// @desc    Get Boar by ID
// @route   GET /api/boars/:id
// @access  Private
export const getBoarById = asyncHandler(async (req, res, next) => {
  const boar = await Boar.findById(req.params.id);
  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  res.status(200).json(ApiResponse.success(boar, 'Boar details retrieved successfully.'));
});

// @desc    Transition Boar Status
// @route   PUT /api/boars/:id/status
// @access  Private
export const updateBoarStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks } = req.body;
  const boar = await Boar.findById(req.params.id);

  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  const prevStatus = boar.status;
  boar.status = status;

  // Add status history entry
  boar.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: status,
    updatedBy: req.user?.name || 'System',
    notes: remarks || `Status transition to ${status}`,
    date: new Date()
  });

  // Sync breeding status with some sensible defaults if retired or dead
  if (status === 'Dead') {
    boar.breedingStatus = 'Dead';
  } else if (status === 'Culled') {
    boar.breedingStatus = 'Retired';
  }

  await boar.save();

  res.status(200).json(ApiResponse.success(boar, `Boar status transitioned to ${status} successfully.`));
});

// @desc    Mark Boar Puberty Reached
// @route   PUT /api/boars/:id/puberty
// @access  Private
export const markPuberty = asyncHandler(async (req, res, next) => {
  const { pubertyDate, notes } = req.body;
  const boar = await Boar.findById(req.params.id);

  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  const prevStatus = boar.breedingStatus;
  boar.pubertyDate = pubertyDate || new Date();
  boar.breedingStatus = 'Puberty Reached';

  boar.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'Puberty Reached',
    updatedBy: req.user?.name || 'System',
    notes: notes || 'Puberty marked and confirmed.',
    date: new Date()
  });

  await boar.save();

  res.status(200).json(ApiResponse.success(boar, 'Boar puberty marked successfully.'));
});

// @desc    Mark Boar Breeding Ready
// @route   PUT /api/boars/:id/breeding-ready
// @access  Private
export const markBreedingReady = asyncHandler(async (req, res, next) => {
  const { breedingReadyDate, firstSemenCollectionDate, notes } = req.body;
  const boar = await Boar.findById(req.params.id);

  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  const prevStatus = boar.breedingStatus;
  boar.breedingReadyDate = breedingReadyDate || new Date();
  if (firstSemenCollectionDate) {
    boar.firstSemenCollectionDate = firstSemenCollectionDate;
  }
  boar.breedingStatus = 'Breeding Ready';

  boar.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'Breeding Ready',
    updatedBy: req.user?.name || 'System',
    notes: notes || 'Breeding readiness approved manually.',
    date: new Date()
  });

  await boar.save();

  res.status(200).json(ApiResponse.success(boar, 'Boar breeding readiness approved.'));
});

// @desc    Mark Boar Breeding Active
// @route   PUT /api/boars/:id/breeding-active
// @access  Private
export const markBreedingActive = asyncHandler(async (req, res, next) => {
  const { fertilityApprovalDate, notes } = req.body;
  const boar = await Boar.findById(req.params.id);

  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  const prevStatus = boar.breedingStatus;
  boar.fertilityApprovalDate = fertilityApprovalDate || new Date();
  boar.breedingStatus = 'Breeding Active';

  boar.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'Breeding Active',
    updatedBy: req.user?.name || 'System',
    notes: notes || 'Boar transitioned to Active Breeding status.',
    date: new Date()
  });

  await boar.save();

  res.status(200).json(ApiResponse.success(boar, 'Boar transitioned to active breeder.'));
});

// @desc    Get Boar Fertility Analytics
// @route   GET /api/boars/:id/analytics
// @access  Private
export const getBoarAnalytics = asyncHandler(async (req, res, next) => {
  const boar = await Boar.findById(req.params.id);
  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  res.status(200).json(ApiResponse.success(boar.fertilityAnalytics, 'Boar analytics retrieved successfully.'));
});

// @desc    Get Boar Breeding Service History
// @route   GET /api/boars/:id/service-history
// @access  Private
export const getBoarServiceHistory = asyncHandler(async (req, res, next) => {
  const boar = await Boar.findById(req.params.id);
  if (!boar || boar.isDeleted) {
    return next(new CustomError('Boar record not found.', 404));
  }

  // This returns all references or resolves from mock db in a production setup
  res.status(200).json(ApiResponse.success(boar.serviceHistoryRefs, 'Boar service history references retrieved.'));
});
