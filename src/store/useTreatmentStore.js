import { create } from 'zustand';

const MOCK_TREATMENTS = [
  {
    _id: "trt_1",
    treatmentId: "TRT-001",
    animalId: "S-101",
    animalType: "Sow",
    symptoms: "High fever, lethargy",
    diagnosis: "MMA (Mastitis, Metritis, Agalactia)",
    treatmentDetails: "Administered broad-spectrum antibiotics and anti-inflammatory",
    vetName: "Dr. Alistair",
    startDate: "2026-05-18T00:00:00.000Z",
    followUpDate: "2026-05-21T00:00:00.000Z",
    recoveryStatus: "Recovering",
    medicinesUsed: [
      { medicineId: "MED-001", medicineName: "Penicillin G", dose: "10ml" }
    ],
    operator: "Dr. Alistair",
    notes: "Sow is responding well to treatment. Milk flow is returning.",
    createdAt: "2026-05-18T10:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalTreatments = () => {
  const stored = localStorage.getItem('pinaka_treatments');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(t => !t.isDeleted);
    } catch (e) {
      console.error("Decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_treatments', JSON.stringify(MOCK_TREATMENTS));
  return MOCK_TREATMENTS;
};

const saveLocalTreatments = (list) => {
  localStorage.setItem('pinaka_treatments', JSON.stringify(list));
};

export const useTreatmentStore = create((set, get) => ({
  treatments: [],
  loading: false,
  error: null,

  fetchTreatments: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalTreatments();
      set({ treatments: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  registerTreatment: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalTreatments();
      const newRecord = {
        _id: `trt_${Date.now()}`,
        treatmentId: `TRT-${Date.now().toString().slice(-4)}`,
        ...data,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalTreatments(updatedList);

      // Sync: Deduct stock from Medicine Store
      if (data.medicineId && data.doseQuantity) {
        try {
          const { useMedicineStore } = await import('./useMedicineStore');
          const medStore = useMedicineStore.getState();
          await medStore.deductStock(data.medicineId, data.doseQuantity);
        } catch (err) {
          console.error("Failed to deduct medicine stock:", err);
        }
      }

      set({ treatments: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  updateTreatmentStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalTreatments();
      const updatedList = list.map(t => {
        if (t._id === id) {
          return { ...t, recoveryStatus: status };
        }
        return t;
      });

      saveLocalTreatments(updatedList);
      set({ treatments: updatedList, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
