import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { AlertTriangle, Clock, Settings, Zap } from 'lucide-react';

export default function TestModeTab() {
  const { testMode, updateSettings } = useSettingsStore();

  const handleToggle = () => {
    updateSettings('testMode', { enabled: !testMode.enabled });
  };

  const handleModeChange = (e) => {
    updateSettings('testMode', { mode: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="op-card p-6 border-l-4 border-l-danger bg-danger/5 border-y border-r border-borderDark rounded-r-xl">
        <h3 className="text-sm font-black text-danger uppercase tracking-widest flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Development / Test Mode
        </h3>
        <p className="text-xs text-textSecondary mb-6 max-w-2xl">
          Warning: Enabling test mode overrides the biological clock of the farm. 
          It allows rapid simulation of heat cycles, pregnancies, and weaning. Do not enable on a live production farm.
        </p>

        <div className="flex items-center justify-between p-4 bg-cardBg border border-borderDark rounded-lg mb-6">
          <div>
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Enable Test Engine</h4>
            <p className="text-[10px] text-textMuted mt-1">Activate dynamic scaling of lifecycle durations.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={testMode.enabled}
              onChange={handleToggle}
            />
            <div className="w-11 h-6 bg-borderDark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger"></div>
          </label>
        </div>

        {testMode.enabled && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <label className={`op-card p-4 border rounded-xl cursor-pointer transition-all ${testMode.mode === 'Real Farm Mode' ? 'border-primary bg-primary/5' : 'border-borderDark hover:border-textSecondary/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Clock className={`w-5 h-5 ${testMode.mode === 'Real Farm Mode' ? 'text-primary' : 'text-textMuted'}`} />
                  <input type="radio" name="testMode" value="Real Farm Mode" checked={testMode.mode === 'Real Farm Mode'} onChange={handleModeChange} className="accent-primary" />
                </div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">Real Farm Mode</h4>
                <p className="text-[10px] text-textMuted leading-tight">1 Cycle Day = 1 Real Day. Accurate biological timing.</p>
              </label>

              <label className={`op-card p-4 border rounded-xl cursor-pointer transition-all ${testMode.mode === 'Hourly Simulation Mode' ? 'border-info bg-info/5' : 'border-borderDark hover:border-textSecondary/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Settings className={`w-5 h-5 ${testMode.mode === 'Hourly Simulation Mode' ? 'text-info' : 'text-textMuted'}`} />
                  <input type="radio" name="testMode" value="Hourly Simulation Mode" checked={testMode.mode === 'Hourly Simulation Mode'} onChange={handleModeChange} className="accent-info" />
                </div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">Hourly Mode</h4>
                <p className="text-[10px] text-textMuted leading-tight">1 Cycle Day = 1 Hour. Used for daily shift testing.</p>
              </label>

              <label className={`op-card p-4 border rounded-xl cursor-pointer transition-all ${testMode.mode === 'Fast Test Mode' ? 'border-danger bg-danger/5' : 'border-borderDark hover:border-textSecondary/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Zap className={`w-5 h-5 ${testMode.mode === 'Fast Test Mode' ? 'text-danger' : 'text-textMuted'}`} />
                  <input type="radio" name="testMode" value="Fast Test Mode" checked={testMode.mode === 'Fast Test Mode'} onChange={handleModeChange} className="accent-danger" />
                </div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">Fast Test Mode</h4>
                <p className="text-[10px] text-textMuted leading-tight">1 Cycle Day = 1 Minute. Instant testing feedback.</p>
              </label>

            </div>

            {testMode.mode === 'Fast Test Mode' && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded text-[11px] text-danger font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" />
                Active: A 114-day gestation will complete in 114 minutes. A 21-day heat cycle completes in 21 minutes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
