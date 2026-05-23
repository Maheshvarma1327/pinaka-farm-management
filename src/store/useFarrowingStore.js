import { create } from 'zustand';
import { useSowStore } from './useSowStore';
import { useGrowerStore } from './useGrowerStore';
import { useAnimalStore } from './useAnimalStore';
import { useSettingsStore } from './useSettingsStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Scans all farrowings in localStorage and the master animal registry to
 * find the highest existing PIG-XXXX sequential number, then returns the
 * next number padded to 4 digits.
 */
const getNextPigletId = () => {
  let maxNum = 0;

  // Scan all existing farrowings for pigletIds
  try {
    const farrowings = JSON.parse(localStorage.getItem('pinaka_farrowings') || '[]');
    farrowings.forEach(f => {
      (f.piglets || []).forEach(p => {
        const match = (p.pigletId || '').match(/^PIG-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    });
  } catch (e) { /* ignore */ }

  // Also scan master animal registry for piglets
  try {
    const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
    animals.forEach(a => {
      const match = (a.animalNo || '').match(/^PIG-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
  } catch (e) { /* ignore */ }

  return maxNum + 1;
};

const formatPigletId = (num) => `PIG-${String(num).padStart(4, '0')}`;

// ─── Mock seed data ──────────────────────────────────────────────────────────

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
    pigletsBornAlive: 6,
    stillbornPiglets: 1,
    mummifiedPiglets: 0,
    weakPiglets: 1,
    totalLitterSize: 7,
    birthComplications: "None",
    expectedWeaningDate: "2026-05-23T00:00:00.000Z",
    actualWeaningDate: null,
    pigletsWeaned: 0,
    lactationStatus: "Lactating",
    pigletsTransferredToGrower: false,
    piglets: [
      {
        pigletId: 'PIG-0001', sex: 'Female', birthWeight: 1.5, currentWeight: 8.2,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      },
      {
        pigletId: 'PIG-0002', sex: 'Male', birthWeight: 1.4, currentWeight: 7.9,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      },
      {
        pigletId: 'PIG-0003', sex: 'Female', birthWeight: 1.6, currentWeight: 8.5,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      },
      {
        pigletId: 'PIG-0004', sex: 'Male', birthWeight: 1.3, currentWeight: 7.5,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      },
      {
        pigletId: 'PIG-0005', sex: 'Female', birthWeight: 1.5, currentWeight: 8.0,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      },
      {
        pigletId: 'PIG-0006', sex: 'Male', birthWeight: 1.4, currentWeight: 7.8,
        status: 'Nursing', healthStatus: 'Healthy', vaccineHistory: [],
        promotedToGrower: false, permanentGrowerId: null,
        dob: "2026-03-24T00:00:00.000Z", breed: 'Large White', notes: ''
      }
    ],
    healthLog: [],
    operator: "Dr. Alistair",
    notes: "Healthy litter, fast delivery.",
    createdAt: "2026-03-24T10:00:00.000Z",
    isDeleted: false
  }
];

// ─── LocalStorage persistence ────────────────────────────────────────────────

const loadLocalFarrowings = () => {
  const stored = localStorage.getItem('pinaka_farrowings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter(f => !f.isDeleted);
    } catch (e) {
      console.error("Farrowing decode failure:", e);
    }
  }
  localStorage.setItem('pinaka_farrowings', JSON.stringify(MOCK_FARROWINGS));
  return MOCK_FARROWINGS;
};

const saveLocalFarrowings = (list) => {
  localStorage.setItem('pinaka_farrowings', JSON.stringify(list));
};

// ─── Self-Healing Logic for Litters without Piglet Records ────────────────────
const healFarrowingsList = (list) => {
  let modified = false;
  const healed = list.map(f => {
    const bornAlive = Number(f.pigletsBornAlive || 0);
    const currentPiglets = f.piglets || [];
    if (bornAlive > 0 && currentPiglets.length === 0) {
      // Find highest PIG-XXXX tag in farrowings list
      let maxNum = 0;
      list.forEach(item => {
        (item.piglets || []).forEach(p => {
          const match = (p.pigletId || '').match(/^PIG-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      });

      // Also scan master animal registry for piglets
      try {
        const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
        animals.forEach(a => {
          const match = (a.animalNo || '').match(/^PIG-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      } catch (e) {}

      let nextNum = maxNum + 1;
      let sowBreed = 'Crossbred';
      try {
        const sows = JSON.parse(localStorage.getItem('pinaka_sows') || '[]');
        const sow = sows.find(s => s._id === f.sowId || s.animalNo === f.sowNo);
        if (sow && sow.breed) sowBreed = sow.breed;
      } catch (e) {}

      const generated = [];
      const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
      let animalsModified = false;

      for (let i = 0; i < bornAlive; i++) {
        const pigletId = `PIG-${String(nextNum + i).padStart(4, '0')}`;
        const sex = i % 2 === 0 ? 'Female' : 'Male';
        const aDate = f.actualFarrowingDate || new Date().toISOString();
        
        generated.push({
          pigletId,
          sex,
          birthWeight: 1.5,
          currentWeight: 1.5,
          status: 'Nursing',
          healthStatus: 'Healthy',
          vaccineHistory: [],
          promotedToGrower: false,
          permanentGrowerId: null,
          dob: aDate,
          breed: sowBreed,
          notes: 'Auto-healed record'
        });

        // Register in master animal registry if not already present
        if (!animals.find(a => a.animalNo === pigletId)) {
          animals.unshift({
            _id: `ani_pig_${Date.now()}_healed_${i}`,
            animalNo: pigletId,
            earTag: '',
            dob: aDate,
            sex,
            breed: sowBreed,
            currentWeight: 1.5,
            source: 'Farm Born',
            supplier: '',
            lifecycleStage: 'Piglet',
            currentPen: 'Farrowing Unit',
            operationalStatus: 'Active',
            operator: f.operator || 'System',
            notes: `Born to Sow ${f.sowNo} × Boar ${f.boarNo} (Healed)`,
            createdAt: new Date().toISOString(),
            isDeleted: false
          });
          animalsModified = true;
        }
      }

      if (animalsModified) {
        localStorage.setItem('pinaka_animals', JSON.stringify(animals));
      }

      modified = true;
      return {
        ...f,
        piglets: generated
      };
    }
    return f;
  });

  if (modified) {
    localStorage.setItem('pinaka_farrowings', JSON.stringify(healed));
    try {
      useAnimalStore.getState().fetchAnimals();
    } catch (e) {}
  }

  return healed;
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFarrowingStore = create((set, get) => ({
  farrowings: [],
  selectedFarrowing: null,
  loading: false,
  error: null,

  fetchFarrowings: async () => {
    set({ loading: true, error: null });
    try {
      const rawList = loadLocalFarrowings();
      const list = healFarrowingsList(rawList);
      set({ farrowings: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchFarrowingById: async (id) => {
    set({ loading: true, error: null });
    try {
      const rawList = loadLocalFarrowings();
      const list = healFarrowingsList(rawList);
      const match = list.find(f => f._id === id);
      if (!match) throw new Error("Farrowing record not found.");
      set({ selectedFarrowing: match, loading: false });
      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Create Farrowing Record ─────────────────────────────────────────────
  // Auto-generates PIG-XXXX piglets and registers them in the master registry.
  createFarrowingRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();

      const aDate = new Date(data.actualFarrowingDate || Date.now());
      const eWeanStr = useSettingsStore.getState().calculateDate(aDate.toISOString(), 'weaning');
      const eWean = new Date(eWeanStr);
      const alive = Number(data.pigletsBornAlive || 0);
      const still = Number(data.stillbornPiglets || 0);
      const mum = Number(data.mummifiedPiglets || 0);

      // Determine breed from sow registry
      let sowBreed = 'Crossbred';
      try {
        const sows = JSON.parse(localStorage.getItem('pinaka_sows') || '[]');
        const sow = sows.find(s => s._id === data.sowId || s.animalNo === data.sowNo);
        if (sow && sow.breed) sowBreed = sow.breed;
      } catch (e) { /* ignore */ }

      // Sequential piglet IDs starting from the next available number
      const pigletsArray = [];
      let nextNum = getNextPigletId();
      const animalStore = useAnimalStore.getState();

      for (let i = 0; i < alive; i++) {
        const pigletId = formatPigletId(nextNum + i);
        const sex = i % 2 === 0 ? 'Female' : 'Male';
        const piglet = {
          pigletId,
          sex,
          birthWeight: 1.5,
          currentWeight: 1.5,
          status: 'Nursing',
          healthStatus: 'Healthy',
          vaccineHistory: [],
          promotedToGrower: false,
          permanentGrowerId: null,
          dob: aDate.toISOString(),
          breed: sowBreed,
          notes: ''
        };
        pigletsArray.push(piglet);

        // Register piglet in master animal registry (non-blocking; skip if duplicate)
        try {
          const existing = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
          if (!existing.find(a => a.animalNo === pigletId)) {
            const newAnimal = {
              _id: `ani_pig_${Date.now()}_${i}`,
              animalNo: pigletId,
              earTag: '',
              dob: aDate.toISOString(),
              sex,
              breed: sowBreed,
              currentWeight: 1.5,
              source: 'Farm Born',
              supplier: '',
              lifecycleStage: 'Piglet',
              currentPen: 'Farrowing Unit',
              operationalStatus: 'Active',
              operator: data.operator || 'System',
              notes: `Born to Sow ${data.sowNo} × Boar ${data.boarNo}`,
              createdAt: new Date().toISOString(),
              isDeleted: false
            };
            const updatedAnimals = [newAnimal, ...existing];
            localStorage.setItem('pinaka_animals', JSON.stringify(updatedAnimals));
          }
        } catch (e) { /* ignore */ }
      }

      // Refresh animal store state
      if (animalStore && animalStore.fetchAnimals) {
        animalStore.fetchAnimals();
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

  // ── Mark Piglet Dead ────────────────────────────────────────────────────
  markPigletDead: async (farrowingId, pigletId, causeOfDeath = 'Unknown') => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const updatedList = list.map(f => {
        if (f._id !== farrowingId) return f;
        const updatedPiglets = (f.piglets || []).map(p => {
          if (p.pigletId !== pigletId) return p;
          return { ...p, status: 'Dead', healthStatus: 'Dead', causeOfDeath };
        });
        // Auto-close litter if all live piglets are now dead or promoted
        const allResolved = updatedPiglets.every(
          p => p.status === 'Dead' || p.promotedToGrower === true
        );
        return {
          ...f,
          piglets: updatedPiglets,
          lactationStatus: allResolved ? 'Closed' : f.lactationStatus
        };
      });

      saveLocalFarrowings(updatedList);
      const match = updatedList.find(f => f._id === farrowingId);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });

      // Sync: Mark piglet as Dead in master animal registry
      try {
        const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
        const updated = animals.map(a =>
          a.animalNo === pigletId
            ? { ...a, lifecycleStage: 'Dead', operationalStatus: 'Culled' }
            : a
        );
        localStorage.setItem('pinaka_animals', JSON.stringify(updated));
        useAnimalStore.getState().fetchAnimals();
      } catch (e) { /* ignore */ }

      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Promote Piglet to Grower ────────────────────────────────────────────
  // Validates the grower ID is not already active, creates grower record,
  // updates master registry, and auto-closes the litter when all piglets resolved.
  promotePiglet: async (farrowingId, pigletId, growerId, promotionDate, notes = '', operator = 'System') => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const farrowing = list.find(f => f._id === farrowingId);
      if (!farrowing) throw new Error("Farrowing record not found.");
      const piglet = (farrowing.piglets || []).find(p => p.pigletId === pigletId);
      if (!piglet) throw new Error("Piglet not found in this litter.");
      if (piglet.promotedToGrower) throw new Error("This piglet has already been promoted.");
      if (piglet.status === 'Dead') throw new Error("Cannot promote a deceased piglet.");

      // ── Validate weaning status ──
      const ageDays = Math.floor((Date.now() - new Date(piglet.dob || farrowing.actualFarrowingDate).getTime()) / (1000 * 60 * 60 * 24));
      const isWeaned = farrowing.lactationStatus === 'Weaned' || ageDays >= 60;
      if (!isWeaned) {
        throw new Error("Cannot promote piglet before weaning. Litter must be weaned or piglet must be at least 60 days old.");
      }

      // ── Validate Grower ID format ──
      const cleanGrowerId = (growerId || '').trim().toUpperCase();
      if (!cleanGrowerId) {
        throw new Error("Grower ID cannot be empty.");
      }
      const validIdRegex = /^[A-Z0-9\-_]+$/;
      if (!validIdRegex.test(cleanGrowerId)) {
        throw new Error("Grower ID contains invalid characters. Only alphanumeric, hyphens (-), and underscores (_) are allowed.");
      }

      // ── Validate Grower ID uniqueness ──
      // Check master animal registry for any active (non-dead, non-sold) animal with this ID
      const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
      const conflict = animals.find(
        a =>
          a.animalNo === cleanGrowerId &&
          !a.isDeleted &&
          !['Dead', 'Sold', 'Culled', 'Archived'].includes(a.lifecycleStage)
      );
      if (conflict) {
        throw new Error(
          `Animal ID '${cleanGrowerId}' is currently active (${conflict.lifecycleStage}). Choose a different or reusable ID.`
        );
      }

      // ── Create Grower Record ──
      const growerStore = useGrowerStore.getState();
      if (growerStore && typeof growerStore.createGrower === 'function') {
        await growerStore.createGrower({
          animalNo: cleanGrowerId,
          animalId: cleanGrowerId,
          dob: piglet.dob ? piglet.dob.split('T')[0] : new Date().toISOString().split('T')[0],
          breed: piglet.breed || 'Crossbred',
          sex: piglet.sex,
          penNo: 'Grower Arrival Unit',
          sireNo: farrowing.boarNo,
          damNo: farrowing.sowNo,
          birthWeight: piglet.birthWeight || 1.5,
          weaningWeight: piglet.currentWeight || piglet.birthWeight || 1.5,
          currentWeight: piglet.currentWeight || piglet.birthWeight || 1.5,
          notes: `Promoted from Parity Litter. Origin Piglet: ${pigletId}. ${notes}`,
          enteredBy: operator,
          // Lifecycle source metadata
          originPigletId: pigletId,
          originalPigletId: pigletId,
          temporaryPigletId: pigletId,
          permanentGrowerId: cleanGrowerId,
          sowId: farrowing.sowId || null,
          boarId: farrowing.boarId || null,
          farrowingId: farrowing._id || null,
          lifecycleStage: 'Grower',
          lifecycleSource: 'Farrowing Promotion',
          promotionDate: promotionDate || new Date().toISOString().split('T')[0]
        });
      }

      // ── Update farrowing piglet status ──
      const updatedList = list.map(f => {
        if (f._id !== farrowingId) return f;
        const updatedPiglets = (f.piglets || []).map(p => {
          if (p.pigletId !== pigletId) return p;
          return {
            ...p,
            promotedToGrower: true,
            permanentGrowerId: cleanGrowerId,
            temporaryPigletId: pigletId,
            status: 'Promoted',
            promotionDate: promotionDate || new Date().toISOString().split('T')[0]
          };
        });
        // Auto-close litter if all live piglets are dead or promoted
        const allResolved = updatedPiglets.every(
          p => p.status === 'Dead' || p.promotedToGrower === true || p.status === 'Promoted'
        );
        return {
          ...f,
          piglets: updatedPiglets,
          lactationStatus: allResolved ? 'Closed' : f.lactationStatus,
          pigletsTransferredToGrower: allResolved ? true : f.pigletsTransferredToGrower
        };
      });

      saveLocalFarrowings(updatedList);
      const match = updatedList.find(f => f._id === farrowingId);
      set({ farrowings: updatedList, selectedFarrowing: match, loading: false });

      // ── Sync master animal registry ──
      try {
        const updated = animals.map(a => {
          if (a.animalNo === pigletId) {
            return {
              ...a,
              lifecycleStage: 'Grower',
              animalNo: cleanGrowerId,
              operationalStatus: 'Active',
              currentPen: 'Grower Arrival Unit',
              originalPigletId: pigletId,
              temporaryPigletId: pigletId,
              permanentGrowerId: cleanGrowerId
            };
          }
          return a;
        });
        // If piglet wasn't in the registry, add the grower entry
        if (!updated.find(a => a.animalNo === cleanGrowerId)) {
          updated.unshift({
            _id: `ani_${Date.now()}`,
            animalNo: cleanGrowerId,
            earTag: '',
            dob: piglet.dob || new Date().toISOString(),
            sex: piglet.sex,
            breed: piglet.breed || 'Crossbred',
            currentWeight: piglet.currentWeight || 1.5,
            source: 'Farm Born',
            supplier: '',
            lifecycleStage: 'Grower',
            currentPen: 'Grower Arrival Unit',
            operationalStatus: 'Active',
            operator,
            notes: `Promoted from Piglet ${pigletId}`,
            createdAt: new Date().toISOString(),
            isDeleted: false,
            originalPigletId: pigletId,
            temporaryPigletId: pigletId,
            permanentGrowerId: cleanGrowerId
          });
        }
        localStorage.setItem('pinaka_animals', JSON.stringify(updated));
        useAnimalStore.getState().fetchAnimals();
      } catch (e) { /* ignore */ }

      return match;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Get Reusable Grower IDs ─────────────────────────────────────────────
  // Returns IDs of animals that are Dead / Sold / Culled and can be reused.
  getSuggestedReusableIds: () => {
    try {
      const animals = JSON.parse(localStorage.getItem('pinaka_animals') || '[]');
      return animals
        .filter(a =>
          ['Dead', 'Sold', 'Culled', 'Archived'].includes(a.lifecycleStage) &&
          /^G-/.test(a.animalNo)
        )
        .map(a => a.animalNo)
        .slice(0, 5);
    } catch (e) {
      return [];
    }
  },

  // ── Confirm Weaning ─────────────────────────────────────────────────────
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

      // Sync with Sow Store (update status to Weaned / Waiting for Heat)
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

  // ── Transfer Piglets to Grower (legacy batch mode) ──────────────────────
  transferPigletsToGrower: async (id, operator, transferCount, avgWeight, notes) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      let match = list.find(f => f._id === id);
      if (!match) throw new Error("Farrowing record not found.");
      if (match.lactationStatus !== 'Weaned') throw new Error("Must confirm weaning before transfer.");
      if (match.pigletsTransferredToGrower) throw new Error("Piglets already transferred.");

      const growerStore = useGrowerStore.getState();
      if (growerStore && typeof growerStore.createGrower === 'function') {
        const baseTag = `G-${match.sowNo}-${Date.now().toString().slice(-4)}`;
        for (let i = 0; i < Number(transferCount); i++) {
          await growerStore.createGrower({
            animalNo: `${baseTag}-${i + 1}`,
            dob: match.actualFarrowingDate.split('T')[0],
            breed: 'Crossbred',
            penNo: 'Grower Arrival Unit',
            sex: i % 2 === 0 ? 'Female' : 'Male',
            sireNo: match.boarNo,
            damNo: match.sowNo,
            birthWeight: avgWeight,
            notes: `Batch transferred from Sow ${match.sowNo} litter. ${notes}`,
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

  // ── Update Individual Piglet Weight ────────────────────────────────────
  updatePigletWeight: async (farrowingId, pigletId, currentWeight) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const updatedList = list.map(f => {
        if (f._id === farrowingId) {
          const updatedPiglets = (f.piglets || []).map(p => {
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

  // ── Add Piglet Vaccine / Health Log to Piglet's personal history ─────────
  addPigletVaccineLog: async (farrowingId, pigletId, healthData) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalFarrowings();
      const updatedList = list.map(f => {
        if (f._id !== farrowingId) return f;
        const updatedPiglets = (f.piglets || []).map(p => {
          if (p.pigletId !== pigletId) return p;
          const newEntry = {
            type: healthData.type || 'Vaccine',
            name: healthData.name,
            dateAdministered: healthData.dateAdministered || new Date().toISOString(),
            dose: healthData.dose || '',
            operator: healthData.operator || 'System',
            notes: healthData.notes || ''
          };
          return { ...p, vaccineHistory: [...(p.vaccineHistory || []), newEntry] };
        });
        return { ...f, piglets: updatedPiglets };
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

  // ── Add Litter-Wide Health Log ──────────────────────────────────────────
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
