import { create } from 'zustand';
import { useGrowerStore } from './useGrowerStore';

const MOCK_SEED_SOWS = [
  {
    _id: "sow_1",
    animalNo: "S-101",
    dob: "2024-04-10",
    breed: "Large White",
    sireNo: "LW-501",
    damNo: "DAM-202",
    birthWeight: 1.5,
    latestWeight: 172.5,
    penNo: "Breeding Unit 1",
    status: "Pregnant",
    pregnancyStatus: "Pregnant",
    parityCount: 2,
    lastHeatDate: "2026-04-15",
    lastServiceDate: "2026-04-16",
    expectedFarrowingDate: "2026-08-08", // Service Date + 114 days
    notes: "Proven breeder, excellent maternal characteristics and litter survival records.",
    isDeleted: false,
    createdAt: "2024-04-10T00:00:00.000Z",
    heatHistory: [
      { _id: "h1_1", heatNumber: 1, heatDate: "2026-03-25", expectedNextHeat: "2026-04-15", durationHours: 24, status: "Heat Completed", notes: "Normal signs observed", enteredBy: "Marcus Vance" },
      { _id: "h1_2", heatNumber: 2, heatDate: "2026-04-15", expectedNextHeat: "2026-05-06", durationHours: 36, status: "Heat Completed", notes: "Strong standing response", enteredBy: "Dr. Alistair" }
    ],
    breedingHistory: [
      { _id: "b1_1", boarAnimalNo: "B-201", serviceDate: "2026-04-16", matingType: "Natural", pregnancyConfirmed: "Confirmed", expectedFarrowingDate: "2026-08-08", technician: "Dr. Alistair", notes: "Direct pen service." }
    ],
    farrowingHistory: [
      { _id: "f1_1", parity: 1, farrowingDate: "2025-10-12", bornAlive: 12, bornDead: 1, weakPiglets: 0, stillborn: 1, mummified: 0, litterWeight: 18.2, weaningCount: 11, weaningWeight: 72.5 }
    ],
    treatmentHistory: [
      { _id: "t1_1", treatmentDate: "2026-02-15", symptoms: "Slight limping in hind leg", diagnosis: "Mild joint strain", medicineUsed: "Penicillin", vaccineGiven: "", doctorNotes: "Administered anti-inflammatory dose.", recoveryStatus: "Recovered" }
    ],
    statusHistory: [
      { _id: "sh1_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Manually registered", updatedAt: "2024-04-10T00:00:00.000Z" },
      { _id: "sh1_2", previousStatus: "Active", newStatus: "In Heat", updatedBy: "Marcus Vance", notes: "Sow in standing heat.", updatedAt: "2026-04-15T00:00:00.000Z" },
      { _id: "sh1_3", previousStatus: "In Heat", newStatus: "Pregnant", updatedBy: "Dr. Alistair", notes: "Confirmed pregnant via ultrasound scan.", updatedAt: "2026-05-07T00:00:00.000Z" }
    ]
  },
  {
    _id: "sow_2",
    animalNo: "S-102",
    dob: "2024-06-15",
    breed: "Landrace",
    sireNo: "L-902",
    damNo: "DAM-304",
    birthWeight: 1.4,
    latestWeight: 161.0,
    penNo: "Breeding Unit 2",
    status: "Active",
    pregnancyStatus: "Not Pregnant",
    parityCount: 1,
    lastHeatDate: "2026-05-02",
    lastServiceDate: "",
    expectedFarrowingDate: "",
    notes: "Docile temperament, average litter weight farrowed in previous litter.",
    isDeleted: false,
    createdAt: "2024-06-15T00:00:00.000Z",
    heatHistory: [
      { _id: "h2_1", heatNumber: 1, heatDate: "2026-05-02", expectedNextHeat: "2026-05-23", durationHours: 24, status: "In Heat", notes: "Entering standard heat window.", enteredBy: "Marcus Vance" }
    ],
    breedingHistory: [],
    farrowingHistory: [
      { _id: "f2_1", parity: 1, farrowingDate: "2025-11-20", bornAlive: 9, bornDead: 0, weakPiglets: 1, stillborn: 0, mummified: 0, litterWeight: 13.5, weaningCount: 8, weaningWeight: 51.2 }
    ],
    treatmentHistory: [],
    statusHistory: [
      { _id: "sh2_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Initial registration", updatedAt: "2024-06-15T00:00:00.000Z" }
    ]
  },
  {
    _id: "sow_3",
    animalNo: "G-102", // Grower promoted earlier
    dob: "2026-03-01",
    breed: "Large White",
    sireNo: "LW-202",
    damNo: "S-104",
    birthWeight: 1.3,
    latestWeight: 52.8,
    penNo: "Pen 3A",
    status: "Active",
    pregnancyStatus: "Not Pregnant",
    parityCount: 0,
    lastHeatDate: "",
    lastServiceDate: "",
    expectedFarrowingDate: "",
    notes: "Promoted to Sow from Grower Module. High prospective traits.",
    isDeleted: false,
    createdAt: "2026-05-22T08:00:00.000Z",
    heatHistory: [],
    breedingHistory: [],
    farrowingHistory: [],
    treatmentHistory: [],
    statusHistory: [
      { _id: "sh3_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Promoted from Grower record card.", updatedAt: "2026-05-22T08:00:00.000Z" }
    ]
  }
];

