import Sow from '../models/Sow.js';
import Grower from '../models/Grower.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import CustomError from '../utils/customError.js';

// @desc    Register a new Sow manually
// @route   POST /api/sows
// @access  Private
export const createSow = asyncHandler(async (req, res, next) => {
  const { animalNo, dob, breed, sireNo, damNo, birthWeight, latestWeight, penNo, notes, parityCount, status, pregnancyStatus, lastHeatDate, expectedFarrowingDate } = req.body;

  const exists = await Sow.findOne({ animalNo: animalNo.toUpperCase().trim() });
  if (exists) {
    return next(new CustomError(`Animal tag '${animalNo}' already registered in Sow database.`, 400));
  }

  const sow = new Sow({
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
    pregnancyStatus: pregnancyStatus || 'Not Pregnant',
    parityCount: Number(parityCount || 0),
    lastHeatDate,
    expectedFarrowingDate,
    createdBy: req.user?._id
  });

  await sow.save();

  res.status(201).json(ApiResponse.success(sow, 'Sow registered successfully.'));
});

// @desc    Import/Promote Female Grower to Sow
// @route   POST /api/sows/import-grower
// @access  Private
export const importFromGrower = asyncHandler(async (req, res, next) => {
  const { growerId, notes } = req.body;

  const grower = await Grower.findById(growerId);
  if (!grower) {
    return next(new CustomError('Grower record not found.', 404));
  }

  if (grower.sex !== 'Female') {
    return next(new CustomError('Only female growers can be promoted to Sow.', 400));
  }

  const exists = await Sow.findOne({ animalNo: grower.animalNo });
  if (exists) {
    return next(new CustomError(`Grower '${grower.animalNo}' is already registered in the Sow records.`, 400));
  }

  // Create Sow Record
  const sow = new Sow({
    animalNo: grower.animalNo,
    dob: grower.dob,
    breed: grower.breed,
    sireNo: grower.sireNo || 'UNKNOWN',
    damNo: grower.damNo || 'UNKNOWN',
    birthWeight: grower.birthWeight,
    latestWeight: grower.latestWeight || grower.birthWeight,
    penNo: grower.penNo,
    status: 'Active',
    pregnancyStatus: 'Not Pregnant',
    parityCount: 0,
    notes: notes || grower.notes || 'Imported and promoted from Grower Module.',
    createdBy: req.user?._id
  });

  await sow.save();

  // Update Grower Status
  const previousStatus = grower.status;
  grower.status = 'Promoted to Sow';
  grower.statusHistory.push({
    previousStatus,
    newStatus: 'Promoted to Sow',
    updatedBy: req.user?.name || 'System',
    notes: 'Promoted and moved to Sow breeding records.',
    updatedAt: new Date()
  });

  grower.promotionHistory.push({
    type: 'Sow',
    promotedAt: new Date(),
    promotedBy: req.user?.name || 'System',
    destinationModule: 'Sow Breeding'
  });

  await grower.save();

  res.status(201).json(ApiResponse.success({ sow, grower }, 'Female grower successfully promoted and imported to Sows.'));
});

// @desc    Get all Sows with optional queries
// @route   GET /api/sows
// @access  Private
export const getSows = asyncHandler(async (req, res, next) => {
  const { search, status, breed, penNo, pregnancyStatus } = req.query;
  const query = { isDeleted: false };

  if (status) query.status = status;
  if (pregnancyStatus) query.pregnancyStatus = pregnancyStatus;
  if (breed) query.breed = breed;
  if (penNo) query.penNo = { $regex: penNo, $options: 'i' };

  if (search) {
    query.$or = [
      { animalNo: { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } },
      { penNo: { $regex: search, $options: 'i' } }
    ];
  }

  const Sows = await Sow.find(query).sort({ createdAt: -1 });

  res.status(200).json(ApiResponse.success(Sows, 'Sow records retrieved successfully.'));
});

// @desc    Get Sow by ID
// @route   GET /api/sows/:id
// @access  Private
export const getSowById = asyncHandler(async (req, res, next) => {
  const sow = await Sow.findById(req.params.id);
  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  res.status(200).json(ApiResponse.success(sow, 'Sow details retrieved successfully.'));
});

// @desc    Add a Heat Record to Sow
// @route   POST /api/sows/:id/heat
// @access  Private
export const addHeatRecord = asyncHandler(async (req, res, next) => {
  const { heatDate, durationHours, symptoms, notes, enteredBy } = req.body;
  const sow = await Sow.findById(req.params.id);

  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  const nextHeat = new Date(new Date(heatDate).getTime() + (21 * 24 * 60 * 60 * 1000));
  const heatNumber = sow.heatHistory.length + 1;

  sow.heatHistory.push({
    heatNumber,
    heatDate,
    expectedNextHeat: nextHeat,
    durationHours: Number(durationHours || 24),
    status: 'In Heat',
    notes: notes || '',
    enteredBy: enteredBy || req.user?.name || 'System'
  });

  const prevStatus = sow.status;
  sow.status = 'In Heat';
  sow.lastHeatDate = heatDate;

  sow.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'In Heat',
    updatedBy: req.user?.name || 'System',
    notes: notes || 'Entered Heat Cycle.',
    updatedAt: new Date()
  });

  await sow.save();

  res.status(200).json(ApiResponse.success(sow, 'Heat record saved and status updated to In Heat.'));
});

