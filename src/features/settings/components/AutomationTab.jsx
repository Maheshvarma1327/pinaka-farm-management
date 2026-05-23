import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { Zap } from 'lucide-react';

export default function AutomationTab() {
  const { automations, updateSettings } = useSettingsStore();

  const handleToggle = (key) => {
    updateSettings('automations', { [key]: !automations[key] });
  };

  const fields = [
    { key: 'autoHeatDetection', label: 'Auto Heat Detection', desc: 'Automatically flag sows overdue for heat.' },
    { key: 'autoPregnancyCountdown', label: 'Auto Pregnancy Countdown', desc: 'Enable dashboard alerts for 21-day checks.' },
    { key: 'autoFarrowingCountdown', label: 'Auto Farrowing Countdown', desc: 'Enable dashboard alerts for 114-day expected farrowing.' },
    { key: 'autoPigletGeneration', label: 'Auto Piglet Generation', desc: 'Generate system records for born piglets automatically upon farrowing.' },
    { key: 'autoWeaning', label: 'Auto Weaning Reminders', desc: 'Alert when a litter reaches weaning age.' },
    { key: 'autoPromotionEligibility', label: 'Auto Promotion Eligibility', desc: 'Flag animals ready for grower/sow/boar promotion based on age.' },
    { key: 'autoMortalitySync', label: 'Auto Mortality Sync', desc: 'Automatically update animal status to Dead across all modules.' },
    { key: 'autoTreatmentFollowup', label: 'Auto Treatment Follow-up', desc: 'Trigger alerts for required secondary doses or checks.' },
  ];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="op-card p-6 border border-borderDark rounded-xl">
        <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-warning" /> System Automation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-sidebar/50 border border-borderDark/60 rounded-lg hover:border-primary/30 transition-colors">
              <div className="pr-4">
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{f.label}</h4>
                <p className="text-[10px] text-textMuted mt-1 leading-tight">{f.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={automations[f.key]}
                  onChange={() => handleToggle(f.key)}
                />
                <div className="w-9 h-5 bg-borderDark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
