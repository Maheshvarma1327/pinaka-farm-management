import { create } from 'zustand';
import { useAnimalStore } from './useAnimalStore';

const MOCK_MORTALITIES = [
  {
    _id: "mort_1",
    mortalityId: "MORT-001",
    animalId: "G-101-1111-5",
    lifecycleStage: "Grower",
    penNumber: "Fattening House - Pen 03",
    ageAtDeath: 120,
    sex: "Male",
    causeOfDeath: "Respiratory Disease",
    postmortemFindings: "Lungs congested, suspected PRRS",
    dateOfDeath: "2026-05-10T00:00:00.000Z",
    operator: "Dr. Alistair",
    notes: "Isolated from herd 2 days prior.",
    createdAt: "2026-05-10T11:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalMortalities = () => {
  const stored = localStorage.getItem('pinaka_mortalities');
  if (stored) {
    try { return JSON.parse(stored).filter(m => !m.isDeleted); }
    catch (e) { console.error("Decode failure:", e); }
  }
  localStorage.setItem('pinaka_mortalities', JSON.stringify(MOCK_MORTALITIES));
  return MOCK_MORTALITIES;
};

const saveLocalMortalities = (list) => {
  localStorage.setItem('pinaka_mortalities', JSON.stringify(list));
};

export const useMortalityStore = create((set, get) => ({
  mortalities: [],
  loading: false,
  error: null,

  fetchMortalities: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMortalities();
      set({ mortalities: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  recordMortality: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMortalities();
      const newRecord = {
        _id: `mort_${Date.now()}`,
        mortalityId: `MORT-${Date.now().toString().slice(-4)}`,
        ...data,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      const updatedList = [newRecord, ...list];
      saveLocalMortalities(updatedList);

      // Sync with Animal Store - mark animal as Dead
      const animalStore = useAnimalStore.getState();
      const allAnimals = animalStore.animals;
      const targetAnimal = allAnimals.find(a => a.animalNo === data.animalId);
      if (targetAnimal && animalStore.updateAnimal) {
        await animalStore.updateAnimal(targetAnimal._id, {
          lifecycleStage: 'Dead',
          operationalStatus: 'Culled'
        });
      }

      set({ mortalities: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