// LocalStorage helpers
const loadLocalSows = () => {
  const stored = localStorage.getItem('pinaka_sows');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(s => !s.isDeleted);
    } catch (e) {
      console.error("Local storage decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_sows', JSON.stringify(MOCK_SEED_SOWS));
  return MOCK_SEED_SOWS;
};

const saveLocalSows = (list) => {
  localStorage.setItem('pinaka_sows', JSON.stringify(list));
};

export const useSowStore = create((set, get) => ({
  sows: [],
  selectedSow: null,
  loading: false,
  error: null,
  heatAlerts: [],

  fetchSows: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      let list = loadLocalSows();

      // Apply filters
      if (filters.status) {
        list = list.filter(s => s.status === filters.status);
      }
      if (filters.pregnancyStatus) {
        list = list.filter(s => s.pregnancyStatus === filters.pregnancyStatus);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(s => 
          s.animalNo.toLowerCase().includes(query) ||
          s.breed.toLowerCase().includes(query) ||
          s.penNo.toLowerCase().includes(query)
        );
      }

      set({ sows: list, loading: false });
      get().generateHeatAlerts();
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSowById: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      const match = list.find(s => s._id === id);
      if (!match) throw new Error("Sow breeding card record not found.");

      set({ selectedSow: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createSow: async (sowData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();

      const code = sowData.animalNo.toUpperCase().trim();
      const exists = list.some(s => s.animalNo === code);
      if (exists) throw new Error(`Animal No '${code}' already registered.`);

      const newRecord = {
        _id: `sow_${Date.now()}`,
        animalNo: code,
        dob: sowData.dob,
        breed: sowData.breed,
        sireNo: sowData.sireNo || 'UNKNOWN',
        damNo: sowData.damNo || 'UNKNOWN',
        birthWeight: Number(sowData.birthWeight || 1.5),
        latestWeight: Number(sowData.currentWeight || sowData.birthWeight || 150),
        penNo: sowData.penNo,
        status: sowData.status || 'Active',
        pregnancyStatus: sowData.pregnancyStatus || 'Not Pregnant',
        parityCount: Number(sowData.parityCount || 0),
        lastHeatDate: sowData.lastHeatDate || '',
        lastServiceDate: '',
        expectedFarrowingDate: sowData.expectedFarrowingDate || '',
        notes: sowData.notes || '',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        heatHistory: [],
        breedingHistory: [],
        farrowingHistory: [],
        treatmentHistory: [],
        statusHistory: [
          {
            _id: `sh_${Date.now()}`,
            previousStatus: 'None',
            newStatus: sowData.status || 'Active',
            updatedBy: sowData.enteredBy || 'System',
            notes: 'Manual breeder registration',
            updatedAt: new Date().toISOString()
          }
        ]
      };

      const updatedList = [newRecord, ...list];
      saveLocalSows(updatedList);

      set({ sows: updatedList, loading: false });
      get().generateHeatAlerts();
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  importSowFromGrower: async (growerId, notes, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      
      // Load growers from storage to promote grower
      const growersList = JSON.parse(localStorage.getItem('pinaka_growers') || '[]');
      const grower = growersList.find(g => g._id === growerId);
      
      if (!grower) throw new Error("Grower record not found.");
      if (grower.sex !== 'Female') throw new Error("Only female growers can be promoted to Sows.");

      const code = grower.animalNo.toUpperCase().trim();
      const exists = list.some(s => s.animalNo === code);
      if (exists) throw new Error(`Grower '${code}' is already registered as a Sow breeder.`);

      // Create sow
      const newSow = {
        _id: `sow_${Date.now()}`,
        animalNo: code,
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
        notes: notes || grower.notes || 'Promoted and imported from Grower Records.',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        heatHistory: [],
        breedingHistory: [],
        farrowingHistory: [],
        treatmentHistory: [],
        statusHistory: [
          {
            _id: `sh_${Date.now()}`,
            previousStatus: 'None',
            newStatus: 'Active',
            updatedBy: enteredBy || 'System',
            notes: 'Imported from grower records',
            updatedAt: new Date().toISOString()
          }
        ]
      };

      // Update grower in storage
      const updatedGrowers = growersList.map(g => {
        if (g._id === growerId) {
          return {
            ...g,
            status: 'Promoted to Sow',
            statusHistory: [
              ...(g.statusHistory || []),
              {
                _id: `sh_g_${Date.now()}`,
                previousStatus: g.status,
                newStatus: 'Promoted to Sow',
                updatedBy: enteredBy || 'System',
                notes: 'Promoted to Sow breeding registry',
                updatedAt: new Date().toISOString()
              }
            ],
            promotionHistory: [
              ...(g.promotionHistory || []),
              {
                _id: `pr_g_${Date.now()}`,
                type: 'Sow',
                promotedAt: new Date().toISOString(),
                promotedBy: enteredBy || 'System',
                destinationModule: 'Sow Breeding'
              }
            ]
          };
        }
        return g;
      });

      localStorage.setItem('pinaka_growers', JSON.stringify(updatedGrowers));
      
      // Update useGrowerStore growers list if store instantiated
      const growerStore = useGrowerStore.getState();
      if (growerStore && typeof growerStore.fetchGrowers === 'function') {
        growerStore.fetchGrowers();
      }

      const updatedSows = [newSow, ...list];
      saveLocalSows(updatedSows);

      set({ sows: updatedSows, loading: false });
      get().generateHeatAlerts();
      return newSow;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addHeatLog: async (id, heatData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      
      const newNextHeat = new Date(new Date(heatData.date).getTime() + (21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          const previousStatus = updated.status;
          updated.status = 'In Heat';
          updated.lastHeatDate = heatData.date;

          updated.heatHistory = [
            ...(updated.heatHistory || []),
            {
              _id: `h_${Date.now()}`,
              heatNumber: (updated.heatHistory?.length || 0) + 1,
              heatDate: heatData.date,
              expectedNextHeat: newNextHeat,
              durationHours: Number(heatData.durationHours || 24),
              status: 'In Heat',
              notes: heatData.notes || '',
              enteredBy: heatData.enteredBy || 'System'
            }
          ];

          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: 'In Heat',
              updatedBy: heatData.enteredBy || 'System',
              notes: heatData.notes || 'Standing heat cycle registered.',
              updatedAt: new Date().toISOString()
            }
          ];

          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addBreedingLog: async (id, breedingData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      const serviceDateStr = breedingData.serviceDate || new Date().toISOString().split('T')[0];
      const estFarrowing = new Date(new Date(serviceDateStr).getTime() + (114 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          const previousStatus = updated.status;
          updated.status = 'Pregnancy Pending';
          updated.pregnancyStatus = 'Pending Confirmation';
          updated.lastServiceDate = serviceDateStr;
          updated.expectedFarrowingDate = estFarrowing;

          updated.breedingHistory = [
            ...(updated.breedingHistory || []),
            {
              _id: `b_${Date.now()}`,
              boarAnimalNo: breedingData.boarAnimalNo.toUpperCase().trim(),
              serviceDate: serviceDateStr,
              matingType: breedingData.matingType || 'Natural',
              pregnancyConfirmed: 'Pending',
              expectedFarrowingDate: estFarrowing,
              technician: breedingData.technician || 'System',
              notes: breedingData.notes || ''
            }
          ];

          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: 'Pregnancy Pending',
              updatedBy: breedingData.technician || 'System',
              notes: `Mated with Boar ${breedingData.boarAnimalNo}. Farrowing expected: ${estFarrowing}.`,
              updatedAt: new Date().toISOString()
            }
          ];

          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  confirmPregnancyLog: async (id, confirmationData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          if (!updated.breedingHistory || updated.breedingHistory.length === 0) {
            throw new Error("No service log exists to confirm.");
          }

          const lastBreeding = updated.breedingHistory[updated.breedingHistory.length - 1];
          lastBreeding.pregnancyConfirmed = confirmationData.confirmationStatus;

          const previousStatus = updated.status;
          if (confirmationData.confirmationStatus === 'Confirmed') {
            updated.status = 'Pregnant';
            updated.pregnancyStatus = 'Pregnant';
            updated.expectedFarrowingDate = lastBreeding.expectedFarrowingDate;
          } else {
            updated.status = 'Active';
            updated.pregnancyStatus = 'Not Pregnant';
            updated.expectedFarrowingDate = '';
          }

          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: updated.status,
              updatedBy: confirmationData.technician || 'System',
              notes: confirmationData.notes || `Pregnancy scan complete. Result: ${confirmationData.confirmationStatus}.`,
              updatedAt: new Date().toISOString()
            }
          ];

          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addFarrowingLog: async (id, farrowData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          const previousStatus = updated.status;
          
          const nextParity = (updated.farrowingHistory?.length || 0) + 1;
          updated.status = 'Lactating';
          updated.pregnancyStatus = 'Not Pregnant';
          updated.parityCount = nextParity;
          updated.expectedFarrowingDate = '';

          updated.farrowingHistory = [
            ...(updated.farrowingHistory || []),
            {
              _id: `f_${Date.now()}`,
              parity: nextParity,
              farrowingDate: farrowData.farrowingDate,
              bornAlive: Number(farrowData.bornAlive || 0),
              bornDead: Number(farrowData.bornDead || 0),
              weakPiglets: Number(farrowData.weakPiglets || 0),
              stillborn: Number(farrowData.stillborn || 0),
              mummified: Number(farrowData.mummified || 0),
              litterWeight: Number(farrowData.litterWeight || 0),
              weaningCount: Number(farrowData.weaningCount || 0),
              weaningWeight: Number(farrowData.weaningWeight || 0)
            }
          ];

          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: 'Lactating',
              updatedBy: farrowData.enteredBy || 'System',
              notes: `Successfully farrowed Parity #${nextParity}. Born Alive: ${farrowData.bornAlive}`,
              updatedAt: new Date().toISOString()
            }
          ];

          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addTreatmentLog: async (id, treatmentData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          const previousStatus = updated.status;
          
          updated.treatmentHistory = [
            ...(updated.treatmentHistory || []),
            {
              _id: `t_${Date.now()}`,
              treatmentDate: treatmentData.treatmentDate || new Date().toISOString().split('T')[0],
              symptoms: treatmentData.symptoms,
              diagnosis: treatmentData.diagnosis,
              medicineUsed: treatmentData.medicineUsed || '',
              vaccineGiven: treatmentData.vaccineGiven || '',
              doctorNotes: treatmentData.doctorNotes || '',
              recoveryStatus: treatmentData.recoveryStatus || 'Under Treatment'
            }
          ];

          if (treatmentData.recoveryStatus === 'Under Treatment' && updated.status !== 'Under Treatment') {
            updated.status = 'Under Treatment';
            if (!updated.statusHistory) updated.statusHistory = [];
            updated.statusHistory.push({
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: 'Under Treatment',
              updatedBy: treatmentData.enteredBy || 'System',
              notes: `Sow placed under veterinary observation for ${treatmentData.diagnosis}`,
              updatedAt: new Date().toISOString()
            });
          } else if (treatmentData.recoveryStatus === 'Recovered' && updated.status === 'Under Treatment') {
            updated.status = 'Active';
            if (!updated.statusHistory) updated.statusHistory = [];
            updated.statusHistory.push({
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: 'Active',
              updatedBy: treatmentData.enteredBy || 'System',
              notes: `Sow fully recovered from treatment course.`,
              updatedAt: new Date().toISOString()
            });
          }

          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateSowStatusDirect: async (id, status, notes, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();

      const updatedList = list.map(s => {
        if (s._id === id) {
          const updated = { ...s };
          const previousStatus = updated.status;
          updated.status = status;
          
          // Align internal date fields depending on the target status
          if (status === 'In Heat') {
            updated.lastHeatDate = new Date().toISOString().split('T')[0];
            updated.heatHistory = [
              ...(updated.heatHistory || []),
              {
                _id: `h_${Date.now()}`,
                heatNumber: (updated.heatHistory?.length || 0) + 1,
                heatDate: updated.lastHeatDate,
                expectedNextHeat: new Date(Date.now() + (21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                durationHours: 24,
                status: 'In Heat',
                notes: notes || 'Direct status transition to In Heat.',
                enteredBy: enteredBy || 'System'
              }
            ];
          } else if (status === 'Pregnancy Pending') {
            updated.pregnancyStatus = 'Pending Confirmation';
            updated.lastServiceDate = new Date().toISOString().split('T')[0];
            updated.expectedFarrowingDate = new Date(Date.now() + (114 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else if (status === 'Pregnant') {
            updated.pregnancyStatus = 'Pregnant';
            if (!updated.lastServiceDate) {
              updated.lastServiceDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // seed 30 days ago to show progress
            }
            updated.expectedFarrowingDate = new Date(new Date(updated.lastServiceDate).getTime() + (114 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else if (status === 'Lactating') {
            updated.pregnancyStatus = 'Not Pregnant';
            updated.expectedFarrowingDate = '';
            updated.farrowingHistory = [
              ...(updated.farrowingHistory || []),
              {
                _id: `f_${Date.now()}`,
                parity: (updated.farrowingHistory?.length || 0) + 1,
                farrowingDate: new Date().toISOString().split('T')[0],
                bornAlive: 10,
                bornDead: 0,
                stillborn: 0,
                mummified: 0,
                litterWeight: 15,
                weaningCount: 0,
                weaningWeight: 0
              }
            ];
            updated.parityCount = updated.farrowingHistory.length;
          } else if (status === 'Active') {
            updated.pregnancyStatus = 'Not Pregnant';
            updated.expectedFarrowingDate = '';
          }

          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `sh_${Date.now()}`,
              previousStatus,
              newStatus: status,
              updatedBy: enteredBy || 'System',
              notes: notes || `Direct manual transition to ${status}`,
              updatedAt: new Date().toISOString()
            }
          ];
          return updated;
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      get().generateHeatAlerts();
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateSowDetails: async (id, updatedData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      const updatedList = list.map(s => {
        if (s._id === id) {
          return {
            ...s,
            breed: updatedData.breed,
            sireNo: updatedData.sireNo,
            damNo: updatedData.damNo,
            penNo: updatedData.penNo,
            latestWeight: Number(updatedData.latestWeight || s.latestWeight || 150),
            notes: updatedData.notes
          };
        }
        return s;
      });

      saveLocalSows(updatedList);
      const matched = updatedList.find(s => s._id === id);

      set({ 
        sows: updatedList, 
        selectedSow: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteSow: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalSows();
      
      // Perform soft delete
      const updatedList = list.map(s => {
        if (s._id === id) {
          return { ...s, isDeleted: true };
        }
        return s;
      });

      saveLocalSows(updatedList);
      
      set({ 
        sows: updatedList.filter(s => !s.isDeleted), 
        selectedSow: get().selectedSow?._id === id ? null : get().selectedSow,
        loading: false 
      });
      get().generateHeatAlerts();
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  generateHeatAlerts: () => {
    const list = loadLocalSows();
    const alerts = [];
    const now = new Date();

    list.forEach(s => {
      // 1. Upcoming and Overdue checks
      if (s.lastHeatDate && s.status !== 'In Heat' && s.pregnancyStatus !== 'Pregnant') {
        const nextExpectedHeat = new Date(new Date(s.lastHeatDate).getTime() + (21 * 24 * 60 * 60 * 1000));
        const diffTime = nextExpectedHeat - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 2) {
          alerts.push({
            id: `alert_up_${s._id}`,
            type: 'Upcoming Heat',
            animalNo: s.animalNo,
            message: `Sow ${s.animalNo} expected to enter heat cycle in ${diffDays} day(s).`,
            priority: 'Medium',
            remainingDays: diffDays
          });
        } else if (diffDays < 0) {
          alerts.push({
            id: `alert_od_${s._id}`,
            type: 'Overdue Heat',
            animalNo: s.animalNo,
            message: `Expected heat cycle overdue for Sow ${s.animalNo} by ${Math.abs(diffDays)} day(s).`,
            priority: 'High',
            overdueDays: Math.abs(diffDays)
          });
        }
      }

      // 2. Active Heat and countdown timers
      if (s.status === 'In Heat' && s.heatHistory && s.heatHistory.length > 0) {
        const activeHeat = s.heatHistory[s.heatHistory.length - 1];
        const heatStart = new Date(activeHeat.heatDate);
        const limitHours = activeHeat.durationHours || 48;
        const expirationTime = new Date(heatStart.getTime() + (limitHours * 60 * 60 * 1000));
        const diffHrs = (expirationTime - now) / (1000 * 60 * 60);

        if (diffHrs > 0) {
          alerts.push({
            id: `alert_act_${s._id}`,
            type: 'Active Heat',
            animalNo: s.animalNo,
            message: `Sow ${s.animalNo} currently in heat. Standing mating window active.`,
            priority: 'High',
            remainingHours: Math.ceil(diffHrs)
          });

          if (diffHrs <= 6) {
            alerts.push({
              id: `alert_crit_${s._id}`,
              type: 'Heat Duration Alert',
              animalNo: s.animalNo,
              message: `Mating window closing in ${Math.ceil(diffHrs)} hour(s) for Sow ${s.animalNo}!`,
              priority: 'Critical',
              remainingHours: Math.ceil(diffHrs)
            });
          }
        } else {
          alerts.push({
            id: `alert_comp_${s._id}`,
            type: 'Heat Duration Alert',
            animalNo: s.animalNo,
            message: `Heat duration window completed for Sow ${s.animalNo}.`,
            priority: 'Medium',
            remainingHours: 0
          });
        }
      }
    });

    set({ heatAlerts: alerts });
  }
}));
