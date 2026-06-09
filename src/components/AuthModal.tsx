import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Profile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, profile: Profile) => void;
  showAlert: (msg: string, isError?: boolean) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, showAlert }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        showAlert(`Welcome aboard, ${username}! Success account created.`);
        onAuthSuccess(data.token, data.profile);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }

        showAlert(`Welcome back, ${data.profile.username}! Connected successfully.`);
        onAuthSuccess(data.token, data.profile);
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication process failure:', err);
      showAlert(err.message || 'Authentication failed. Please verify fields and retry.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-charcoal/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md bg-white border border-border-toned rounded-[32px] p-8 shadow-2xl flex flex-col gap-5 overflow-hidden"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            id="ecolens-auth-modal"
          >
            {/* Top design decorative badge */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sage/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex flex-col gap-1 text-center justify-center items-center">
              <span className="text-3xl">🔑</span>
              <h3 className="text-xl font-bold font-display tracking-tight text-charcoal mt-1">
                {authMode === 'login' ? 'Welcome Back to EcoLens' : 'Join EcoLens Campaign'}
              </h3>
              <p className="text-xs text-sage font-medium max-w-[280px]">
                {authMode === 'login' 
                  ? 'Connect secure identity credentials to load and track your active Carbon records.' 
                  : 'Establish a new climate champion account with custom levels, badges, and limits!'}
              </p>
            </div>

            {/* Auth forms */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {authMode === 'signup' && (
                <div className="relative">
                  <label className="text-[10px] font-bold text-sage uppercase tracking-wider block mb-1">Your Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Eco Champion"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-toned text-xs focus:ring-2 focus:ring-sage/20 text-charcoal bg-white font-medium"
                      required
                    />
                    <User className="absolute left-3 top-3 w-4 h-4 text-sage" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-sage uppercase tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-toned text-xs focus:ring-2 focus:ring-sage/20 text-charcoal bg-white font-medium"
                    required
                  />
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-sage" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-sage uppercase tracking-wider block mb-1">Account Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border-toned text-xs focus:ring-2 focus:ring-sage/20 text-charcoal bg-white font-medium font-mono"
                    required
                  />
                  <Lock className="absolute left-3 top-3.5 w-3.5 h-3.5 text-sage" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-sage hover:text-charcoal cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sage hover:bg-sage-hover text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" /> Secure Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Register New Account
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-border-toned/60 pt-4 flex items-center justify-center text-[11px] font-medium text-sage">
              <span>
                {authMode === 'login' ? "Don't have an account?" : "Already registered?"}
              </span>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="ml-1.5 font-bold text-sage hover:text-charcoal transition-all underline shrink-0 cursor-pointer"
              >
                {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
