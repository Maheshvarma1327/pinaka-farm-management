import React from 'react';

/**
 * Reusable wrapper to display input fields with labels and validation error messages.
 */
export function FormField({ 
  label, 
  error, 
  required = false, 
  id, 
  children,
  className = "" 
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-[11px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1"
        >
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="text-[10px] text-danger font-medium tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Standard Form Grid container
 */
export function FormGrid({ cols = 2, children, className = "" }) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[cols];

  return (
    <div className={`grid gap-4 w-full ${colClasses} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Clean visual section divider for complex operational forms
 */
export function FormSection({ title, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-4 border-b border-borderDark/40 pb-6 last:border-0 last:pb-0 ${className}`}>
      {title && (
        <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-widest border-l-2 border-primary pl-2">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

export default { FormField, FormGrid, FormSection };
