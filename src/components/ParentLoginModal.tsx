import React, { useState } from 'react';
import { User, Lock, Phone, X, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Parent } from '../types/index.js';

interface ParentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (parent: Parent) => void;
}

const TEST_PARENTS = [
  { name: 'Ravi Kumar', mobile: '9000000001', children: 'Aarav, Diya' },
  { name: 'Suresh Babu', mobile: '9000000002', children: 'Vihaan' },
  { name: 'Lakshmi Devi', mobile: '9000000003', children: 'Ananya, Aditya' },
  { name: 'Rajesh Kumar', mobile: '9000000004', children: 'Ishaan' },
  { name: 'Priya Rao', mobile: '9000000005', children: 'Myra, Riya' },
  { name: 'Mahesh', mobile: '9000000006', children: 'Arjun' },
  { name: 'Sravani', mobile: '9000000007', children: 'Kavya, Karthik' },
  { name: 'Venkatesh', mobile: '9000000008', children: 'Sai' },
  { name: 'Deepika', mobile: '9000000009', children: 'Tara, Nikhil' },
  { name: 'Praveen', mobile: '9000000010', children: 'Akhil' },
];

export const ParentLoginModal: React.FC<ParentLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('Test@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, directMobile?: string, directPassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginMobile = directMobile || mobile;
    const loginPassword = directPassword || password;

    try {
      const res = await fetch('/api/auth/parent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: loginMobile, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.parent);
      onClose();
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parentName, mobile, childName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError('Failed to create parent profile.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.parent);
      onClose();
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          id="parent-login-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 mx-auto flex items-center justify-center mb-2">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isRegisterMode ? 'New Parent Registration' : 'Parent Login'}
          </h3>
          <p className="text-xs text-slate-500">
            {isRegisterMode
              ? 'Enter parent name & child name to start booking'
              : 'Sign in with your mobile number to view appointments & track live queue'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isRegisterMode ? (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Parent Full Name *</label>
              <input
                id="reg-input-parent-name"
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
              <input
                id="reg-input-mobile"
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Child Name *</label>
              <input
                id="reg-input-child-name"
                type="text"
                required
                placeholder="e.g. Baby Aarav"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
            >
              <span>{loading ? 'Creating Profile...' : 'Complete & Enter Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className="w-full text-center text-xs text-teal-700 font-medium hover:underline pt-1"
            >
              Already have an account? Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="parent-input-mobile"
                  type="tel"
                  required
                  placeholder="e.g. 9000000001"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-semibold">Password</label>
                <span className="text-[11px] text-slate-400">(Default: Test@123)</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="parent-input-password"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              id="parent-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Parent'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className="w-full text-center text-xs text-teal-700 font-medium hover:underline pt-1"
            >
              New parent? Register in 10 seconds
            </button>
          </form>
        )}

        {/* 10 Test Parents Quick Login Selector */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              10 Test Parents (One-Click Sign In)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {TEST_PARENTS.map((p, idx) => (
              <button
                key={p.mobile}
                id={`quick-login-${p.mobile}`}
                type="button"
                onClick={() => {
                  setMobile(p.mobile);
                  setPassword('Test@123');
                  handleLogin(undefined, p.mobile, 'Test@123');
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">
                  {idx + 1}. {p.name}
                </div>
                <div className="text-[10px] text-teal-700 truncate">{p.children}</div>
                <div className="text-[9px] text-slate-400 font-mono">{p.mobile}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
