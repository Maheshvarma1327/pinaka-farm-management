import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert } from 'lucide-react';

/**
 * Client-side Route Guard.
 * Enforces login authentication status and verifies role permission allowances.
 * @param {Array} allowedRoles - Array of roles permitted (e.g. ['Admin', 'Veterinarian'])
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  // 1. Loading State Placeholder
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-xs text-textSecondary gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="uppercase tracking-widest font-semibold text-[10px]">Restoring Safe Session...</span>
      </div>
    );
  }

  // 2. Redirect to Login if unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verify user Role permission boundaries
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-6">
        <div className="op-card max-w-md w-full text-center border-danger/30 shadow-glowDanger p-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-danger mb-2">
            Access Denied
          </h2>
          <p className="text-xs text-textSecondary leading-relaxed mb-6">
            Your current operational authorization status ({user.role}) restricts access to this register ledger. Please contact the farm administrator if this is an error.
          </p>
          <a
            href="/"
            className="w-full py-2 bg-sidebar border border-borderDark text-xs text-textPrimary hover:bg-cardBg hover:text-primary font-bold rounded transition-colors text-center"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // 4. Mount permitted route
  return children;
}
