import { create } from 'zustand';

const MOCK_MEDICINES = [
  {
    _id: "med_1",
    medicineId: "MED-001",
    name: "Penicillin G",
    type: "Antibiotic",
    batchNumber: "BN-2025-A1",
    supplier: "VetPharma Inc.",
    manufacturer: "Genetics Lab Co.",
    purchaseDate: "2025-10-01",
    expiryDate: "2026-10-01",
    totalQuantity: 1000,
    usedQuantity: 150,
    remainingStock: 850,
    unit: "ml",
    status: "Available",
    minimumStockThreshold: 200,
    purchaseCost: 1200,
    storageLocation: "Fridge A - Shelf 2",
    isArchived: false,
    operator: "Admin",
    createdAt: "2025-10-01T10:00:00.000Z",
    isDeleted: false
  },
  {
    _id: "med_2",
    medicineId: "MED-002",
    name: "Parvovirus Vaccine",
    type: "Vaccine",
    batchNumber: "BN-2026-V1",
    supplier: "Biologics Dist.",
    manufacturer: "Intervet Ltd",
    purchaseDate: "2026-01-15",
    expiryDate: "2026-12-15",
    totalQuantity: 500,
    usedQuantity: 450,
    remainingStock: 50,
    unit: "doses",
    status: "Low Stock",
    minimumStockThreshold: 100,
    purchaseCost: 2500,
    storageLocation: "Cold Storage B",
    isArchived: false,
    operator: "Dr. Alistair",
    createdAt: "2026-01-15T09:00:00.000Z",
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
      const totalQty = Number(data.totalQuantity || 0);
      const remainingQty = totalQty;
      const threshold = Number(data.minimumStockThreshold || 0);
      
      let status = 'Available';
      if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
        status = 'Expired';
      } else if (remainingQty <= 0) {
        status = 'Out Of Stock';
      } else if (remainingQty < threshold) {
        status = 'Low Stock';
      }

      const newRecord = {
        _id: `med_${Date.now()}`,
        medicineId: `MED-${Date.now().toString().slice(-4)}`,
        name: data.name,
        type: data.type,
        batchNumber: data.batchNumber.toUpperCase(),
        supplier: data.supplier || '',
        manufacturer: data.manufacturer || '',
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        totalQuantity: totalQty,
        usedQuantity: 0,
        remainingStock: remainingQty,
        unit: data.unit || 'ml',
        minimumStockThreshold: threshold,
        purchaseCost: Number(data.purchaseCost || 0),
        storageLocation: data.storageLocation || '',
        isArchived: false,
        status,
        operator: data.operator || 'System',
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

  updateMedicine: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMedicines();
      const updatedList = list.map(m => {
        if (m._id === id) {
          const totalQty = Number(data.totalQuantity ?? m.totalQuantity);
          const usedQty = Number(m.usedQuantity || 0);
          const remainingQty = Math.max(0, totalQty - usedQty);
          const threshold = Number(data.minimumStockThreshold ?? m.minimumStockThreshold);
          const expiryDateVal = data.expiryDate ?? m.expiryDate;
          
          let status = 'Available';
          if (expiryDateVal && new Date(expiryDateVal) < new Date()) {
            status = 'Expired';
          } else if (remainingQty <= 0) {
            status = 'Out Of Stock';
          } else if (remainingQty < threshold) {
            status = 'Low Stock';
          }

          return {
            ...m,
            ...data,
            totalQuantity: totalQty,
            remainingStock: remainingQty,
            minimumStockThreshold: threshold,
            purchaseCost: Number(data.purchaseCost ?? m.purchaseCost),
            status,
            updatedAt: new Date().toISOString()
          };
        }
        return m;
      });

      saveLocalMedicines(updatedList);
      set({ medicines: updatedList, loading: false });
      return updatedList.find(m => m._id === id);
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  archiveMedicine: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMedicines();
      const updatedList = list.map(m => {
        if (m._id === id) {
          return { ...m, isArchived: !m.isArchived };
        }
        return m;
      });

      saveLocalMedicines(updatedList);
      set({ medicines: updatedList, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteExpiredMedicine: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalMedicines();
      const updatedList = list.map(m => {
        if (m._id === id) {
          return { ...m, isDeleted: true };
        }
        return m;
      });

      saveLocalMedicines(updatedList);
      set({ medicines: updatedList.filter(m => !m.isDeleted), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deductStock: async (id, quantity) => {
    const list = loadLocalMedicines();
    const target = list.find(m => m._id === id || m.medicineId === id || m.name === id);
    if (!target) {
      throw new Error(`Medicine/vaccine not found in inventory.`);
    }

    // Check expiry
    if (target.expiryDate && new Date(target.expiryDate) < new Date()) {
      throw new Error(`Cannot administer ${target.name} because it has EXPIRED.`);
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid dosage quantity.`);
    }

    if (target.remainingStock < qty) {
      throw new Error(`Insufficient stock for ${target.name}. Requested: ${qty} ${target.unit}, Available: ${target.remainingStock} ${target.unit}`);
    }

    const updatedList = list.map(m => {
      if (m._id === target._id) {
        const usedQuantity = (m.usedQuantity || 0) + qty;
        const remainingStock = Math.max(0, m.totalQuantity - usedQuantity);
        
        let status = 'Available';
        if (m.expiryDate && new Date(m.expiryDate) < new Date()) {
          status = 'Expired';
        } else if (remainingStock <= 0) {
          status = 'Out Of Stock';
        } else if (remainingStock < m.minimumStockThreshold) {
          status = 'Low Stock';
        }

        return {
          ...m,
          usedQuantity,
          remainingStock,
          status
        };
      }
      return m;
    });

    saveLocalMedicines(updatedList);
    set({ medicines: updatedList });
  }
}));
