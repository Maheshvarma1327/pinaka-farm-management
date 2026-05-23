import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Settings as SettingsIcon, Building2, Activity, Zap, Hash, Database } from 'lucide-react';

import FarmProfileTab from '../features/settings/components/FarmProfileTab';
import LifecycleTimingTab from '../features/settings/components/LifecycleTimingTab';
import TestModeTab from '../features/settings/components/TestModeTab';
import AutomationTab from '../features/settings/components/AutomationTab';
import IdManagementTab from '../features/settings/components/IdManagementTab';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Farm Profile', icon: Building2 },
    { id: 'lifecycle', label: 'Lifecycle Engine', icon: Activity },
    { id: 'testmode', label: 'Test & Dev Mode', icon: Zap },
    { id: 'automation', label: 'Automations', icon: SettingsIcon },
    { id: 'id', label: 'ID Rules', icon: Hash }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col max-w-[1600px] mx-auto pb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 mb-6">
          <div>
            <h2 className="text-base font-black tracking-wide text-textPrimary uppercase">
              Global Settings Engine
            </h2>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">
              Configure biological timings, test modes, and system automation.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors border ${
                activeTab === tab.id 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-sidebar/50 border-borderDark/60 text-textSecondary hover:text-textPrimary hover:border-borderDark hover:bg-cardBg'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <FarmProfileTab />}
          {activeTab === 'lifecycle' && <LifecycleTimingTab />}
          {activeTab === 'testmode' && <TestModeTab />}
          {activeTab === 'automation' && <AutomationTab />}
          {activeTab === 'id' && <IdManagementTab />}
        </div>

      </div>
    </MainLayout>
  );
}
