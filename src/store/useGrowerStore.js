import { create } from 'zustand';
import client from '../api/client';

// Production-grade pre-seeded pig farm grower datasets with weight logs and status history
const MOCK_SEED_GROWERS = [
  {
    _id: "grower_1",
    animalNo: "G-101",
    dob: "2026-02-15",
    sex: "Male",
    breed: "Duroc",
    sireNo: "D-901",
    damNo: "S-304",
    birthWeight: 1.4,
    weaningWeight: 7.2,
    penNo: "Pen 3A",
    status: "Active",
    latestWeight: 81.2,
    adg: 0.823,
    slaughterDate: "",
    notes: "Top performer from winter litter. Feed conversion looks excellent, high activity levels.",
    isDeleted: false,
    createdAt: "2026-02-15T00:00:00.000Z",
    weightLogs: [
      { _id: "w1_1", date: "2026-02-15", type: "Birth", weight: 1.4, notes: "Farrowing weights recorded", enteredBy: "Dr. Alistair" },
      { _id: "w1_2", date: "2026-03-15", type: "Weaning", weight: 7.2, notes: "Weaned at 28 days", enteredBy: "Marcus Vance" },
      { _id: "w1_3", date: "2026-03-30", type: "Weekly", weight: 14.8, notes: "Weekly check", enteredBy: "Marcus Vance" },
      { _id: "w1_4", date: "2026-04-15", type: "Weekly", weight: 29.5, notes: "High weight gain noted", enteredBy: "Dr. Alistair" },
      { _id: "w1_5", date: "2026-04-30", type: "Monthly", weight: 48.2, notes: "End of month check", enteredBy: "Marcus Vance" },
      { _id: "w1_6", date: "2026-05-15", type: "Weekly", weight: 70.5, notes: "Transitioned to grower diet 2", enteredBy: "Dr. Alistair" },
      { _id: "w1_7", date: "2026-05-22", type: "Weekly", weight: 81.2, notes: "Latest weight record", enteredBy: "Marcus Vance" }
    ],
    statusHistory: [
      { _id: "s1_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Initial register card created", updatedAt: "2026-02-15T00:00:00.000Z" },
      { _id: "s1_2", previousStatus: "Active", newStatus: "Active", updatedBy: "Marcus Vance", notes: "Successfully weaned and moved to Pen 3A", updatedAt: "2026-03-15T00:00:00.000Z" }
    ],
    promotionHistory: []
  },
  {
    _id: "grower_2",
    animalNo: "G-102",
    dob: "2026-03-01",
    sex: "Female",
    breed: "Large White",
    sireNo: "LW-202",
    damNo: "S-104",
    birthWeight: 1.3,
    weaningWeight: 6.8,
    penNo: "Pen 3A",
    status: "Active",
    latestWeight: 52.8,
    adg: 0.628,
    slaughterDate: "",
    notes: "Steady growth rate, mild ear scratch treated in April. Fully recovered.",
    isDeleted: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    weightLogs: [
      { _id: "w2_1", date: "2026-03-01", type: "Birth", weight: 1.3, notes: "Average farrowing weight", enteredBy: "System" },
      { _id: "w2_2", date: "2026-03-29", type: "Weaning", weight: 6.8, notes: "Weaned at 28 days", enteredBy: "Marcus Vance" },
      { _id: "w2_3", date: "2026-04-12", type: "Weekly", weight: 12.4, notes: "Standard growth review", enteredBy: "Marcus Vance" },
      { _id: "w2_4", date: "2026-04-26", type: "Weekly", weight: 22.0, notes: "Showing strong appetite", enteredBy: "Marcus Vance" },
      { _id: "w2_5", date: "2026-05-10", type: "Monthly", weight: 38.5, notes: "Monthly weighing routine", enteredBy: "Dr. Alistair" },
      { _id: "w2_6", date: "2026-05-22", type: "Weekly", weight: 52.8, notes: "Normal active status", enteredBy: "Marcus Vance" }
    ],
    statusHistory: [
      { _id: "s2_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Initial register card created", updatedAt: "2026-03-01T00:00:00.000Z" }
    ],
    promotionHistory: []
  },
  {
    _id: "grower_3",
    animalNo: "G-103",
    dob: "2026-04-10",
    sex: "Female",
    breed: "Landrace",
    sireNo: "L-504",
    damNo: "S-202",
    birthWeight: 1.25,
    weaningWeight: 6.1,
    penNo: "Pen 1B",
    status: "Active",
    latestWeight: 11.2,
    adg: 0.237,
    slaughterDate: "",
    notes: "Recently weaned, adapting to solid feed slowly but active.",
    isDeleted: false,
    createdAt: "2026-04-10T00:00:00.000Z",
    weightLogs: [
      { _id: "w3_1", date: "2026-04-10", type: "Birth", weight: 1.25, notes: "Birth weight", enteredBy: "Dr. Alistair" },
      { _id: "w3_2", date: "2026-05-08", type: "Weaning", weight: 6.1, notes: "Weaned at 28 days", enteredBy: "Marcus Vance" },
      { _id: "w3_3", date: "2026-05-22", type: "Weekly", weight: 11.2, notes: "First post-weaning weight check", enteredBy: "Marcus Vance" }
    ],
    statusHistory: [
      { _id: "s3_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Initial registration", updatedAt: "2026-04-10T00:00:00.000Z" },
      { _id: "s3_2", previousStatus: "Active", newStatus: "Active", updatedBy: "Marcus Vance", notes: "Transferred from farrowing pen to grower unit 1B", updatedAt: "2026-05-08T00:00:00.000Z" }
    ],
    promotionHistory: []
  },
  {
    _id: "grower_4",
    animalNo: "G-104",
    dob: "2026-05-01",
    sex: "Male",
    breed: "Duroc",
    sireNo: "D-901",
    damNo: "S-401",
    birthWeight: 1.5,
    weaningWeight: 0,
    penNo: "Pen 1B",
    status: "Active",
    latestWeight: 6.9,
    adg: 0.257,
    slaughterDate: "",
    notes: "Currently nursing, strong suckling reflex.",
    isDeleted: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    weightLogs: [
      { _id: "w4_1", date: "2026-05-01", type: "Birth", weight: 1.5, notes: "Strong male piglet weight", enteredBy: "System" },
      { _id: "w4_2", date: "2026-05-15", type: "Weekly", weight: 4.6, notes: "Healthy milk gain", enteredBy: "Marcus Vance" },
      { _id: "w4_3", date: "2026-05-22", type: "Weekly", weight: 6.9, notes: "Pre-weaning log", enteredBy: "Marcus Vance" }
    ],
    statusHistory: [
      { _id: "s4_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Initial birth record registered", updatedAt: "2026-05-01T00:00:00.000Z" }
    ],
    promotionHistory: []
  },
  {
    _id: "grower_5",
    animalNo: "G-105",
    dob: "2026-01-10",
    sex: "Male",
    breed: "Large White",
    sireNo: "LW-202",
    damNo: "S-102",
    birthWeight: 1.45,
    weaningWeight: 7.5,
    penNo: "Pen 5C",
    status: "Sold",
    latestWeight: 95.0,
    adg: 0.748,
    slaughterDate: "2026-05-20",
    notes: "Sold to local buyer at high weight yield.",
    isDeleted: false,
    createdAt: "2026-01-10T00:00:00.000Z",
    weightLogs: [
      { _id: "w5_1", date: "2026-01-10", type: "Birth", weight: 1.45, notes: "Farrowing scale check", enteredBy: "Dr. Alistair" },
      { _id: "w5_2", date: "2026-02-07", type: "Weaning", weight: 7.5, notes: "Excellent weaning yield", enteredBy: "Marcus Vance" },
      { _id: "w5_3", date: "2026-03-10", type: "Monthly", weight: 32.0, notes: "Monthly check", enteredBy: "Marcus Vance" },
      { _id: "w5_4", date: "2026-04-10", type: "Monthly", weight: 65.4, notes: "Rapid growth observed", enteredBy: "Dr. Alistair" },
      { _id: "w5_5", date: "2026-05-15", type: "Weekly", weight: 95.0, notes: "Pre-sale weight log", enteredBy: "Marcus Vance" }
    ],
    statusHistory: [
      { _id: "s5_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Registered card", updatedAt: "2026-01-10T00:00:00.000Z" },
      { _id: "s5_2", previousStatus: "Active", newStatus: "Sold", updatedBy: "Marcus Vance", notes: "Sold out of stock to external distributor", updatedAt: "2026-05-20T00:00:00.000Z" }
    ],
    promotionHistory: []
  }
];

