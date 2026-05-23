import { create } from 'zustand';
import { useGrowerStore } from './useGrowerStore';

const MOCK_SEED_BOARS = [
  {
    _id: "boar_1",
    animalNo: "B-201",
    dob: "2024-10-15", // ~220 days old (breeding active)
    breed: "Duroc",
    sireNo: "D-901",
    damNo: "DAM-104",
    birthWeight: 1.5,
    latestWeight: 185.0,
    penNo: "Boar Unit 1",
    status: "Active",
    source: "Direct",
    notes: "Proven breeder, excellent semen quality and high vigor.",
    isDeleted: false,
    createdAt: "2024-10-15T00:00:00.000Z",
    
    // Extended breeding male reproductive fields
    pubertyDate: "2025-04-15",
    firstSemenCollectionDate: "2025-04-20",
    fertilityApprovalDate: "2025-05-01",
    breedingReadyDate: "2025-05-01",
    breedingStatus: "Breeding Active",
    diseaseTestResult: "Negative",
    congenitalDefects: "None",
    rudimentaryTeats: 14,
    
    // References to sow mating/services (represented as simulated breeding events)
    serviceHistoryRefs: ["br_101", "br_102", "br_103", "br_104"],
    
    fertilityAnalytics: {
      totalServices: 4,
      successfulPregnancies: 3,
      failedServices: 1,
      pregnancySuccessRate: 75.0,
      totalPigletsBorn: 33,
      averageLitterSize: 11.0,
      averagePigletSurvival: 93.9,
      averageWeaningCount: 10.0
    },

    healthTests: [
      { _id: "ht1_1", testDate: "2025-01-10", diseaseResult: "Negative", defectsFound: "None", vetNotes: "Routine pre-breeding screening", actionTaken: "Approved for herd integration" },
      { _id: "ht1_2", testDate: "2025-04-20", diseaseResult: "Negative", defectsFound: "None", vetNotes: "Puberty/semen motility check", actionTaken: "Cleared for service" }
    ],

    treatmentHistory: [],
    
    statusHistory: [
      { _id: "shb1_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Manually registered", updatedAt: "2024-10-15T00:00:00.000Z" },
      { _id: "shb1_2", previousStatus: "Growing", newStatus: "Puberty Reached", updatedBy: "Marcus Vance", notes: "First verified erection and standing mounting signs.", updatedAt: "2025-04-15T00:00:00.000Z" },
      { _id: "shb1_3", previousStatus: "Puberty Reached", newStatus: "Breeding Ready", updatedBy: "Dr. Alistair", notes: "Semen analysis meets motility requirements.", updatedAt: "2025-05-01T00:00:00.000Z" },
      { _id: "shb1_4", previousStatus: "Breeding Ready", newStatus: "Breeding Active", updatedBy: "Dr. Alistair", notes: "Mated successfully with Sow S-101.", updatedAt: "2025-05-05T00:00:00.000Z" }
    ]
  },
  {
    _id: "boar_2",
    animalNo: "B-202",
    dob: "2025-01-10", // ~130 days old (growing breeder, near puberty)
    breed: "Large White",
    sireNo: "LW-501",
    damNo: "DAM-202",
    birthWeight: 1.45,
    latestWeight: 112.0,
    penNo: "Boar Unit 2",
    status: "Active",
    source: "Direct",
    notes: "Calm temperament, promising growth curves.",
    isDeleted: false,
    createdAt: "2025-01-10T00:00:00.000Z",
    
    pubertyDate: null,
    firstSemenCollectionDate: null,
    fertilityApprovalDate: null,
    breedingReadyDate: null,
    breedingStatus: "Growing",
    diseaseTestResult: "Negative",
    congenitalDefects: "None",
    rudimentaryTeats: 12,
    
    serviceHistoryRefs: [],
    
    fertilityAnalytics: {
      totalServices: 0,
      successfulPregnancies: 0,
      failedServices: 0,
      pregnancySuccessRate: 0,
      totalPigletsBorn: 0,
      averageLitterSize: 0,
      averagePigletSurvival: 0,
      averageWeaningCount: 0
    },

    healthTests: [
      { _id: "ht2_1", testDate: "2025-04-12", diseaseResult: "Negative", defectsFound: "None", vetNotes: "Standard entry test course", actionTaken: "Placed in isolation quarantine" }
    ],

    treatmentHistory: [
      { _id: "t2_1", treatmentDate: "2025-05-02", symptoms: "Minor joint stiffness", diagnosis: "Growth plate strain", medicineUsed: "Meloxicam", vaccineGiven: "", doctorNotes: "Light anti-inflammatory administered.", recoveryStatus: "Recovered" }
    ],

    statusHistory: [
      { _id: "shb2_1", previousStatus: "None", newStatus: "Active", updatedBy: "System", notes: "Manually registered", updatedAt: "2025-01-10T00:00:00.000Z" }
    ]
  }
];

