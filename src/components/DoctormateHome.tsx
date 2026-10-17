import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  PhoneCall,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  MapPin,
  ChevronRight,
  Activity,
  Layers,
  Database,
  Smartphone,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { Hospital } from '../types/index.js';

interface DoctormateHomeProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenTracker: (token?: string) => void;
  onSelectHospital: (slug: string) => void;
  onGoToReceptionDemo: () => void;
  onGoToAdminDemo: () => void;
}

export const DoctormateHome: React.FC<DoctormateHomeProps> = ({
  onOpenRegister,
  onOpenLogin,
  onOpenTracker,
  onSelectHospital,
  onGoToReceptionDemo,
  onGoToAdminDemo,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackTokenInput, setTrackTokenInput] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHospitals(data);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      (h.hospitalType && h.hospitalType.toLowerCase().includes(q))
    );
  });

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackTokenInput.trim()) {
      onOpenTracker(trackTokenInput.trim());
    } else {
      onOpenTracker();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* SaaS Top Announcement Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white text-xs py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">Doctormate SaaS Phase 1:</span>
            <span className="text-teal-200 hidden sm:inline">
              Multi-Hospital Cloud OPD &amp; Live Train-ETA Queue Engine
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onGoToAdminDemo}
              className="text-teal-200 hover:text-white transition flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Try Sri Devi Admin
            </button>
            <span className="text-teal-600">|</span>
            <button
              onClick={onGoToReceptionDemo}
              className="text-teal-200 hover:text-white transition flex items-center gap-1 font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-mint-300" />
              Try Reception Desk
            </button>
          </div>
        </div>
      </div>

      {/* Main SaaS Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Doctormate<span className="text-teal-600">.</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  SaaS OPD
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Smart Queue &amp; Appointment Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition">Capabilities</a>
            <a href="#hospitals-directory" className="hover:text-teal-600 transition">Find Hospital</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition">How It Works</a>
            <a href="#architecture" className="hover:text-teal-600 transition">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenTracker()}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              Track Queue
            </button>

            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition"
            >
              Hospital Login
            </button>

            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-xl shadow-md shadow-teal-600/20 transition transform active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5" />
              Register Hospital
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50/30 to-slate-50 pt-16 pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold uppercase tracking-wider mb-6 border border-teal-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              Multi-Hospital Smart OPD Engine
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              Transform Your Hospital Into a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-sky-600 to-teal-800">
                Zero-Wait Smart OPD
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-8 max-w-2xl mx-auto">
              Equip your receptionists with rapid telephone booking, support custom doctor time slots (5 to 30 mins), and give patients live radar queue tracking without crowded waiting halls.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onOpenRegister}
                className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/25 flex items-center justify-center gap-3 text-base transition transform hover:-translate-y-0.5"
              >
                <Building2 className="w-5 h-5" />
                Register Your Hospital Now
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => onOpenTracker()}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border-2 border-slate-200 hover:border-teal-300 shadow-sm flex items-center justify-center gap-3 text-base transition"
              >
                <Clock className="w-5 h-5 text-teal-600" />
                Live Patient Tracker
              </button>
            </div>

            {/* Live Token Quick-Track input */}
            <div className="max-w-md mx-auto bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Enter Token (e.g. DM-SRID-171026-1030)"
                value={trackTokenInput}
                onChange={(e) => setTrackTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackSubmit(e)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
              />
              <button
                onClick={handleTrackSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Track Live
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-3xl font-extrabold text-teal-700 mb-1">5m - 30m</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Doctor Slot Customization
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-3xl font-extrabold text-sky-700 mb-1">Train-ETA</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dynamic Delay Propagation
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-3xl font-extrabold text-emerald-700 mb-1">2-Factor</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Anti-Enumeration Tracking
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-3xl font-extrabold text-indigo-700 mb-1">Multi-Tenant</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Strict Hospital Data Isolation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Directory Section */}
      <section id="hospitals-directory" className="py-16 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Active Hospital Network
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Explore Hospitals on Doctormate
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Patients can book online or visit the hospital's dedicated Smart OPD portal.
              </p>
            </div>

            {/* Filter */}
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search hospital or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {loadingHospitals ? (
            <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
              Loading registered hospitals...
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Hospitals Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Be the first hospital in this area to launch Smart OPD!
              </p>
              <button
                onClick={onOpenRegister}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
              >
                Register Your Hospital
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-300 transition p-6 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                        {hospital.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {hospital.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                      {hospital.name}
                    </h3>
                    <p className="text-xs font-medium text-teal-600 mb-2">{hospital.hospitalType || 'Hospital'}</p>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hospital.city ? `${hospital.city}, ${hospital.state || 'India'}` : hospital.address}</span>
                      </div>
                      {hospital.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{hospital.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => onSelectHospital(hospital.slug)}
                      className="flex-1 py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Online
                    </button>

                    <button
                      onClick={() => onSelectHospital(hospital.slug)}
                      className="p-2.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition"
                      title="Open Hospital Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Platform Capabilities (Phase 1 Focus) */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Engineered for Modern OPD Operations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Everything Your Clinic Needs for Smart OPD
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Phase 1 delivers the exact high-trust workflows required for receptionists and doctors to run an orderly consultation flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Custom Doctor Time Slots (5m - 30m)
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Doctors choose their exact consultation cadence during registration. Rapid pediatric follow-ups can allocate 5 or 10 minutes, while complex specialties can set 15, 20, or 30 minutes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Fast Reception Telephone Desk
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Receptionists book phone callers in under 15 seconds. Automatic duplicate checks, quick phone lookups, instant slot locking, and token generation (`DM-HOSP-DATE-TIME`).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Rolling Train-ETA Queue Radar
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                When emergencies or delays happen, the queue engine dynamically propagates delays across remaining slots while absorbing time via scheduled buffers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Two-Factor Patient Privacy
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Protected live tracker URLs prevent enumeration attacks. Public tracker requires appointment token plus patient mobile number verification before displaying queue status.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Multi-Tenant Isolation
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Complete data separation between hospitals. Hospital A's receptionists and appointments remain 100% segregated from Hospital B's queues and patient records.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                PostgreSQL Migration-Ready
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Currently running on high-speed SQLite for local development with standard SQL data types and repository schemas designed for instant migration to PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Simple 3-Step Journey
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              From Registration to Live Smart OPD in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-base flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Register Hospital</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hospital administrators create their account in 2 minutes, get their custom booking link (`/hospital/your-slug`), and set branch details.
              </p>
            </div>

            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-base flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Add Doctors &amp; Time Slots</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Define consulting hours and tailor each doctor's slot duration (5, 10, 15, 20, or 30 minutes) to match their clinical pace.
              </p>
            </div>

            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-base flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Operate Smart Queue</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receptionists book phone callers instantly. Patients track their real-time arrival buffer on their phone, arriving right when it's their turn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-teal-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to upgrade your hospital to Doctormate Smart OPD?
          </h2>
          <p className="text-teal-200 text-sm max-w-xl mx-auto mb-8">
            Eliminate lobby chaos, respect patient time, and optimize your doctor schedules today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="px-8 py-3.5 bg-white text-teal-900 font-bold text-sm rounded-xl hover:bg-teal-50 transition shadow-lg"
            >
              Register Your Hospital (Free Trial)
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-3.5 bg-teal-700/80 hover:bg-teal-700 text-white font-bold text-sm rounded-xl border border-teal-500/40 transition"
            >
              Sign In to Hospital Portal
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Doctormate SaaS Platform</span>
            <span className="text-slate-500 font-normal text-xs">• Smart OPD Phase 1</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Doctormate Health Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