// LocalStorage loaders
const loadLocalGrowers = () => {
  const stored = localStorage.getItem('pinaka_growers');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Filter out soft-deleted ones just in case
      return parsed.filter(g => !g.isDeleted);
    } catch (e) {
      console.error("Local storage decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_growers', JSON.stringify(MOCK_SEED_GROWERS));
  return MOCK_SEED_GROWERS;
};

const saveLocalGrowers = (list) => {
  localStorage.setItem('pinaka_growers', JSON.stringify(list));
};

// Helper: Calculate ADG using (Current Weight - Birth Weight) / Age in Days
const calculateADG = (dob, birthWeight, currentWeight, latestLogDate) => {
  const ageInDays = Math.ceil((new Date(latestLogDate) - new Date(dob)) / (1000 * 60 * 60 * 24));
  if (ageInDays <= 0) return 0;
  return Number(((currentWeight - birthWeight) / ageInDays).toFixed(3));
};

export const useGrowerStore = create((set, get) => ({
  growers: [],
  selectedGrower: null,
  loading: false,
  error: null,

  fetchGrowers: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      let list = loadLocalGrowers();

      // Apply filter bounds
      if (filters.status) {
        list = list.filter(g => g.status === filters.status);
      }
      if (filters.sex) {
        list = list.filter(g => g.sex === filters.sex);
      }
      if (filters.penNo) {
        list = list.filter(g => g.penNo.toLowerCase().includes(filters.penNo.toLowerCase()));
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(g => 
          g.animalNo.toLowerCase().includes(query) ||
          g.breed.toLowerCase().includes(query) ||
          g.penNo.toLowerCase().includes(query)
        );
      }

      set({ growers: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchGrowerById: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      const match = list.find(g => g._id === id);
      if (!match) throw new Error("Grower record card not found on your device.");

      set({ selectedGrower: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createGrower: async (growerData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      
      // Enforce unique animalNo
      const code = growerData.animalNo.toUpperCase().trim();
      const exists = list.some(g => g.animalNo === code);
      if (exists) throw new Error(`Animal ID '${code}' is already registered.`);

      const birthWeightVal = Number(growerData.birthWeight);
      if (birthWeightVal <= 0) throw new Error("Birth weight must be positive.");

      const dobStr = growerData.dob;
      if (new Date(dobStr) > new Date()) throw new Error("Date of birth cannot be in the future.");

      // Set up initial log arrays matching Mongoose pre-save
      const initialLogs = [
        {
          _id: `w_${Date.now()}_birth`,
          date: dobStr,
          type: "Birth",
          weight: birthWeightVal,
          notes: "Initial registered birth weight",
          enteredBy: growerData.enteredBy || "System"
        }
      ];

      // If weaning weight is supplied, push it
      const weaningVal = Number(growerData.weaningWeight || 0);
      if (weaningVal > 0) {
        initialLogs.push({
          _id: `w_${Date.now()}_wean`,
          date: new Date().toISOString().split('T')[0],
          type: "Weaning",
          weight: weaningVal,
          notes: "Initial registered weaning weight",
          enteredBy: growerData.enteredBy || "System"
        });
      }

      // Calculate initial ADG
      const sortedLogs = [...initialLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latestLog = sortedLogs[sortedLogs.length - 1];
      const initialADG = calculateADG(dobStr, birthWeightVal, latestLog.weight, latestLog.date);

      const newRecord = {
        _id: `g_${Date.now()}`,
        animalNo: code,
        animalId: code,
        dob: dobStr,
        sex: growerData.sex,
        breed: growerData.breed,
        sireNo: growerData.sireNo || "UNKNOWN",
        damNo: growerData.damNo || "UNKNOWN",
        birthWeight: birthWeightVal,
        weaningWeight: weaningVal,
        penNo: growerData.penNo,
        status: growerData.status || "Active",
        latestWeight: latestLog.weight,
        adg: initialADG,
        slaughterDate: growerData.slaughterDate || "",
        notes: growerData.notes || "",
        // Lifecycle provenance (populated when promoted from piglet)
        originPigletId: growerData.originPigletId || growerData.originalPigletId || null,
        originalPigletId: growerData.originalPigletId || growerData.originPigletId || null,
        temporaryPigletId: growerData.temporaryPigletId || growerData.originPigletId || null,
        permanentGrowerId: growerData.permanentGrowerId || code,
        sowId: growerData.sowId || null,
        boarId: growerData.boarId || null,
        farrowingId: growerData.farrowingId || null,
        lifecycleStage: growerData.lifecycleStage || 'Grower',
        lifecycleSource: growerData.lifecycleSource || "Direct Entry",
        promotionDate: growerData.promotionDate || null,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        weightLogs: initialLogs,
        statusHistory: [
          {
            _id: `s_${Date.now()}_init`,
            previousStatus: "None",
            newStatus: growerData.status || "Active",
            updatedBy: growerData.enteredBy || "System",
            notes: "Initial registration",
            updatedAt: new Date().toISOString()
          }
        ],
        promotionHistory: []
      };

      const updatedList = [newRecord, ...list];
      saveLocalGrowers(updatedList);

      set({ growers: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateGrower: async (id, updateData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      
      const updatedList = list.map(g => {
        if (g._id === id) {
          const updated = {
            ...g,
            ...updateData,
            birthWeight: Number(updateData.birthWeight || g.birthWeight),
            weaningWeight: updateData.weaningWeight ? Number(updateData.weaningWeight) : g.weaningWeight
          };

          // Re-sync weaning weight log if weaning weight has changed
          if (updateData.weaningWeight !== undefined) {
            const weanVal = Number(updateData.weaningWeight);
            const weanIndex = updated.weightLogs.findIndex(w => w.type === 'Weaning');
            if (weanVal > 0) {
              if (weanIndex >= 0) {
                updated.weightLogs[weanIndex].weight = weanVal;
              } else {
                updated.weightLogs.push({
                  _id: `w_${Date.now()}_wean`,
                  date: new Date().toISOString().split('T')[0],
                  type: "Weaning",
                  weight: weanVal,
                  notes: "Added weaning weight",
                  enteredBy: updateData.enteredBy || "System"
                });
              }
            } else if (weanIndex >= 0) {
              updated.weightLogs.splice(weanIndex, 1);
            }
          }

          // Recalculate parameters
          const sorted = [...updated.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
          const latest = sorted[sorted.length - 1];
          updated.latestWeight = latest.weight;
          updated.adg = calculateADG(updated.dob, updated.birthWeight, latest.weight, latest.date);

          return updated;
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      const matched = updatedList.find(g => g._id === id);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteGrower: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      
      // Perform soft delete
      const updatedList = list.map(g => {
        if (g._id === id) {
          return { ...g, isDeleted: true };
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      
      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: get().selectedGrower?._id === id ? null : get().selectedGrower,
        loading: false 
      });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Weight Logs sub-resource CRUD
  addWeightRecord: async (id, weightLog) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      
      const newWeight = Number(weightLog.weight);
      if (newWeight <= 0) throw new Error("Weight must be positive.");

      const logDate = weightLog.date || new Date().toISOString().split('T')[0];
      if (new Date(logDate) > new Date()) throw new Error("Future dates are not allowed for weight entry.");

      const updatedList = list.map(g => {
        if (g._id === id) {
          const updated = { ...g };
          updated.weightLogs = [
            ...updated.weightLogs,
            {
              _id: `w_${Date.now()}`,
              date: logDate,
              type: weightLog.type || 'Weekly',
              weight: newWeight,
              notes: weightLog.notes || '',
              enteredBy: weightLog.enteredBy || 'System'
            }
          ];

          // Recalculate latestWeight and ADG
          const sorted = [...updated.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
          const latest = sorted[sorted.length - 1];
          updated.latestWeight = latest.weight;
          updated.adg = calculateADG(updated.dob, updated.birthWeight, latest.weight, latest.date);

          return updated;
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      const matched = updatedList.find(g => g._id === id);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateWeightRecord: async (id, weightLogId, updatedLogData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();

      const newWeight = Number(updatedLogData.weight);
      if (updatedLogData.weight !== undefined && newWeight <= 0) throw new Error("Weight must be positive.");

      const logDate = updatedLogData.date;
      if (logDate && new Date(logDate) > new Date()) throw new Error("Future dates are not allowed for weight entry.");

      const updatedList = list.map(g => {
        if (g._id === id) {
          const updated = { ...g };
          updated.weightLogs = updated.weightLogs.map(w => {
            if (w._id === weightLogId) {
              return {
                ...w,
                date: updatedLogData.date || w.date,
                type: updatedLogData.type || w.type,
                weight: updatedLogData.weight !== undefined ? newWeight : w.weight,
                notes: updatedLogData.notes !== undefined ? updatedLogData.notes : w.notes,
                enteredBy: updatedLogData.enteredBy || w.enteredBy || 'System'
              };
            }
            return w;
          });

          // Recalculate
          const sorted = [...updated.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
          const latest = sorted[sorted.length - 1];
          updated.latestWeight = latest.weight;
          updated.adg = calculateADG(updated.dob, updated.birthWeight, latest.weight, latest.date);

          return updated;
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      const matched = updatedList.find(g => g._id === id);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteWeightRecord: async (id, weightLogId) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();
      
      const targetGrower = list.find(g => g._id === id);
      if (!targetGrower) throw new Error("Grower not found");

      const log = targetGrower.weightLogs.find(w => w._id === weightLogId);
      if (!log) throw new Error("Weight entry not found");

      if (log.type === 'Birth') {
        throw new Error("Initial Birth Weight log cannot be deleted.");
      }

      const updatedList = list.map(g => {
        if (g._id === id) {
          const updated = { ...g };
          updated.weightLogs = updated.weightLogs.filter(w => w._id !== weightLogId);

          // Recalculate
          const sorted = [...updated.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
          const latest = sorted[sorted.length - 1];
          updated.latestWeight = latest.weight;
          updated.adg = calculateADG(updated.dob, updated.birthWeight, latest.weight, latest.date);

          return updated;
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      const matched = updatedList.find(g => g._id === id);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Status transitions
  updateStatusRecord: async (id, status, remarks, updatedBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalGrowers();

      const updatedList = list.map(g => {
        if (g._id === id) {
          const updated = { ...g };
          const previousStatus = updated.status;
          updated.status = status;
          updated.statusHistory = [
            ...(updated.statusHistory || []),
            {
              _id: `s_${Date.now()}`,
              previousStatus,
              newStatus: status,
              updatedBy: updatedBy || 'System',
              notes: remarks || `Status transitioned to ${status}`,
              updatedAt: new Date().toISOString()
            }
          ];
          return updated;
        }
        return g;
      });

      saveLocalGrowers(updatedList);
      const matched = updatedList.find(g => g._id === id);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Breeder promotions
  promoteToSow: async (id, promotedBy) => {
    set({ loading: true, error: null });
    try {
      let updatedGrowerRecord = null;
      let newSowRecord = null;

      try {
        // Attempt backend API call - pass skipAuthRedirect to bypass auto-logout on 401 when local DB is down
        const response = await client.post(`/growers/${id}/promote/sow`, { promotedBy }, { skipAuthRedirect: true });
        if (response && response.data) {
          updatedGrowerRecord = response.data.grower;
          newSowRecord = response.data.sow;
        }
      } catch (apiErr) {
        console.warn("MERN Promotion API failed, falling back to local storage.", apiErr);
      }

      const list = loadLocalGrowers();
      const target = list.find(g => g._id === id);
      if (!target) throw new Error("Grower not found on your device.");
      if (target.sex !== 'Female') throw new Error("Only female growers can be promoted to Sow.");
      if (target.status === 'Promoted to Sow') throw new Error("Already promoted to Sow.");

      let updatedList = [];
      let matched = null;

      if (updatedGrowerRecord && newSowRecord) {
        // Online mode: use backend records
        updatedList = list.map(g => g._id === id ? updatedGrowerRecord : g);
        matched = updatedGrowerRecord;

        // Save local Sow record in local device storage
        const sows = JSON.parse(localStorage.getItem('pinaka_sows') || '[]');
        const exists = sows.some(s => s._id === newSowRecord._id);
        if (!exists) {
          localStorage.setItem('pinaka_sows', JSON.stringify([newSowRecord, ...sows]));
        }
      } else {
        // Offline/Fallback mode: generate local records
        const newSowId = `sow_${Date.now()}`;

        updatedList = list.map(g => {
          if (g._id === id) {
            const updated = { ...g };
            const previousStatus = updated.status;
            updated.status = 'Promoted to Sow';
            updated.promotedTo = 'Sow';
            updated.promotedAt = new Date().toISOString();
            updated.sowId = newSowId;
            
            updated.statusHistory = [
              ...(updated.statusHistory || []),
              {
                _id: `s_${Date.now()}`,
                previousStatus,
                newStatus: 'Promoted to Sow',
                updatedBy: promotedBy || 'System',
                notes: 'Moved grower into Sow breeding records.',
                updatedAt: new Date().toISOString()
              }
            ];

            updated.promotionHistory = [
              ...(updated.promotionHistory || []),
              {
                _id: `p_${Date.now()}`,
                type: 'Sow',
                promotedAt: new Date().toISOString(),
                promotedBy: promotedBy || 'System',
                destinationModule: 'Sow Breeding'
              }
            ];

            return updated;
          }
          return g;
        });

        matched = updatedList.find(g => g._id === id);

        const sows = JSON.parse(localStorage.getItem('pinaka_sows') || '[]');
        newSowRecord = {
          _id: newSowId,
          animalNo: target.animalNo,
          source: 'GrowerPromotion',
          growerId: target._id,
          dob: target.dob,
          breed: target.breed,
          sireNo: target.sireNo,
          damNo: target.damNo,
          birthWeight: target.birthWeight,
          latestWeight: target.latestWeight || target.birthWeight,
          penNo: target.penNo,
          status: 'Active',
          notes: '',
          createdAt: new Date().toISOString(),
          isDeleted: false,
          heatHistory: [],
          breedingHistory: [],
          farrowingHistory: [],
          treatmentHistory: [],
          statusHistory: [
            {
              _id: `sh_${Date.now()}`,
              previousStatus: 'None',
              newStatus: 'Active',
              updatedBy: promotedBy || 'System',
              notes: 'Imported from grower records',
              updatedAt: new Date().toISOString()
            }
          ]
        };
        localStorage.setItem('pinaka_sows', JSON.stringify([newSowRecord, ...sows]));
      }

      saveLocalGrowers(updatedList);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });

      // Avoid circular dependency at module loading by using dynamic import
      try {
        const { useSowStore } = await import('./useSowStore');
        // Hydrate/Sync the Sow store with the updated localStorage to prevent "record not found" on route transition
        await useSowStore.getState().fetchSows();
      } catch (storeErr) {
        console.error("Failed to sync Sow store during promotion:", storeErr);
      }

      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  promoteToBoar: async (id, promotedBy) => {
    set({ loading: true, error: null });
    try {
      let updatedGrowerRecord = null;
      let newBoarRecord = null;

      try {
        // Attempt backend API call - pass skipAuthRedirect to bypass auto-logout on 401 when local DB is down
        const response = await client.post(`/growers/${id}/promote/boar`, { promotedBy }, { skipAuthRedirect: true });
        if (response && response.data) {
          updatedGrowerRecord = response.data.grower;
          newBoarRecord = response.data.boar;
        }
      } catch (apiErr) {
        console.warn("MERN Promotion API failed, falling back to local storage.", apiErr);
      }

      const list = loadLocalGrowers();
      const target = list.find(g => g._id === id);
      if (!target) throw new Error("Grower not found on your device.");
      if (target.sex !== 'Male') throw new Error("Only male growers can be promoted to Boar.");
      if (target.status === 'Promoted to Boar') throw new Error("Already promoted to Boar.");

      let updatedList = [];
      let matched = null;

      if (updatedGrowerRecord && newBoarRecord) {
        // Online mode: use backend records
        updatedList = list.map(g => g._id === id ? updatedGrowerRecord : g);
        matched = updatedGrowerRecord;

        // Save local Boar record in local device storage
        const boars = JSON.parse(localStorage.getItem('pinaka_boars') || '[]');
        const exists = boars.some(b => b._id === newBoarRecord._id);
        if (!exists) {
          localStorage.setItem('pinaka_boars', JSON.stringify([newBoarRecord, ...boars]));
        }
      } else {
        // Offline/Fallback mode: generate local records
        const newBoarId = `boar_${Date.now()}`;

        updatedList = list.map(g => {
          if (g._id === id) {
            const updated = { ...g };
            const previousStatus = updated.status;
            updated.status = 'Promoted to Boar';
            updated.promotedTo = 'Boar';
            updated.promotedAt = new Date().toISOString();
            updated.boarId = newBoarId;
            
            updated.statusHistory = [
              ...(updated.statusHistory || []),
              {
                _id: `s_${Date.now()}`,
                previousStatus,
                newStatus: 'Promoted to Boar',
                updatedBy: promotedBy || 'System',
                notes: 'Moved grower into Boar breeding records.',
                updatedAt: new Date().toISOString()
              }
            ];

            updated.promotionHistory = [
              ...(updated.promotionHistory || []),
              {
                _id: `p_${Date.now()}`,
                type: 'Boar',
                promotedAt: new Date().toISOString(),
                promotedBy: promotedBy || 'System',
                destinationModule: 'Boar Breeding'
              }
            ];

            return updated;
          }
          return g;
        });

        matched = updatedList.find(g => g._id === id);

        const boars = JSON.parse(localStorage.getItem('pinaka_boars') || '[]');
        newBoarRecord = {
          _id: newBoarId,
          animalNo: target.animalNo,
          source: 'GrowerPromotion',
          growerId: target._id,
          dob: target.dob,
          breed: target.breed,
          sireNo: target.sireNo,
          damNo: target.damNo,
          birthWeight: target.birthWeight,
          latestWeight: target.latestWeight || target.birthWeight,
          penNo: target.penNo,
          status: 'Active',
          notes: '',
          createdAt: new Date().toISOString(),
          isDeleted: false,
          treatmentHistory: [],
          statusHistory: [
            {
              _id: `sh_${Date.now()}`,
              previousStatus: 'None',
              newStatus: 'Active',
              updatedBy: promotedBy || 'System',
              notes: 'Imported from grower records',
              updatedAt: new Date().toISOString()
            }
          ]
        };
        localStorage.setItem('pinaka_boars', JSON.stringify([newBoarRecord, ...boars]));
      }

      saveLocalGrowers(updatedList);

      set({ 
        growers: updatedList.filter(g => !g.isDeleted), 
        selectedGrower: matched,
        loading: false 
      });

      // Avoid circular dependency at module loading by using dynamic import
      try {
        const { useBoarStore } = await import('./useBoarStore');
        // Hydrate/Sync the Boar store with the updated localStorage to prevent "record not found" on route transition
        await useBoarStore.getState().fetchBoars();
      } catch (storeErr) {
        console.error("Failed to sync Boar store during promotion:", storeErr);
      }

      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
