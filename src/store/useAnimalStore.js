import { create } from 'zustand';

// Mock Master Stock Data
const MOCK_ANIMALS = [
  {
    _id: "ani_1",
    animalNo: "S-101",
    earTag: "ET-001",
    dob: "2024-01-15T00:00:00.000Z",
    sex: "Female",
    breed: "Large White",
    currentWeight: 185.5,
    source: "Purchased",
    supplier: "Premium Genetics Inc.",
    lifecycleStage: "Sow",
    currentPen: "Sow Unit A - Pen 12",
    operationalStatus: "Lactating",
    operator: "Dr. Alistair",
    notes: "Excellent maternal traits.",
    createdAt: "2024-08-01T10:00:00.000Z",
    isDeleted: false
  },
  {
    _id: "ani_2",
    animalNo: "B-201",
    earTag: "ET-002",
    dob: "2023-11-20T00:00:00.000Z",
    sex: "Male",
    breed: "Duroc",
    currentWeight: 240.0,
    source: "Imported",
    supplier: "Global Swine Co.",
    lifecycleStage: "Boar",
    currentPen: "Boar Stud - Pen 01",
    operationalStatus: "Active",
    operator: "Dr. Alistair",
    notes: "High libido.",
    createdAt: "2024-05-10T10:00:00.000Z",
    isDeleted: false
  },
  {
    _id: "ani_3",
    animalNo: "G-101-1234-1",
    earTag: "ET-003",
    dob: "2025-06-15T00:00:00.000Z",
    sex: "Male",
    breed: "Crossbred",
    currentWeight: 85.0,
    source: "Farm Born",
    supplier: "",
    lifecycleStage: "Grower",
    currentPen: "Fattening House - Pen 05",
    operationalStatus: "Active",
    operator: "System",
    notes: "Transferred from Farrowing.",
    createdAt: "2025-08-15T10:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalAnimals = () => {
  const stored = localStorage.getItem('pinaka_animals');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(a => !a.isDeleted);
    } catch (e) {
      console.error("Local storage decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_animals', JSON.stringify(MOCK_ANIMALS));
  return MOCK_ANIMALS;
};

const saveLocalAnimals = (list) => {
  localStorage.setItem('pinaka_animals', JSON.stringify(list));
};

export const useAnimalStore = create((set, get) => ({
  animals: [],
  selectedAnimal: null,
  loading: false,
  error: null,

  fetchAnimals: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalAnimals();
      set({ animals: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAnimalById: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalAnimals();
      const match = list.find(a => a._id === id || a.animalNo === id);
      if (!match) throw new Error("Animal record not found.");
      set({ selectedAnimal: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  registerAnimal: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalAnimals();
      
      if (list.find(a => a.animalNo === data.animalNo)) {
        throw new Error("Animal Number already exists in the registry.");
      }

      const newRecord = {
        _id: `ani_${Date.now()}`,
        ...data,
        lifecycleStage: data.lifecycleStage || 'Piglet',
        operationalStatus: 'Active',
        currentWeight: Number(data.currentWeight || 0),
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalAnimals(updatedList);
      set({ animals: updatedList, loading: false });

      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateAnimal: async (id, updateData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalAnimals();
      const updatedList = list.map(a => {
        if (a._id === id) {
          return { ...a, ...updateData };
        }
        return a;
      });

      saveLocalAnimals(updatedList);
      const match = updatedList.find(a => a._id === id);
      set({ animals: updatedList, selectedAnimal: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteAnimal: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalAnimals();
      const updatedList = list.map(a => {
        if (a._id === id) {
          return { 
            ...a, 
            isDeleted: true,
            lifecycleStage: 'Dead',
            operationalStatus: 'Culled'
          };
        }
        return a;
      });

      saveLocalAnimals(updatedList);
      set({ 
        animals: updatedList.filter(a => !a.isDeleted), 
        selectedAnimal: null, 
        loading: false 
      });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
