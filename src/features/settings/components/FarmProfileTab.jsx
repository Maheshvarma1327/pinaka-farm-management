import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { Building2 } from 'lucide-react';

export default function FarmProfileTab() {
  const { farmProfile, updateSettings } = useSettingsStore();

  const handleChange = (e) => {
    updateSettings('farmProfile', { [e.target.name]: e.target.value });
  };

  const fields = [
    { name: 'farmName', label: 'Farm Name', type: 'text' },
    { name: 'farmOwner', label: 'Farm Owner', type: 'text' },
    { name: 'farmAddress', label: 'Location / Address', type: 'text' },
    { name: 'contactNumber', label: 'Contact Number', type: 'text' },
    { name: 'farmType', label: 'Farm Type', type: 'text' },
    { name: 'totalCapacity', label: 'Total Capacity', type: 'number' },
    { name: 'defaultCurrency', label: 'Default Currency', type: 'text' },
    { name: 'timezone', label: 'Timezone', type: 'text' },
  ];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="op-card p-6 border border-borderDark rounded-xl">
        <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-primary" /> Farm Profile Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">
                {f.label}
              </label>
              <input 
                type={f.type}
                name={f.name}
                value={farmProfile[f.name]}
                onChange={handleChange}
                className="bg-cardBg border border-borderDark rounded px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
