import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Calendar,
  Clock,
  Shield,
  Plus,
  Copy,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertCircle,
  TrendingUp,
  UserCheck,
  CheckCircle,
  PhoneCall,
  Search,
} from 'lucide-react';
import { Hospital, Doctor, HospitalAdminUser, Appointment } from '../types/index.js';

interface HospitalAdminDashboardProps {
  hospitalId: string;
  adminUser: HospitalAdminUser;
  onLogout: () => void;
  onOpenBookingPreview?: (slug: string) => void;
}

export const HospitalAdminDashboard: React.FC<HospitalAdminDashboardProps> = ({
  hospitalId,
  adminUser,
  onLogout,
  onOpenBookingPreview,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    hospital: Hospital;
    bookingUrl: string;
    doctors: Doctor[];
    receptionists: any[];
    stats: {
      totalDoctors: number;
      totalAppointmentsToday: number;
      onlineBookingsToday: number;
      phoneBookingsToday: number;
      completedToday: number;
      waitingToday: number;
    };
    todayAppointments: Appointment[];
  } | null>(null);

  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddReceptionistOpen, setIsAddReceptionistOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // New Doctor Form State with custom slot duration
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: 'Specialist',
    qualifications: 'MBBS, MD',
    experienceYears: 5,
    slotDurationMinutes: 15, // Default custom duration
    consultationFee: 500,
    startTime: '09:00',
    endTime: '17:00',
    mobile: '',
    email: '',
  });

  // New Receptionist Form State
  const [newReceptionist, setNewReceptionist] = useState({
    name: '',
    username: '',
    password: '',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hospital-admin/${hospitalId}/dashboard`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to load dashboard.');
      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Error loading hospital dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [hospitalId]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/hospital-admin/${hospitalId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to add doctor.');
      setIsAddDoctorOpen(false);
      setNewDoctor({
        name: '',
        specialty: 'Specialist',
        qualifications: 'MBBS, MD',
        experienceYears: 5,
        slotDurationMinutes: 15,
        consultationFee: 500,
        startTime: '09:00',
        endTime: '17:00',
        mobile: '',
        email: '',
      });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/hospital-admin/${hospitalId}/receptionists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReceptionist),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to add receptionist.');
      setIsAddReceptionistOpen(false);
      setNewReceptionist({ name: '', username: '', password: '' });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fullBookingUrl = data ? `${window.location.origin}/hospital/${data.hospital.slug}` : '';

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(fullBookingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading Hospital Admin Portal...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Unable to load hospital dashboard</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Top Navbar Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-2 border border-teal-500/30">
            <Building className="w-3.5 h-3.5" />
            <span>Hospital Administration Hub • Tenant Scoped</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data.hospital.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {data.hospital.city}, {data.hospital.state} • Logged in as{' '}
            <strong className="text-teal-200">{adminUser.name}</strong> ({adminUser.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyBookingUrl}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedUrl ? 'Copied URL!' : 'Copy Booking Link'}</span>
          </button>
          {onOpenBookingPreview && (
            <button
              onClick={() => onOpenBookingPreview(data.hospital.slug)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Public Page</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Today
          </span>
          <div className="text-3xl font-black text-slate-800 mt-1">
            {data.stats.totalAppointmentsToday}
          </div>
          <span className="text-xs text-slate-500 font-medium">All booking sources</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Online Bookings
          </span>
          <div className="text-3xl font-black text-teal-700 mt-1">
            {data.stats.onlineBookingsToday}
          </div>
          <span className="text-xs text-teal-600 font-medium">Patient self-booked</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Phone / Desk
          </span>
          <div className="text-3xl font-black text-indigo-700 mt-1">
            {data.stats.phoneBookingsToday}
          </div>
          <span className="text-xs text-indigo-600 font-medium">Reception telephone</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Active Doctors
          </span>
          <div className="text-3xl font-black text-emerald-700 mt-1">{data.doctors.length}</div>
          <span className="text-xs text-emerald-600 font-medium">Configured OPD sessions</span>
        </div>
      </div>

      {/* Doctors & Custom Slot Durations Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Hospital Consultation Doctors</h3>
            <p className="text-xs text-slate-500">
              Manage doctor profiles and slot duration intervals (e.g. 5m, 10m, 15m, 20m, 30m).
            </p>
          </div>
          <button
            onClick={() => setIsAddDoctorOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all bg-slate-50/50 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                  <p className="text-xs text-teal-700 font-semibold">{doc.specialty}</p>
                  <p className="text-xs text-slate-400">{doc.qualifications}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg">
                  ₹{doc.consultationFee || 500}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Slot Duration:</span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {doc.slotDurationMinutes || 15} Minutes / Slot
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reception Staff Accounts Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Receptionist Accounts</h3>
            <p className="text-xs text-slate-500">
              Staff authorized to operate telephone booking and live queue check-ins.
            </p>
          </div>
          <button
            onClick={() => setIsAddReceptionistOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Receptionist</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.receptionists.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-800 text-sm">{rec.name}</p>
                <p className="text-slate-500 mt-0.5">Username: <span className="font-mono text-teal-700 font-bold">{rec.username}</span></p>
              </div>
              <span className="px-2 py-1 bg-teal-100/60 text-teal-800 font-bold rounded text-[11px]">
                Authorized
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Doctor */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Doctor to Hospital</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Nair"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiologist"
                    value={newDoctor.specialty}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, DM"
                    value={newDoctor.qualifications}
                    onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* SLOT DURATION SELECTION */}
              <div>
                <label className="block text-xs font-bold text-teal-800 mb-1">
                  Consultation Slot Duration
                </label>
                <select
                  value={newDoctor.slotDurationMinutes}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, slotDurationMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-teal-50 text-sm font-bold text-teal-900"
                >
                  <option value={5}>5 Minutes (Rapid / Triage / ENT)</option>
                  <option value={10}>10 Minutes (Standard Consultation)</option>
                  <option value={15}>15 Minutes (Comprehensive)</option>
                  <option value={20}>20 Minutes (Pediatric / Chronic)</option>
                  <option value={30}>30 Minutes (Detailed Specialist)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={newDoctor.consultationFee}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, consultationFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={newDoctor.experienceYears}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, experienceYears: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Receptionist */}
      {isAddReceptionistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Receptionist Account</h3>
            <form onSubmit={handleCreateReceptionist} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff / Desk Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontdesk Morning"
                  value={newReceptionist.name}
                  onChange={(e) => setNewReceptionist({ ...newReceptionist, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder={`reception.${data.hospital.slug}`}
                  value={newReceptionist.username}
                  onChange={(e) =>
                    setNewReceptionist({ ...newReceptionist, username: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={newReceptionist.password}
                  onChange={(e) =>
                    setNewReceptionist({ ...newReceptionist, password: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddReceptionistOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
