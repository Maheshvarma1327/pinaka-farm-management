import React from 'react';
import { Database } from 'lucide-react';

/**
 * Reusable Empty State component for unpopulated registers.
 */
export default function EmptyState({ 
  title = "No Records Found", 
  description = "Get started by adding your very first register record entry using the action button.", 
  actionLabel = null, 
  onAction = null,
  icon: Icon = Database
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-surface/50 border border-dashed border-borderDark rounded-xl max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-sidebar flex items-center justify-center border border-borderDark text-textSecondary mb-4">
        <Icon className="w-5 h-5 text-primary/80" />
      </div>
      <h3 className="text-sm font-bold text-textPrimary mb-1.5 uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-textSecondary leading-relaxed max-w-sm mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-semibold rounded shadow-md hover:shadow-glow transition-all duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
