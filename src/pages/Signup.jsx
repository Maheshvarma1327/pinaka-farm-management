import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, User, Shield, AlertTriangle } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error, setError } = useAuthStore();

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // 1. Client-side input sanity audits
    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await signup(name, email, password, role);
      // Route directly to dashboard on register success
      navigate('/');
    } catch (err) {
      // Handled by store
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Signup Container Card */}
      <div className="w-full max-w-md bg-sidebar border border-borderDark rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Header Block */}
        <div className="px-6 pt-7 pb-4 text-center bg-cardHover border-b border-borderDark/40">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-2">
            <span className="text-primary font-extrabold text-xl tracking-tight">P</span>
          </div>
          <h2 className="text-sm font-bold text-textPrimary tracking-wide uppercase">Register Operational Account</h2>
          <p className="text-[9px] text-textSecondary uppercase tracking-widest font-semibold mt-1">
            Smart Pig Farm digital registers
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5 text-xs">
          
          {/* Error Message Panel */}
          {(error || validationError) && (
            <div className="flex gap-2 bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Full Name input field */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-textSecondary/80" />
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="dense-input text-xs"
              required
            />
          </div>

          {/* Email input field */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-textSecondary/80" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. johndoe@farm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="dense-input text-xs"
              required
            />
          </div>

          {/* Password input field */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-textSecondary/80" />
              Password (Min 6 chars)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="dense-input text-xs"
              required
            />
          </div>

          {/* Role selector field */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-textSecondary/80" />
              Operational Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="dense-select text-xs"
            >
              <option value="Farm Worker">Farm Worker (Daily Entry)</option>
              <option value="Veterinarian">Veterinarian (Medication & Treatments)</option>
              <option value="Viewer">Viewer (Read-only access)</option>
            </select>
          </div>

          {/* Submit Trigger Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/40 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow-md hover:shadow-glow transition-all duration-150 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Block */}
        <div className="px-6 py-4 bg-surface/50 border-t border-borderDark/40 text-center">
          <p className="text-[10px] text-textSecondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