// LocalStorage helpers
const loadLocalBoars = () => {
  const stored = localStorage.getItem('pinaka_boars');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(b => !b.isDeleted);
    } catch (e) {
      console.error("Local storage decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_boars', JSON.stringify(MOCK_SEED_BOARS));
  return MOCK_SEED_BOARS;
};

const saveLocalBoars = (list) => {
  localStorage.setItem('pinaka_boars', JSON.stringify(list));
};

export const useBoarStore = create((set, get) => ({
  boars: [],
  selectedBoar: null,
  loading: false,
  error: null,

  fetchBoars: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      let list = loadLocalBoars();

      // Apply filters
      if (filters.status) {
        list = list.filter(b => b.status === filters.status);
      }
      if (filters.breedingStatus) {
        list = list.filter(b => b.breedingStatus === filters.breedingStatus);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(b => 
          b.animalNo.toLowerCase().includes(query) ||
          b.breed.toLowerCase().includes(query) ||
          b.penNo.toLowerCase().includes(query)
        );
      }

      set({ boars: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchBoarById: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const match = list.find(b => b._id === id);
      if (!match) throw new Error("Boar breeding card record not found.");

      set({ selectedBoar: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createBoar: async (boarData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();

      const code = boarData.animalNo.toUpperCase().trim();
      const exists = list.some(b => b.animalNo === code);
      if (exists) throw new Error(`Animal No '${code}' already registered.`);

      const birthW = Number(boarData.birthWeight || 1.5);
      const latestW = Number(boarData.currentWeight || boarData.birthWeight || 150);

      const newRecord = {
        _id: `boar_${Date.now()}`,
        animalNo: code,
        dob: boarData.dob,
        breed: boarData.breed,
        sireNo: boarData.sireNo || 'UNKNOWN',
        damNo: boarData.damNo || 'UNKNOWN',
        birthWeight: birthW,
        latestWeight: latestW,
        penNo: boarData.penNo,
        status: boarData.status || 'Active',
        source: 'Direct',
        notes: boarData.notes || '',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        
        // Extended properties
        pubertyDate: boarData.pubertyDate || null,
        firstSemenCollectionDate: null,
        fertilityApprovalDate: null,
        breedingReadyDate: null,
        breedingStatus: boarData.breedingStatus || 'Growing',
        diseaseTestResult: boarData.diseaseTestResult || 'Negative',
        congenitalDefects: boarData.congenitalDefects || 'None',
        rudimentaryTeats: Number(boarData.rudimentaryTeats || 0),
        
        serviceHistoryRefs: [],
        
        fertilityAnalytics: {
          totalServices: 0,
          successfulPregnancies: 0,
          failedServices: 0,
          pregnancySuccessRate: 0,
          totalPigletsBorn: 0,
          averageLitterSize: 0,
          averagePigletSurvival: 0,
          averageWeaningCount: 0
        },

        healthTests: boarData.diseaseTestResult ? [
          {
            _id: `ht_${Date.now()}`,
            testDate: new Date().toISOString().split('T')[0],
            diseaseResult: boarData.diseaseTestResult,
            defectsFound: boarData.congenitalDefects || 'None',
            vetNotes: 'Initial registration screening tests',
            actionTaken: 'Registered'
          }
        ] : [],

        treatmentHistory: [],
        statusHistory: [
          {
            _id: `sh_${Date.now()}`,
            previousStatus: 'None',
            newStatus: boarData.status || 'Active',
            updatedBy: boarData.enteredBy || 'System',
            notes: 'Manual breeder registration',
            updatedAt: new Date().toISOString()
          }
        ]
      };

      const updatedList = [newRecord, ...list];
      saveLocalBoars(updatedList);

      set({ boars: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  importBoarFromGrower: async (growerId, notes, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      
      // Load growers from storage to promote grower
      const growersList = JSON.parse(localStorage.getItem('pinaka_growers') || '[]');
      const grower = growersList.find(g => g._id === growerId);
      
      if (!grower) throw new Error("Grower record not found.");
      if (grower.sex !== 'Male') throw new Error("Only male growers can be promoted to Boars.");

      const code = grower.animalNo.toUpperCase().trim();
      const exists = list.some(b => b.animalNo === code);
      if (exists) throw new Error(`Grower '${code}' is already registered as a Boar breeder.`);

      // Create boar
      const newBoar = {
        _id: `boar_${Date.now()}`,
        animalNo: code,
        dob: grower.dob,
        breed: grower.breed,
        sireNo: grower.sireNo || 'UNKNOWN',
        damNo: grower.damNo || 'UNKNOWN',
        birthWeight: grower.birthWeight || 1.5,
        latestWeight: grower.latestWeight || grower.birthWeight || 80,
        penNo: grower.penNo,
        status: 'Active',
        source: 'GrowerPromotion',
        growerId: grower._id,
        notes: notes || grower.notes || 'Promoted and imported from Grower Records.',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        
        pubertyDate: null,
        firstSemenCollectionDate: null,
        fertilityApprovalDate: null,
        breedingReadyDate: null,
        breedingStatus: 'Growing',
        diseaseTestResult: 'Negative',
        congenitalDefects: 'None',
        rudimentaryTeats: 0,
        
        serviceHistoryRefs: [],
        
        fertilityAnalytics: {
          totalServices: 0,
          successfulPregnancies: 0,
          failedServices: 0,
          pregnancySuccessRate: 0,
          totalPigletsBorn: 0,
          averageLitterSize: 0,
          averagePigletSurvival: 0,
          averageWeaningCount: 0
        },

        healthTests: [
          {
            _id: `ht_${Date.now()}`,
            testDate: new Date().toISOString().split('T')[0],
            diseaseResult: 'Negative',
            defectsFound: 'None',
            vetNotes: 'Quarantine and screening upon Grower Promotion',
            actionTaken: 'Admitted to Breeder Registry'
          }
        ],

        treatmentHistory: grower.treatmentHistory || [],
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
            status: 'Promoted to Boar',
            promotedTo: 'Boar',
            promotedAt: new Date().toISOString(),
            boarId: newBoar._id,
            statusHistory: [
              ...(g.statusHistory || []),
              {
                _id: `sh_g_${Date.now()}`,
                previousStatus: g.status,
                newStatus: 'Promoted to Boar',
                updatedBy: enteredBy || 'System',
                notes: 'Promoted to Boar breeding registry',
                updatedAt: new Date().toISOString()
              }
            ],
            promotionHistory: [
              ...(g.promotionHistory || []),
              {
                _id: `pr_g_${Date.now()}`,
                type: 'Boar',
                promotedAt: new Date().toISOString(),
                promotedBy: enteredBy || 'System',
                destinationModule: 'Boar Breeding'
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

      const updatedBoars = [newBoar, ...list];
      saveLocalBoars(updatedBoars);

      set({ boars: updatedBoars, loading: false });
      return newBoar;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Manual readiness workflows
  markPubertyReached: async (id, date, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const updatedList = list.map(b => {
        if (b._id === id) {
          const prevStatus = b.breedingStatus;
          return {
            ...b,
            pubertyDate: date || new Date().toISOString().split('T')[0],
            breedingStatus: 'Puberty Reached',
            statusHistory: [
              ...(b.statusHistory || []),
              {
                _id: `sh_${Date.now()}`,
                previousStatus: prevStatus,
                newStatus: 'Puberty Reached',
                updatedBy: enteredBy || 'System',
                notes: 'Manual puberty verification logged.',
                updatedAt: new Date().toISOString()
              }
            ]
          };
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);
      set({ boars: updatedList, selectedBoar: matched, loading: false });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  markBreedingReady: async (id, date, semenDate, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const updatedList = list.map(b => {
        if (b._id === id) {
          const prevStatus = b.breedingStatus;
          return {
            ...b,
            breedingReadyDate: date || new Date().toISOString().split('T')[0],
            firstSemenCollectionDate: semenDate || b.firstSemenCollectionDate || new Date().toISOString().split('T')[0],
            breedingStatus: 'Breeding Ready',
            statusHistory: [
              ...(b.statusHistory || []),
              {
                _id: `sh_${Date.now()}`,
                previousStatus: prevStatus,
                newStatus: 'Breeding Ready',
                updatedBy: enteredBy || 'System',
                notes: 'Manual breeding readiness verification approved.',
                updatedAt: new Date().toISOString()
              }
            ]
          };
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);
      set({ boars: updatedList, selectedBoar: matched, loading: false });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  markBreedingActive: async (id, date, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const updatedList = list.map(b => {
        if (b._id === id) {
          const prevStatus = b.breedingStatus;
          return {
            ...b,
            fertilityApprovalDate: date || new Date().toISOString().split('T')[0],
            breedingStatus: 'Breeding Active',
            statusHistory: [
              ...(b.statusHistory || []),
              {
                _id: `sh_${Date.now()}`,
                previousStatus: prevStatus,
                newStatus: 'Breeding Active',
                updatedBy: enteredBy || 'System',
                notes: 'Boar activated as fully functional breeding male pig.',
                updatedAt: new Date().toISOString()
              }
            ]
          };
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);
      set({ boars: updatedList, selectedBoar: matched, loading: false });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addHealthTest: async (id, testData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const updatedList = list.map(b => {
        if (b._id === id) {
          const updated = { ...b };
          updated.healthTests = [
            ...(updated.healthTests || []),
            {
              _id: `ht_${Date.now()}`,
              testDate: testData.testDate || new Date().toISOString().split('T')[0],
              diseaseResult: testData.diseaseResult,
              defectsFound: testData.defectsFound || 'None',
              vetNotes: testData.vetNotes || '',
              actionTaken: testData.actionTaken || ''
            }
          ];
          
          if (testData.diseaseResult && testData.diseaseResult !== 'Negative') {
            updated.diseaseTestResult = testData.diseaseResult;
          }
          if (testData.defectsFound && testData.defectsFound !== 'None') {
            updated.congenitalDefects = testData.defectsFound;
          }

          return updated;
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);
      set({ boars: updatedList, selectedBoar: matched, loading: false });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addTreatmentLog: async (id, treatmentData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();

      const updatedList = list.map(b => {
        if (b._id === id) {
          const updated = { ...b };
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
              notes: `Boar placed under veterinary observation for ${treatmentData.diagnosis}`,
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
              notes: `Boar fully recovered from treatment course.`,
              updatedAt: new Date().toISOString()
            });
          }

          return updated;
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);

      set({ 
        boars: updatedList, 
        selectedBoar: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateBoarStatusDirect: async (id, status, notes, enteredBy) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();

      const updatedList = list.map(b => {
        if (b._id === id) {
          const updated = { ...b };
          const previousStatus = updated.status;
          updated.status = status;
          
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
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);

      set({ 
        boars: updatedList, 
        selectedBoar: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateBoarDetails: async (id, updatedData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      const updatedList = list.map(b => {
        if (b._id === id) {
          return {
            ...b,
            breed: updatedData.breed,
            sireNo: updatedData.sireNo,
            damNo: updatedData.damNo,
            penNo: updatedData.penNo,
            latestWeight: Number(updatedData.latestWeight || b.latestWeight || 150),
            notes: updatedData.notes,
            diseaseTestResult: updatedData.diseaseTestResult || b.diseaseTestResult,
            congenitalDefects: updatedData.congenitalDefects || b.congenitalDefects,
            rudimentaryTeats: Number(updatedData.rudimentaryTeats || b.rudimentaryTeats || 0)
          };
        }
        return b;
      });

      saveLocalBoars(updatedList);
      const matched = updatedList.find(b => b._id === id);

      set({ 
        boars: updatedList, 
        selectedBoar: matched,
        loading: false 
      });
      return matched;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteBoar: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalBoars();
      
      // Perform soft delete
      const updatedList = list.map(b => {
        if (b._id === id) {
          return { ...b, isDeleted: true };
        }
        return b;
      });

      saveLocalBoars(updatedList);
      
      set({ 
        boars: updatedList.filter(b => !b.isDeleted), 
        selectedBoar: get().selectedBoar?._id === id ? null : get().selectedBoar,
        loading: false 
      });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
