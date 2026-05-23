import React from 'react';
import { Activity, Plus, TrendingUp, AlertTriangle, Syringe, Skull, DollarSign, Database, GitBranch } from 'lucide-react';

export default function ActivityFeed({ feed }) {
  const getIcon = (type) => {
    switch(type) {
      case 'Breeding': return <GitBranch className="w-3.5 h-3.5 text-primary" />;
      case 'Farrowing': return <Activity className="w-3.5 h-3.5 text-info" />;
      case 'Mortality': return <Skull className="w-3.5 h-3.5 text-textSecondary" />;
      case 'Treatment': return <Syringe className="w-3.5 h-3.5 text-danger" />;
      case 'Sale': return <DollarSign className="w-3.5 h-3.5 text-success" />;
      default: return <Database className="w-3.5 h-3.5 text-textSecondary" />;
    }
  };

  const getBorder = (type) => {
    switch(type) {
      case 'Breeding': return 'border-primary/50';
      case 'Farrowing': return 'border-info/50';
      case 'Mortality': return 'border-textSecondary/50';
      case 'Treatment': return 'border-danger/50';
      case 'Sale': return 'border-success/50';
      default: return 'border-borderDark';
    }
  };

  return (
    <div className="op-card border border-borderDark rounded-xl h-full flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-borderDark/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-info" /> Recent Activity Feed
        </h3>
      </div>
      
      <div className="p-4 overflow-y-auto flex flex-col gap-0 flex-1 relative">
        {feed.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-textSecondary text-xs">
            <p>No recent farm activity found.</p>
          </div>
        ) : (
          <div className="absolute left-6 top-4 bottom-4 w-px bg-borderDark/60 z-0"></div>
        )}
        
        {feed.map((item, i) => (
          <div key={item.id} className="flex gap-4 mb-4 relative z-10 group">
            <div className={`w-5 h-5 mt-1 rounded-full bg-cardBg border-2 ${getBorder(item.type)} flex items-center justify-center shrink-0`}>
              {getIcon(item.type)}
            </div>
            <div className="bg-sidebar/50 border border-borderDark/40 group-hover:border-primary/30 rounded p-2.5 flex-1 transition-colors">
              <div className="flex items-start justify-between w-full">
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">{item.type}</span>
                <span className="text-[9px] font-mono text-textMuted">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <p className="text-[11px] font-medium text-textPrimary mt-0.5">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
