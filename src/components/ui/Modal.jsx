import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal window component with keyboard bindings.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl
  footer = null
}) {
  // Capture Escape key to close the modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent scroll propagation on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Set modal width based on size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in no-print">
      {/* Click Outside Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Content Container */}
      <div className={`relative w-full ${sizeClasses} bg-sidebar border border-borderDark rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden`}>
        
        {/* Header Block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderDark bg-cardBg/40">
          <h3 className="text-sm font-bold tracking-wider text-textPrimary uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cardBg hover:text-danger rounded text-textSecondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto text-xs text-textSecondary scrollbar-thin">
          {children}
        </div>

        {/* Optional Footer Block */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-borderDark bg-surface flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
