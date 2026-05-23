import { create } from 'zustand';

const MOCK_MEDICINE_RECORDS = [
  {
    _id: "rec_1",
    recordId: "REC-001",
    animalId: "S-101",
    animalType: "Sow",
    breed: "Large White",
    status: "Pregnant",
    penNo: "Breeding Unit 1",
    age: "24 months",
    sex: "Female",
    medicineName: "Penicillin G",
    medicineType: "Antibiotic",
    purpose: "MMA Syndrome",
    symptoms: "High fever, lethargy",
    doseQuantity: "10",
    doseUnit: "ml",
    administrationRoute: "Intramuscular",
    notes: "Administered standard dosage. Response expected in 24 hours.",
    vetName: "Dr. Alistair",
    dateGiven: "2026-05-18",
    followUpDate: "2026-05-21",
    followUpStatus: "Recovering",
    createdAt: "2026-05-18T10:00:00.000Z",
    isDeleted: false
  },
  {
    _id: "rec_2",
    recordId: "REC-002",
    animalId: "G-101-1234-1",
    animalType: "Grower",
    breed: "Crossbred",
    status: "Active",
    penNo: "Fattening House - Pen 05",
    age: "3 months",
    sex: "Male",
    medicineName: "Ivermectin",
    medicineType: "Deworming",
    purpose: "Routine Parasite Control",
    symptoms: "None - routine management",
    doseQuantity: "2",
    doseUnit: "ml",
    administrationRoute: "Oral",
    notes: "Routine vaccination and deworming schedule.",
    vetName: "System Operator",
    dateGiven: "2026-05-20",
    followUpDate: "",
    followUpStatus: "Completed",
    createdAt: "2026-05-20T08:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalRecords = () => {
  const stored = localStorage.getItem('pinaka_medicine_records');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(r => !r.isDeleted);
    } catch (e) {
      console.error("Decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_medicine_records', JSON.stringify(MOCK_MEDICINE_RECORDS));
  return MOCK_MEDICINE_RECORDS;
};

const saveLocalRecords = (list) => {
  localStorage.setItem('pinaka_medicine_records', JSON.stringify(list));
};

export const useMedicineStore = create((set, get) => ({
  medicines: [], // acts as the administration records array to preserve imports
  loading: false,
  error: null,

  fetchMedicines: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalRecords();
      set({ medicines: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  registerMedicine: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalRecords();
      const newRecord = {
        _id: `rec_${Date.now()}`,
        recordId: `REC-${Date.now().toString().slice(-4)}`,
        animalId: data.animalId,
        animalType: data.animalType,
        breed: data.breed || 'Crossbred',
        status: data.status || 'Active',
        penNo: data.penNo || 'Pen A',
        age: data.age || '—',
        sex: data.sex || 'Female',
        medicineName: data.medicineName,
        medicineType: data.medicineType,
        purpose: data.purpose,
        symptoms: data.symptoms || '—',
        doseQuantity: data.doseQuantity,
        doseUnit: data.doseUnit || 'ml',
        administrationRoute: data.administrationRoute || 'Oral',
        notes: data.notes || '',
        vetName: data.vetName || 'System',
        dateGiven: data.dateGiven || new Date().toISOString().split('T')[0],
        followUpDate: data.followUpDate || '',
        followUpStatus: data.followUpDate ? 'Pending' : 'Completed',
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalRecords(updatedList);
      
      // Update local Zustand state
      set({ medicines: updatedList, loading: false });
      
      // Also update dynamic animal medical logs in local storage
      try {
        const key = `medical_history_${data.animalId}`;
        const existingHistory = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([newRecord, ...existingHistory]));
      } catch (err) {
        console.error("Animal profile history update failed:", err);
      }

      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateFollowUpStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalRecords();
      const updatedList = list.map(r => {
        if (r._id === id) {
          return { ...r, followUpStatus: status };
        }
        return r;
      });

      saveLocalRecords(updatedList);
      set({ medicines: updatedList, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteMedicineRecord: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalRecords();
      const updatedList = list.map(r => {
        if (r._id === id) {
          return { ...r, isDeleted: true };
        }
        return r;
      });

      saveLocalRecords(updatedList);
      set({ medicines: updatedList.filter(r => !r.isDeleted), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
