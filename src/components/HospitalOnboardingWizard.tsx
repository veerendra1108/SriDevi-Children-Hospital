import React, { useState } from 'react';
import {
  CheckCircle,
  Building,
  UserPlus,
  Clock,
  Shield,
  Eye,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Hospital, Doctor } from '../types/index.js';

interface HospitalOnboardingWizardProps {
  hospital: Hospital;
  onFinish: (activatedHospital: Hospital) => void;
  onCancel?: () => void;
}

export const HospitalOnboardingWizard: React.FC<HospitalOnboardingWizardProps> = ({
  hospital,
  onFinish,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Step 1: Hospital profile
  const [hospitalData, setHospitalData] = useState({
    name: hospital.name,
    address: hospital.address || '',
    city: hospital.city,
    phone: hospital.phone,
    hospitalType: hospital.hospitalType,
    logoUrl: hospital.logoUrl || '',
  });

  // Step 2: Doctors with custom slot durations (5m, 10m, 15m, 20m, 30m)
  const [doctorsList, setDoctorsList] = useState<
    Array<{
      id: string;
      name: string;
      specialty: string;
      qualifications: string;
      experienceYears: number;
      slotDurationMinutes: number;
      consultationFee: number;
      availableDays: number[];
      startTime: string;
      endTime: string;
    }>
  >([
    {
      id: 'doc_1',
      name: hospital.adminName.startsWith('Dr.') ? hospital.adminName : `Dr. ${hospital.adminName}`,
      specialty: 'Chief Consultant',
      qualifications: 'MBBS, MD',
      experienceYears: 10,
      slotDurationMinutes: 10, // Default custom slot duration
      consultationFee: 500,
      availableDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
    },
  ]);

  // Step 3: OPD hours & buffer policies
  const [opdPolicies, setOpdPolicies] = useState({
    slotDurationMinutes: 15,
    bufferMinutesPerHour: 10,
    arrivalBeforeMinutes: 15,
    rescheduleCutoffMinutes: 60,
  });

  // Step 4: Receptionist Accounts
  const [receptionists, setReceptionists] = useState<
    Array<{ username: string; password: string; name: string }>
  >([
    {
      username: `reception.${hospital.slug}`,
      password: 'Reception@123',
      name: 'Main Reception Desk',
    },
  ]);

  const addDoctor = () => {
    setDoctorsList([
      ...doctorsList,
      {
        id: `doc_${Date.now()}`,
        name: '',
        specialty: 'Specialist',
        qualifications: 'MBBS',
        experienceYears: 5,
        slotDurationMinutes: 15,
        consultationFee: 500,
        availableDays: [1, 2, 3, 4, 5],
        startTime: '10:00',
        endTime: '16:00',
      },
    ]);
  };

  const removeDoctor = (index: number) => {
    if (doctorsList.length > 1) {
      setDoctorsList(doctorsList.filter((_, i) => i !== index));
    }
  };

  const updateDoctorField = (index: number, field: string, value: any) => {
    const updated = [...doctorsList];
    (updated[index] as any)[field] = value;
    setDoctorsList(updated);
  };

  const addReceptionist = () => {
    setReceptionists([
      ...receptionists,
      {
        username: `reception${receptionists.length + 1}.${hospital.slug}`,
        password: 'Reception@123',
        name: `Desk ${receptionists.length + 1}`,
      },
    ]);
  };

  const removeReceptionist = (index: number) => {
    if (receptionists.length > 1) {
      setReceptionists(receptionists.filter((_, i) => i !== index));
    }
  };

  const updateReceptionistField = (index: number, field: string, value: string) => {
    const updated = [...receptionists];
    (updated[index] as any)[field] = value;
    setReceptionists(updated);
  };

  const handleNextStep = async (isActivation = false) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep + 1,
          hospitalData,
          doctors: doctorsList,
          opdPolicies,
          receptionists,
          activate: isActivation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save onboarding progress.');
      }

      if (isActivation) {
        onFinish(data.hospital);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving step.');
    } finally {
      setLoading(false);
    }
  };

  const publicBookingUrl = `${window.location.origin}/hospital/${hospital.slug}`;

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const stepTitles = [
    { num: 1, title: 'Hospital Profile', icon: Building },
    { num: 2, title: 'Doctors & Slots', icon: UserPlus },
    { num: 3, title: 'OPD Policies', icon: Clock },
    { num: 4, title: 'Reception Staff', icon: Shield },
    { num: 5, title: 'Public Preview', icon: Eye },
    { num: 6, title: 'Smart Activation', icon: Rocket },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
              Hospital Onboarding Wizard
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">{hospital.name}</h2>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Step <span className="text-teal-700 font-bold text-base">{currentStep}</span> of 6
          </div>
        </div>

        {/* Steps Progress Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
          {stepTitles.map((s) => {
            const Icon = s.icon;
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center p-2 rounded-xl text-center border transition-all ${
                  isCurrent
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-bold truncate max-w-full">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Hospital Details */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 1: Hospital Facility Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your hospital contact and public booking identity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Name
                </label>
                <input
                  type="text"
                  value={hospitalData.name}
                  onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Type
                </label>
                <input
                  type="text"
                  value={hospitalData.hospitalType}
                  onChange={(e) => setHospitalData({ ...hospitalData, hospitalType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={hospitalData.city}
                  onChange={(e) => setHospitalData({ ...hospitalData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Contact Phone
                </label>
                <input
                  type="tel"
                  value={hospitalData.phone}
                  onChange={(e) => setHospitalData({ ...hospitalData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Hospital Address
                </label>
                <input
                  type="text"
                  value={hospitalData.address}
                  onChange={(e) => setHospitalData({ ...hospitalData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Doctor Details with Custom Slot Durations */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Step 2: Add Doctors & Custom Slot Durations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure consultation durations per doctor (e.g. 5 min rapid triage, 10 min, 15 min, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={addDoctor}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </button>
            </div>

            <div className="space-y-4">
              {doctorsList.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                      Doctor #{idx + 1}
                    </span>
                    {doctorsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDoctor(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(e) => updateDoctorField(idx, 'name', e.target.value)}
                        placeholder="e.g. Dr. Ramesh Kumar"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={doc.specialty}
                        onChange={(e) => updateDoctorField(idx, 'specialty', e.target.value)}
                        placeholder="e.g. Consultant Physician"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Qualifications
                      </label>
                      <input
                        type="text"
                        value={doc.qualifications}
                        onChange={(e) => updateDoctorField(idx, 'qualifications', e.target.value)}
                        placeholder="e.g. MBBS, MD"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* CUSTOM SLOT DURATION SELECTOR PER DOCTOR */}
                    <div>
                      <label className="block text-xs font-bold text-teal-800 mb-1 flex items-center justify-between">
                        <span>Consultation Slot Duration</span>
                        <span className="text-[10px] text-teal-600">Customizable</span>
                      </label>
                      <select
                        value={doc.slotDurationMinutes}
                        onChange={(e) =>
                          updateDoctorField(idx, 'slotDurationMinutes', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-teal-50/50 text-sm font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value={5}>5 Minutes (Rapid Triage / ENT)</option>
                        <option value={10}>10 Minutes (Standard Clinic)</option>
                        <option value={15}>15 Minutes (Comprehensive)</option>
                        <option value={20}>20 Minutes (Pediatric / Chronic)</option>
                        <option value={30}>30 Minutes (Detailed Specialist)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={doc.consultationFee}
                        onChange={(e) =>
                          updateDoctorField(idx, 'consultationFee', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        OPD Hours (Start - End)
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="time"
                          value={doc.startTime}
                          onChange={(e) => updateDoctorField(idx, 'startTime', e.target.value)}
                          className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={doc.endTime}
                          onChange={(e) => updateDoctorField(idx, 'endTime', e.target.value)}
                          className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: OPD Hours, Breaks, Buffers */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Step 3: Configure Smart OPD Engine Policies
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set dynamic delay absorption buffers and patient reporting times.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Buffer Minutes Per Hour
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Automatically absorbs consultation overruns down the queue without cascading delays.
                </p>
                <select
                  value={opdPolicies.bufferMinutesPerHour}
                  onChange={(e) =>
                    setOpdPolicies({ ...opdPolicies, bufferMinutesPerHour: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                >
                  <option value={10}>10 Minutes / Hour (Recommended)</option>
                  <option value={15}>15 Minutes / Hour</option>
                  <option value={5}>5 Minutes / Hour</option>
                  <option value={0}>0 Minutes (No buffer)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Patient Arrival Before Slot
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Recommended arrival buffer requested on patient tracker and SMS.
                </p>
                <select
                  value={opdPolicies.arrivalBeforeMinutes}
                  onChange={(e) =>
                    setOpdPolicies({ ...opdPolicies, arrivalBeforeMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                >
                  <option value={15}>15 Minutes Before (Standard)</option>
                  <option value={10}>10 Minutes Before</option>
                  <option value={20}>20 Minutes Before</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Reception Accounts */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 4: Receptionist Staff Accounts</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create secure logins for reception staff to manage phone bookings and live queue calls.
                </p>
              </div>
              <button
                type="button"
                onClick={addReceptionist}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Receptionist</span>
              </button>
            </div>

            <div className="space-y-3">
              {receptionists.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="w-full sm:w-1/3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Desk / Staff Name
                    </label>
                    <input
                      type="text"
                      value={rec.name}
                      onChange={(e) => updateReceptionistField(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                    />
                  </div>

                  <div className="w-full sm:w-1/3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Login Username
                    </label>
                    <input
                      type="text"
                      value={rec.username}
                      onChange={(e) => updateReceptionistField(idx, 'username', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                    />
                  </div>

                  <div className="w-full sm:w-1/3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={rec.password}
                      onChange={(e) => updateReceptionistField(idx, 'password', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                    />
                  </div>

                  {receptionists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReceptionist(idx)}
                      className="text-slate-400 hover:text-rose-600 pt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Public Preview */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Step 5: Preview Your Public Hospital Booking Page
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients will see this page when booking appointments online or scanning QR codes.
              </p>
            </div>

            {/* Unique Hospital Booking URL */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Unique Hospital Booking URL
                </span>
                <p className="text-sm font-bold text-teal-900 break-all">{publicBookingUrl}</p>
              </div>
              <button
                type="button"
                onClick={copyPublicUrl}
                className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex-shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUrl ? 'Copied URL!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Mock Hospital Booking Preview Card */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                  {hospital.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{hospital.name}</h4>
                  <p className="text-xs text-slate-500">
                    {hospital.city} • {hospital.hospitalType}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Active Consultation OPD Specialists
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctorsList.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800">{d.name}</div>
                        <div className="text-xs text-slate-500">
                          {d.specialty} • {d.slotDurationMinutes}m slots
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        ₹{d.consultationFee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Smart Activation */}
        {currentStep === 6 && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
              <Rocket className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Ready for Launch
              </span>
              <h3 className="text-2xl font-black text-slate-900">Activate Smart OPD</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Your hospital is configured and ready. Activating will publish your public booking URL
                and enable real-time queue synchronization.
              </p>
            </div>

            <div className="max-w-md mx-auto text-left bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Hospital Profile & Unique Booking URL generated</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {doctorsList.length} doctor(s) configured with custom slot durations
                </span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {receptionists.length} reception accounts prepared for telephone bookings
                </span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Two-factor secure patient tracking active</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleNextStep(false)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleNextStep(true)}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-black rounded-xl shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Activating...</span>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Activate Smart OPD Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
