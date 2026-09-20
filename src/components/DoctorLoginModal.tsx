import React, { useState } from 'react';
import { X, Stethoscope, Lock, User, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Doctor, DoctorAccount } from '../types/index.js';

interface DoctorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (doctor: Doctor, account: DoctorAccount, token: string) => void;
}

export const DoctorLoginModal: React.FC<DoctorLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/doctor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please verify doctor credentials.');
      }

      localStorage.setItem('sri_devi_doctor_token', data.token);
      onLoginSuccess(data.doctor, data.account, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during doctor login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPilotLogin = (docId: string, pass: string) => {
    setLoginId(docId);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full mb-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Pediatrician Console
              </span>
              <h2 className="text-xl font-bold tracking-tight">Doctor Desk Login</h2>
            </div>
          </div>
          <p className="text-emerald-100 text-xs mt-2">
            Secure clinical workspace for Sri Devi Children Hospital medical staff.
          </p>
        </div>

        {/* Quick Pilot Selector */}
        <div className="p-6 pb-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-2">
              <span>Fast Pilot Access (Demonstration):</span>
              <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-medium border border-teal-200">
                1-Click Pre-fill
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-pilot-dr-subba-rao"
                onClick={() => handleQuickPilotLogin('dr-subba-rao', 'Doctor@123')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                  Dr. K. Subba Rao
                </div>
                <div className="text-[10px] text-slate-500">APMC-38492 (Senior)</div>
              </button>
              <button
                type="button"
                id="btn-pilot-dr-prashant"
                onClick={() => handleQuickPilotLogin('dr-prashant', 'Doctor@123')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                  Dr. Prashant
                </div>
                <div className="text-[10px] text-slate-500">APMC-61204 (Pediatrician)</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Doctor ID / Mobile / Reg. No
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="doctor-login-input-id"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. dr-subba-rao or 9440112233"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Doctor Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="doctor-login-input-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-doctor-login"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Enter Clinical Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Audit Logging Active
          </span>
          <span>Doctormate Pediatric EMR v1.0</span>
        </div>
      </div>
    </div>
  );
};
