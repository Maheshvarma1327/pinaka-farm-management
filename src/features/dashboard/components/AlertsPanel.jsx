import React from 'react';
import { Bell, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';

export default function AlertsPanel({ alerts }) {
  const getIcon = (type) => {
    switch(type) {
      case 'danger': return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'warning': return <Clock className="w-4 h-4 text-warning" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'primary': return <Bell className="w-4 h-4 text-primary" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getBorder = (type) => {
    switch(type) {
      case 'danger': return 'border-danger/30 hover:border-danger/60';
      case 'warning': return 'border-warning/30 hover:border-warning/60';
      case 'success': return 'border-success/30 hover:border-success/60';
      case 'primary': return 'border-primary/30 hover:border-primary/60';
      default: return 'border-info/30 hover:border-info/60';
    }
  };

  return (
    <div className="op-card border border-borderDark rounded-xl h-full flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-borderDark/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Actionable Alerts
        </h3>
        <span className="bg-danger text-black text-[9px] font-black px-2 py-0.5 rounded-full">{alerts.length}</span>
      </div>
      
      <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-textSecondary text-xs">
            <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
            <p>No pending alerts. Farm operations nominal.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className={`bg-sidebar/50 border ${getBorder(alert.type)} rounded-lg p-3 flex gap-3 transition-colors`}>
              <div className="mt-0.5 shrink-0">{getIcon(alert.type)}</div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-start justify-between w-full">
                  <span className="text-[11px] font-bold text-textPrimary uppercase tracking-wide">{alert.title}</span>
                  <span className="text-[9px] font-mono text-textSecondary shrink-0">{new Date(alert.date).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-textSecondary leading-snug">{alert.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
