import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultSettings = {
  farmProfile: {
    farmName: 'PINAKA Smart Farm',
    farmOwner: 'Mahesh Varma',
    farmAddress: 'India',
    contactNumber: '+91-XXXXXXXXXX',
    farmType: 'Commercial Pig Farm',
    totalCapacity: 1000,
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata'
  },
  lifecycle: {
    heatCycle: 21,
    heatWindow: 2, // days
    pregnancyConfirmation: 21,
    gestation: 114,
    lactation: 60,
    weaning: 60,
    growerPromotionAge: 60,
    boarPubertyAge: 180,
    sowBreedingReadyAge: 210,
  },
  testMode: {
    enabled: false,
    mode: 'Real Farm Mode', // 'Real Farm Mode', 'Fast Test Mode', 'Hourly Simulation Mode'
  },
  automations: {
    autoHeatDetection: true,
    autoPregnancyCountdown: true,
    autoFarrowingCountdown: true,
    autoPigletGeneration: true,
    autoWeaning: true,
    autoPromotionEligibility: true,
    autoMortalitySync: true,
    autoVaccinationReminders: true,
    autoTreatmentFollowup: true
  },
  idRules: {
    growerPrefix: 'G-',
    sowPrefix: 'S-',
    boarPrefix: 'B-',
    pigletPrefix: 'PIG-',
    farrowingPrefix: 'FW-',
    mortalityPrefix: 'MORT-'
  },
  reusableTags: {
    enabled: false
  },
  notifications: {
    heatCycle: true,
    breedingDue: true,
    pregnancyConfirmation: true,
    farrowingDue: true,
    weaningDue: true,
    vaccinationDue: true,
    treatmentFollowup: true,
    mortalityAlerts: true
  },
  dashboard: {
    showMortality: true,
    showBreeding: true,
    showLifecycle: true,
    showTreatment: true,
    showGrower: true,
    compactMode: false
  }
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateSettings: (category, values) => {
        set((state) => ({
          [category]: { ...state[category], ...values }
        }));
      },

      // Core Lifecycle Engine Helper
      // Converts configured duration into true Milliseconds based on Test Mode
      getMs: (configuredValue) => {
        const { testMode } = get();
        
        if (!testMode.enabled || testMode.mode === 'Real Farm Mode') {
          // 1 day = 24 * 60 * 60 * 1000 ms
          return configuredValue * 24 * 60 * 60 * 1000;
        } 
        
        if (testMode.mode === 'Fast Test Mode') {
          // 1 day = 1 minute (for rapid testing)
          return configuredValue * 60 * 1000;
        }

        if (testMode.mode === 'Hourly Simulation Mode') {
          // 1 day = 1 hour 
          return configuredValue * 60 * 60 * 1000;
        }

        return configuredValue * 24 * 60 * 60 * 1000;
      },

      // Helper to calculate a future date based on configured duration
      calculateDate: (startDateStr, durationKey) => {
        const { lifecycle, getMs } = get();
        const durationValue = lifecycle[durationKey];
        if (!durationValue) return startDateStr;

        const msToAdd = getMs(durationValue);
        const newDate = new Date(new Date(startDateStr).getTime() + msToAdd);
        return newDate.toISOString();
      },

      resetToDefaults: () => {
        set(defaultSettings);
      }
    }),
    {
      name: 'pinaka-settings-storage',
    }
  )
);
