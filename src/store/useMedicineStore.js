import { create } from 'zustand';

const MOCK_MEDICINES = [
  {
    _id: "med_1",
    medicineId: "MED-001",
    name: "Penicillin G",
    type: "Antibiotic",
    batchNumber: "BN-2025-A1",
    supplier: "VetPharma Inc.",
    purchaseDate: "2025-10-01T00:00:00.000Z",
    expiryDate: "2026-10-01T00:00:00.000Z",
    totalQuantity: 1000,
    usedQuantity: 150,
    remainingStock: 850,
    unit: "ml",
    status: "Available",
    operator: "Admin",
    createdAt: "2025-10-01T10:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalMedicines = () => {
  const stored = localStorage.getItem('pinaka_medicines');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(m => !m.isDeleted);
    } catch (e) {
      console.error("Decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_medicines', JSON.stringify(MOCK_MEDICINES));
  return MOCK_MEDICINES;
};

const saveLocalMedicines = (list) => {
  localStorage.setItem('pinaka_medicines', JSON.stringify(list));
};

export const useMedicineStore = create((set, get) => ({
  medicines: [],
  loading: false,
  error: null,

  fetchMedicines: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMedicines();
      set({ medicines: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  registerMedicine: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMedicines();
      const newRecord = {
        _id: `med_${Date.now()}`,
        medicineId: `MED-${Date.now().toString().slice(-4)}`,
        ...data,
        usedQuantity: 0,
        remainingStock: Number(data.totalQuantity),
        status: 'Available',
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalMedicines(updatedList);
      set({ medicines: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deductStock: async (id, quantity) => {
    try {
      const list = loadLocalMedicines();
      const updatedList = list.map(m => {
        if (m._id === id || m.medicineId === id || m.name === id) {
          const qty = Number(quantity);
          const usedQuantity = (m.usedQuantity || 0) + qty;
          const remainingStock = Math.max(0, (m.totalQuantity || 0) - usedQuantity);
          return {
            ...m,
            usedQuantity,
            remainingStock,
            status: remainingStock <= 0 ? 'Out of Stock' : (remainingStock < 100 ? 'Low Stock' : 'Available')
          };
        }
        return m;
      });
      saveLocalMedicines(updatedList);
      set({ medicines: updatedList });
    } catch (e) {
      console.error("Deduct stock failed:", e);
    }
  }
}));
