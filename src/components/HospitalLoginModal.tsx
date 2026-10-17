import React, { useState } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface HospitalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLoginSuccess: (admin: any, hospital: any, token: string) => void;
  onReceptionLoginSuccess: (receptionUser: any) => void;
  onOpenRegister: () => void;
}

export const HospitalLoginModal: React.FC<HospitalLoginModalProps> = ({
  isOpen,
  onClose,
  onAdminLoginSuccess,
  onReceptionLoginSuccess,
  onOpenRegister,
}) => {
  const [role, setRole] = useState<'ADMIN' | 'RECEPTION'>('ADMIN');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [receptionUsername, setReceptionUsername] = useState('');
  const [receptionPassword, setReceptionPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/hospital-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate administrator.');
      }
      onAdminLoginSuccess(data.admin, data.hospital, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reception-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: receptionUsername, password: receptionPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to authenticate receptionist.');
      }
      onReceptionLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = (type: 'APEX' | 'CITYCARE') => {
    if (type === 'APEX') {
      setAdminEmail('admin@apexhealth.com');
      setAdminPassword('Admin@123');
    } else {
      setAdminEmail('admin@citycare.com');
      setAdminPassword('Admin@123');
    }
    setError(null);
  };

  const fillDemoReception = (type: 'APEX' | 'CITYCARE') => {
    if (type === 'APEX') {
      setReceptionUsername('reception.apex');
      setReceptionPassword('Reception@123');
    } else {
      setReceptionUsername('reception.citycare');
      setReceptionPassword('Reception@123');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-mint-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Hospital Portal Login</h3>
              <p className="text-xs text-teal-200">Doctormate Multi-Hospital Platform</p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex p-1 bg-teal-950/40 rounded-xl mt-4 border border-teal-500/20">
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'ADMIN'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Hospital Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('RECEPTION');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'RECEPTION'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Reception Desk
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {role === 'ADMIN' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Demo quick fill */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Demo Admin Logins:
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAdmin('APEX')}
                    className="flex-1 text-[11px] py-1 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 hover:text-teal-700 font-medium transition"
                  >
                    Apex Hospital
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAdmin('CITYCARE')}
                    className="flex-1 text-[11px] py-1 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 hover:text-teal-700 font-medium transition"
                  >
                    City Care Hospital
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In as Administrator'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleReceptionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reception Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={receptionUsername}
                    onChange={(e) => setReceptionUsername(e.target.value)}
                    placeholder="reception.username"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reception Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={receptionPassword}
                    onChange={(e) => setReceptionPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Demo quick fill */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Demo Receptionist Logins:
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoReception('APEX')}
                    className="flex-1 text-[11px] py-1 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 hover:text-teal-700 font-medium transition"
                  >
                    Apex Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoReception('CITYCARE')}
                    className="flex-1 text-[11px] py-1 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 hover:text-teal-700 font-medium transition"
                  >
                    City Care Desk
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In to Reception Desk'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Not registered on Doctormate yet?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="font-semibold text-teal-600 hover:text-teal-700 underline"
              >
                Register Your Hospital
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