// @desc    Add Breeding/Mating Record to Sow
// @route   POST /api/sows/:id/breeding
// @access  Private
export const addBreedingRecord = asyncHandler(async (req, res, next) => {
  const { boarAnimalNo, serviceDate, matingType, notes, technician } = req.body;
  const sow = await Sow.findById(req.params.id);

  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  // Auto farrowing date: 114 gestation days
  const farrowingEst = new Date(new Date(serviceDate).getTime() + (114 * 24 * 60 * 60 * 1000));

  sow.breedingHistory.push({
    boarAnimalNo: boarAnimalNo.toUpperCase().trim(),
    serviceDate,
    matingType: matingType || 'Natural',
    pregnancyConfirmed: 'Pending',
    expectedFarrowingDate: farrowingEst,
    technician: technician || req.user?.name || 'System',
    notes: notes || ''
  });

  const prevStatus = sow.status;
  sow.status = 'Pregnancy Pending';
  sow.pregnancyStatus = 'Pending Confirmation';
  sow.lastServiceDate = serviceDate;
  sow.expectedFarrowingDate = farrowingEst;

  sow.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'Pregnancy Pending',
    updatedBy: req.user?.name || 'System',
    notes: `Serviced/Mated with Boar ${boarAnimalNo}. Pregnancy confirmation scheduled in 21 days.`,
    updatedAt: new Date()
  });

  await sow.save();

  res.status(200).json(ApiResponse.success(sow, 'Breeding record scheduled successfully.'));
});

// @desc    Confirm Pregnancy status on Sow
// @route   POST /api/sows/:id/pregnancy
// @access  Private
export const confirmPregnancy = asyncHandler(async (req, res, next) => {
  const { confirmationStatus, notes } = req.body; // 'Confirmed' or 'Failed'
  const sow = await Sow.findById(req.params.id);

  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  if (sow.breedingHistory.length === 0) {
    return next(new CustomError('No active service log exists to confirm.', 400));
  }

  // Find last breeding record that is pending
  const lastBreeding = sow.breedingHistory[sow.breedingHistory.length - 1];
  if (lastBreeding.pregnancyConfirmed !== 'Pending') {
    return next(new CustomError('Latest service is already confirmed or failed.', 400));
  }

  lastBreeding.pregnancyConfirmed = confirmationStatus;
  const prevStatus = sow.status;

  if (confirmationStatus === 'Confirmed') {
    sow.status = 'Pregnant';
    sow.pregnancyStatus = 'Pregnant';
    sow.expectedFarrowingDate = lastBreeding.expectedFarrowingDate;
  } else {
    sow.status = 'Active';
    sow.pregnancyStatus = 'Not Pregnant';
    sow.expectedFarrowingDate = undefined;
  }

  sow.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: sow.status,
    updatedBy: req.user?.name || 'System',
    notes: notes || `Pregnancy check completed: Result is ${confirmationStatus}`,
    updatedAt: new Date()
  });

  await sow.save();

  res.status(200).json(ApiResponse.success(sow, `Pregnancy checks finalized: ${confirmationStatus}`));
});

// @desc    Add Farrowing Record to Sow
// @route   POST /api/sows/:id/farrowing
// @access  Private
export const addFarrowingRecord = asyncHandler(async (req, res, next) => {
  const { farrowingDate, bornAlive, bornDead, weakPiglets, stillborn, mummified, litterWeight, weaningCount, weaningWeight } = req.body;
  const sow = await Sow.findById(req.params.id);

  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  const nextParity = sow.farrowingHistory.length + 1;

  sow.farrowingHistory.push({
    parity: nextParity,
    farrowingDate,
    bornAlive: Number(bornAlive || 0),
    bornDead: Number(bornDead || 0),
    weakPiglets: Number(weakPiglets || 0),
    stillborn: Number(stillborn || 0),
    mummified: Number(mummified || 0),
    litterWeight: Number(litterWeight || 0),
    weaningCount: Number(weaningCount || 0),
    weaningWeight: Number(weaningWeight || 0)
  });

  const prevStatus = sow.status;
  sow.status = 'Lactating';
  sow.pregnancyStatus = 'Not Pregnant';
  sow.expectedFarrowingDate = undefined;

  sow.statusHistory.push({
    previousStatus: prevStatus,
    newStatus: 'Lactating',
    updatedBy: req.user?.name || 'System',
    notes: `Farrowed Parity #${nextParity}. Born Alive: ${bornAlive}, Born Dead: ${bornDead}.`,
    updatedAt: new Date()
  });

  await sow.save();

  res.status(200).json(ApiResponse.success(sow, `Farrowing data recorded for Parity #${nextParity}.`));
});

