import { create } from 'zustand';
import { useSowStore } from './useSowStore';
import { useBreedingStore } from './useBreedingStore';
import { useGrowerStore } from './useGrowerStore';

const MOCK_FARROWINGS = [
  {
    _id: "far_1",
    sowId: "sow_1",
    sowNo: "S-101",
    boarId: "boar_1",
    boarNo: "B-201",
    breedingId: "br_1",
    serviceDate: "2025-12-01T00:00:00.000Z",
    expectedFarrowingDate: "2026-03-25T00:00:00.000Z",
    actualFarrowingDate: "2026-03-24T00:00:00.000Z",
    pigletsBornAlive: 12,
    stillbornPiglets: 1,
    mummifiedPiglets: 0,
    weakPiglets: 2,
    totalLitterSize: 13,
    birthComplications: "None",
    expectedWeaningDate: "2026-05-23T00:00:00.000Z",
    actualWeaningDate: null,
    pigletsWeaned: 0,
    lactationStatus: "Lactating",
    pigletsTransferredToGrower: false,
    piglets: [
      { pigletId: 'L-S-101-1234-1', sex: 'Male', birthWeight: 1.5, currentWeight: 1.8, status: 'Nursing', notes: '' },
      { pigletId: 'L-S-101-1234-2', sex: 'Female', birthWeight: 1.4, currentWeight: 1.6, status: 'Nursing', notes: '' }
    ],
    healthLog: [],
    operator: "Dr. Alistair",
    notes: "Healthy litter, fast delivery.",
    createdAt: "2026-03-24T10:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalFarrowings = () => {
  const stored = localStorage.getItem('pinaka_farrowings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(f => !f.isDeleted);
    } catch (e) {
      console.error("Local storage decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_farrowings', JSON.stringify(MOCK_FARROWINGS));
  return MOCK_FARROWINGS;
};

const saveLocalFarrowings = (list) => {
  localStorage.setItem('pinaka_farrowings', JSON.stringify(list));
};

export const useFarrowingStore = create((set, get) => ({
  farrowings: [],
  selectedFarrowing: null,
  loading: false,
  error: null,

  fetchFarrowings: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      set({ farrowings: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchFarrowingById: async (id) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const match = list.find(f => f._id === id);
      if (!match) throw new Error("Farrowing record not found.");
      set({ selectedFarrowing: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createFarrowingRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      
      const aDate = new Date(data.actualFarrowingDate || Date.now());
      const eWean = new Date(aDate.getTime() + (60 * 24 * 60 * 60 * 1000));
      const alive = Number(data.pigletsBornAlive || 0);
      const still = Number(data.stillbornPiglets || 0);
      const mum = Number(data.mummifiedPiglets || 0);

      const pigletsArray = [];
      const baseLitterId = `L-${data.sowNo}-${Date.now().toString().slice(-4)}`;
      for(let i=0; i<alive; i++) {
        pigletsArray.push({
          pigletId: `${baseLitterId}-${i+1}`,
          sex: i % 2 === 0 ? 'Female' : 'Male',
          birthWeight: 1.5,
          currentWeight: 1.5,
          status: 'Nursing',
          notes: ''
        });
      }

      const newRecord = {
        _id: `far_${Date.now()}`,
        ...data,
        actualFarrowingDate: aDate.toISOString(),
        expectedWeaningDate: eWean.toISOString(),
        pigletsBornAlive: alive,
        stillbornPiglets: still,
        mummifiedPiglets: mum,
        weakPiglets: Number(data.weakPiglets || 0),
        totalLitterSize: alive + still + mum,
        lactationStatus: 'Lactating',
        pigletsTransferredToGrower: false,
        piglets: pigletsArray,
        healthLog: [],
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalFarrowings(updatedList);
      set({ farrowings: updatedList, loading: false });

      // Sync with Sow Store
      const sowStore = useSowStore.getState();
      if (sowStore && sowStore.addFarrowingLog) {
        await sowStore.addFarrowingLog(data.sowId, {
          farrowingDate: newRecord.actualFarrowingDate,
          bornAlive: newRecord.pigletsBornAlive,
          bornDead: newRecord.stillbornPiglets,
          weakPiglets: newRecord.weakPiglets,
          stillborn: newRecord.stillbornPiglets,
          mummified: newRecord.mummifiedPiglets,
          litterWeight: 0,
          enteredBy: data.operator
        });
      }

      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  confirmWeaning: async (id, operator, pigletsWeaned, notes) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      let farrowSowId = null;

      const updatedList = list.map(f => {
        if (f._id === id) {
          farrowSowId = f.sowId;
          return {
            ...f,
            actualWeaningDate: new Date().toISOString(),
            pigletsWeaned: Number(pigletsWeaned),
            lactationStatus: 'Weaned',
            notes: f.notes ? `${f.notes}\nWeaning: ${notes}` : `Weaning: ${notes}`
          };
        }
        return f;
      });

      saveLocalFarrowings(updatedList);
      const match = updatedList.find(f => f._id === id);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });

      // Sync with Sow Store (update status to Weaned)
      if (farrowSowId) {
        const sowStore = useSowStore.getState();
        if (sowStore && sowStore.updateSowStatusDirect) {
          await sowStore.updateSowStatusDirect(
            farrowSowId, 
            'Waiting For Heat', 
            `Litter weaned. Count: ${pigletsWeaned}`, 
            operator
          );
        }
      }

      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  transferPigletsToGrower: async (id, operator, transferCount, avgWeight, notes) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      let match = list.find(f => f._id === id);
      if (!match) throw new Error("Farrowing record not found.");
      if (match.lactationStatus !== 'Weaned') throw new Error("Must confirm weaning before transfer.");
      if (match.pigletsTransferredToGrower) throw new Error("Piglets already transferred.");

      // Use Grower Store to create batch growers
      const growerStore = useGrowerStore.getState();
      if (growerStore && typeof growerStore.createGrower === 'function') {
        const baseTag = `G-${match.sowNo}-${Date.now().toString().slice(-4)}`;
        
        for (let i = 0; i < Number(transferCount); i++) {
          await growerStore.createGrower({
            animalNo: `${baseTag}-${i+1}`,
            dob: match.actualFarrowingDate.split('T')[0],
            breed: 'Crossbred',
            penNo: 'Grower Arrival Unit',
            sex: i % 2 === 0 ? 'Female' : 'Male',
            sireNo: match.boarNo,
            damNo: match.sowNo,
            birthWeight: avgWeight,
            notes: `Transferred from Sow ${match.sowNo} litter. ${notes}`,
            enteredBy: operator
          });
        }
      }

      const updatedList = list.map(f => {
        if (f._id === id) {
          return {
            ...f,
            lactationStatus: 'Closed',
            pigletsTransferredToGrower: true,
            notes: f.notes ? `${f.notes}\nTransfer: ${notes}` : `Transfer: ${notes}`
          };
        }
        return f;
      });

      saveLocalFarrowings(updatedList);
      match = updatedList.find(f => f._id === id);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });

      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updatePigletWeight: async (farrowingId, pigletId, currentWeight) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const updatedList = list.map(f => {
        if (f._id === farrowingId) {
          const updatedPiglets = f.piglets.map(p => {
            if (p.pigletId === pigletId) {
              return { ...p, currentWeight: Number(currentWeight) };
            }
            return p;
          });
          return { ...f, piglets: updatedPiglets };
        }
        return f;
      });

      saveLocalFarrowings(updatedList);
      const match = updatedList.find(f => f._id === farrowingId);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addLitterHealthLog: async (farrowingId, healthData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const updatedList = list.map(f => {
        if (f._id === farrowingId) {
          const newLog = {
            type: healthData.type || 'Vaccine',
            name: healthData.name,
            dateAdministered: healthData.dateAdministered || new Date().toISOString(),
            dose: healthData.dose || '',
            operator: healthData.operator || 'System',
            notes: healthData.notes || ''
          };
          return { ...f, healthLog: [...(f.healthLog || []), newLog] };
        }
        return f;
      });

      saveLocalFarrowings(updatedList);
      const match = updatedList.find(f => f._id === farrowingId);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }

}));
