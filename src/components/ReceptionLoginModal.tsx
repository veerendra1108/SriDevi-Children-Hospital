import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, ArrowRight, Building } from 'lucide-react';

interface ReceptionLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; branchId: 'kakinada' | 'pithapuram'; name: string }) => void;
}

export const ReceptionLoginModal: React.FC<ReceptionLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Reception@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const userToLogin = customUser || username;
    const passToLogin = customPass || password;

    try {
      const res = await fetch('/api/auth/reception-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToLogin, password: passToLogin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid reception credentials');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          id="reception-login-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 mx-auto flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Hospital Reception Desk</h3>
          <p className="text-xs text-slate-500">
            Frontdesk console to manage patient arrival, queue adjustments, payments &amp; delay recovery
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Username / Desk ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="reception-input-username"
                type="text"
                required
                placeholder="e.g. reception.kakinada"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 font-semibold">Password</label>
              <span className="text-[11px] text-slate-400">(Default: Reception@123)</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="reception-input-password"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            id="reception-login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
          >
            <span>{loading ? 'Authenticating...' : 'Access Reception Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Branch Login Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Test Reception Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="reception-quick-kakinada-btn"
              type="button"
              onClick={() => {
                setUsername('reception.kakinada');
                setPassword('Reception@123');
                handleLogin(undefined, 'reception.kakinada', 'Reception@123');
              }}
              className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <Building className="w-3.5 h-3.5 text-amber-700" />
                <span>Kakinada Desk</span>
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">reception.kakinada</div>
            </button>

            <button
              id="reception-quick-pithapuram-btn"
              type="button"
              onClick={() => {
                setUsername('reception.pithapuram');
                setPassword('Reception@123');
                handleLogin(undefined, 'reception.pithapuram', 'Reception@123');
              }}
              className="p-3 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-left transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-sky-900 text-xs">
                <Building className="w-3.5 h-3.5 text-sky-700" />
                <span>Pithapuram Desk</span>
              </div>
              <div className="text-[10px] text-sky-700 mt-0.5">reception.pithapuram</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