// @desc    Add a Medical Treatment Record to Sow
// @route   POST /api/sows/:id/treatment
// @access  Private
export const addTreatmentRecord = asyncHandler(async (req, res, next) => {
  const { treatmentDate, symptoms, diagnosis, medicineUsed, vaccineGiven, doctorNotes, recoveryStatus } = req.body;
  const sow = await Sow.findById(req.params.id);

  if (!sow || sow.isDeleted) {
    return next(new CustomError('Sow record not found.', 404));
  }

  sow.treatmentHistory.push({
    treatmentDate: treatmentDate || new Date(),
    symptoms,
    diagnosis,
    medicineUsed: medicineUsed || '',
    vaccineGiven: vaccineGiven || '',
    doctorNotes: doctorNotes || '',
    recoveryStatus: recoveryStatus || 'Under Treatment'
  });

  if (recoveryStatus === 'Under Treatment' && sow.status !== 'Under Treatment') {
    const prevStatus = sow.status;
    sow.status = 'Under Treatment';
    sow.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'Under Treatment',
      updatedBy: req.user?.name || 'System',
      notes: `Entered medical treatment for ${diagnosis}.`,
      updatedAt: new Date()
    });
  } else if (recoveryStatus === 'Recovered' && sow.status === 'Under Treatment') {
    const prevStatus = sow.status;
    sow.status = 'Active';
    sow.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'Active',
      updatedBy: req.user?.name || 'System',
      notes: `Successfully recovered and active.`,
      updatedAt: new Date()
    });
  }

  await sow.save();

  res.status(200).json(ApiResponse.success(sow, 'Medical treatment record appended successfully.'));
});

// @desc    Get heat notifications alerts
// @route   GET /api/sows/heat-alerts
// @access  Private
export const getHeatAlerts = asyncHandler(async (req, res, next) => {
  const Sows = await Sow.find({ isDeleted: false });
  const alerts = [];

  const now = new Date();

  Sows.forEach(s => {
    // 1. Upcoming Heat: check based on last heat + 21 days
    if (s.lastHeatDate) {
      const nextExpectedHeat = new Date(new Date(s.lastHeatDate).getTime() + (21 * 24 * 60 * 60 * 1000));
      const diffTime = nextExpectedHeat - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 2 && s.status !== 'In Heat' && s.pregnancyStatus !== 'Pregnant') {
        alerts.push({
          type: 'Upcoming Heat',
          sowId: s._id,
          animalNo: s.animalNo,
          message: `Sow ${s.animalNo} expected to enter heat in ${diffDays} day(s).`,
          priority: 'Medium',
          nextHeatDate: nextExpectedHeat
        });
      } else if (diffDays < 0 && s.status !== 'In Heat' && s.pregnancyStatus !== 'Pregnant') {
        // Overdue alert
        alerts.push({
          type: 'Overdue Heat',
          sowId: s._id,
          animalNo: s.animalNo,
          message: `Expected heat cycle overdue for Sow ${s.animalNo} by ${Math.abs(diffDays)} day(s).`,
          priority: 'High',
          nextHeatDate: nextExpectedHeat
        });
      }
    }

    // 2. Active Heat Alert & Mating window checks
    if (s.status === 'In Heat' && s.heatHistory && s.heatHistory.length > 0) {
      const activeHeat = s.heatHistory[s.heatHistory.length - 1];
      const heatStart = new Date(activeHeat.heatDate);
      const limitHours = activeHeat.durationHours || 48;
      const expirationTime = new Date(heatStart.getTime() + (limitHours * 60 * 60 * 1000));
      const diffHrs = (expirationTime - now) / (1000 * 60 * 60);

      if (diffHrs > 0) {
        alerts.push({
          type: 'Active Heat',
          sowId: s._id,
          animalNo: s.animalNo,
          message: `Sow ${s.animalNo} currently in heat. Mating window active.`,
          priority: 'High',
          remainingHours: Math.ceil(diffHrs)
        });

        if (diffHrs <= 6) {
          alerts.push({
            type: 'Heat Duration Alert',
            sowId: s._id,
            animalNo: s.animalNo,
            message: `Mating window closing in ${Math.ceil(diffHrs)} hour(s) for Sow ${s.animalNo}!`,
            priority: 'Critical',
            remainingHours: Math.ceil(diffHrs)
          });
        }
      } else {
        alerts.push({
          type: 'Heat Duration Alert',
          sowId: s._id,
          animalNo: s.animalNo,
          message: `Heat duration completed for Sow ${s.animalNo}.`,
          priority: 'Medium',
          remainingHours: 0
        });
      }
    }
  });

  res.status(200).json(ApiResponse.success(alerts, 'Heat alerts generated.'));
});
