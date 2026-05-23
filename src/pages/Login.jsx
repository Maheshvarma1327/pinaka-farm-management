import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, setError } = useAuthStore();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // 1. Client-side sanity checks
    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter your email and password.');
      return;
    }

    try {
      await login(email, password);
      // Success! Route directly to dashboard
      navigate('/');
    } catch (err) {
      // Handled by store, errors will show via the 'error' state
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-sidebar border border-borderDark rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Header Block */}
        <div className="px-6 pt-8 pb-5 text-center bg-cardHover border-b border-borderDark/40">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary font-extrabold text-2xl tracking-tight">P</span>
          </div>
          <h2 className="text-lg font-bold text-textPrimary tracking-wide uppercase">PINAKA REGISTER</h2>
          <p className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mt-1">
            Smart Pig Farm Management Platform
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          
          {/* Error Message Panel */}
          {(error || validationError) && (
            <div className="flex gap-2.5 bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Email input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-textSecondary/80" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. veterinarian@pinaka.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="dense-input text-xs"
              required
            />
          </div>

          {/* Password input field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-textSecondary/80" />
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="dense-input text-xs pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-textPrimary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
                Authenticating...
              </>
            ) : (
              'Sign In to Register'
            )}
          </button>
        </form>

        {/* Footer Block */}
        <div className="px-6 py-4 bg-surface/50 border-t border-borderDark/40 text-center">
          <p className="text-[10px] text-textSecondary">
            New to Pinaka registers?{' '}
            <Link to="/signup" className="text-primary hover:underline font-bold transition-all">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
