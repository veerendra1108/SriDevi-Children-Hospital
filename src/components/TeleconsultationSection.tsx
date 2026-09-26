import React, { useState, useEffect } from 'react';
import {
  Video,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  ShieldCheck,
  Calendar,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Baby,
} from 'lucide-react';
import { Doctor, Teleconsultation, PatientAvailabilityStatus } from '../types/index.js';

interface TeleconsultationSectionProps {
  doctors: Doctor[];
  simulatedDate?: string;
  onBookInPerson?: () => void;
}

export const TeleconsultationSection: React.FC<TeleconsultationSectionProps> = ({
  doctors,
  simulatedDate = new Date().toISOString().split('T')[0],
  onBookInPerson,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors[0]?.id || 'dr-subba-rao'
  );
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGender, setChildGender] = useState<'Boy' | 'Girl'>('Boy');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'WHATSAPP_VIDEO' | 'PHONE_AUDIO'>('WHATSAPP_VIDEO');
  const [patientAvailability, setPatientAvailability] = useState<PatientAvailabilityStatus>('AVAILABLE_NOW');
  const [timeSlot, setTimeSlot] = useState('04:30 PM');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'UPI_PHONEPE' | 'UPI_GPAY' | 'CASH_DESK'>('UPI_PHONEPE');
  const [paymentReference, setPaymentReference] = useState('');

  // Active bookings list
  const [activeTeleconsults, setActiveTeleconsults] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Load teleconsultations from backend / localStorage
  const loadTeleconsultations = async () => {
    try {
      const res = await fetch('/api/teleconsultations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveTeleconsults(data);
          return;
        }
      }
    } catch {
      // Fallback to local storage if offline
    }

    const saved = localStorage.getItem('sdch_teleconsultations');
    if (saved) {
      try {
        setActiveTeleconsults(JSON.parse(saved));
      } catch {
        // Ignore parse error
      }
    }
  };

  useEffect(() => {
    loadTeleconsultations();
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) {
      alert('Please enter Child Full Name');
      return;
    }
    if (!parentMobile.trim() || parentMobile.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit WhatsApp/Mobile Number');
      return;
    }

    setLoading(true);

    const payload = {
      childName: childName.trim(),
      childAge: childAge ? Number(childAge) : undefined,
      childGender,
      parentName: parentName.trim() || 'Parent',
      parentMobile: parentMobile.trim(),
      doctorId: selectedDoctor?.id || 'dr-subba-rao',
      doctorName: selectedDoctor?.name || 'Dr. M. Subba Rao',
      specialty: selectedDoctor?.specialty || 'Senior Consultant Pediatrician',
      date: simulatedDate,
      timeSlot: patientAvailability === 'AVAILABLE_NOW' ? 'Immediate (15m)' : timeSlot,
      patientAvailability,
      preferredChannel,
      symptoms: symptoms.trim() || 'General pediatric consultation',
      paymentStatus,
      paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined,
      paymentReference: paymentStatus === 'PAID' ? paymentReference.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}` : undefined,
      amount: 300,
    };

    try {
      const res = await fetch('/api/teleconsultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setActiveTeleconsults((prev) => [data.teleconsultation, ...prev]);
        try {
          const existing = JSON.parse(localStorage.getItem('sdch_teleconsultations') || '[]');
          localStorage.setItem('sdch_teleconsultations', JSON.stringify([data.teleconsultation, ...existing]));
        } catch {
          // Ignore storage error
        }
        setSuccessNotice(`Teleconsultation requested successfully! Token: ${data.teleconsultation.teleconsultNumber}`);
        // Reset form inputs
        setChildName('');
        setChildAge('');
        setSymptoms('');
        setPaymentReference('');
      } else {
        alert(data.message || 'Could not schedule teleconsultation');
      }
    } catch {
      // Local fallback
      const localItem: Teleconsultation = {
        id: `tele-${Date.now()}`,
        teleconsultNumber: `TELE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };
      setActiveTeleconsults((prev) => [localItem, ...prev]);
      setSuccessNotice(`Teleconsultation booked offline! Token: ${localItem.teleconsultNumber}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (item: Teleconsultation, newStatus: 'PAID' | 'PENDING') => {
    const newRef = newStatus === 'PAID' ? (item.paymentReference || `UPI-${Date.now().toString().slice(-6)}`) : undefined;
    try {
      await fetch(`/api/teleconsultations/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: newStatus,
          paymentReference: newRef,
          paymentMethod: newStatus === 'PAID' ? 'UPI_PHONEPE' : undefined,
        }),
      });
    } catch {
      // Ignore
    }

    setActiveTeleconsults((prev) =>
      prev.map((t) =>
        t.id === item.id ? { ...t, paymentStatus: newStatus, paymentReference: newRef } : t
      )
    );
  };

  const handleUpdateAvailability = async (item: Teleconsultation, newAvailability: PatientAvailabilityStatus) => {
    try {
      await fetch(`/api/teleconsultations/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientAvailability: newAvailability }),
      });
    } catch {
      // Ignore
    }

    setActiveTeleconsults((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, patientAvailability: newAvailability } : t))
    );
  };

  return (
    <section id="teleconsultation" className="py-16 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Video className="w-3.5 h-3.5 text-teal-700" />
            <span>Online Pediatric OPD • ఆన్‌లైన్ వైద్య సంప్రదింపులు</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pediatric Video &amp; Phone Teleconsultations
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Consult experienced pediatricians from home for fever monitoring, newborn care questions, minor coughs, growth follow-ups, and prescription renewals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Verified Pediatric Specialists</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>WhatsApp Video / Phone Call</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Ready Immediately or Scheduled</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Nominal ₹300 Fee (Pay Now or Later)</span>
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {successNotice && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-xs bg-white text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200 font-bold hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Teleconsultation Passes (if any exist) */}
        {activeTeleconsults.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Your Active Teleconsultations ({activeTeleconsults.length})</span>
              </h3>
              <button
                onClick={loadTeleconsultations}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeTeleconsults.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-teal-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                        {item.teleconsultNumber}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {item.childName} {item.childAge ? `(${item.childAge}y • ${item.childGender || 'Child'})` : ''}
                      </span>
                      <span className="text-xs text-slate-500">• Parent: {item.parentName} ({item.parentMobile})</span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                      <span>Doctor: <strong className="text-slate-800">{item.doctorName}</strong></span>
                      <span>• Channel: <strong>{item.preferredChannel === 'WHATSAPP_VIDEO' ? '📹 WhatsApp Video' : '📞 Phone Audio'}</strong></span>
                      <span>• Slot: <strong>{item.timeSlot}</strong></span>
                    </div>

                    <div className="text-[11px] text-slate-500 italic pt-0.5">
                      Symptoms: {item.symptoms || 'General consult'}
                    </div>
                  </div>

                  {/* Badges & Actions for Patient Availability and Payment */}
                  <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Patient Availability Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Patient Availability:</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          item.patientAvailability === 'AVAILABLE_NOW'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-sky-100 text-sky-900 border-sky-300'
                        }`}
                      >
                        {item.patientAvailability === 'AVAILABLE_NOW' ? '🟢 Available Right Now' : `📅 ${item.timeSlot}`}
                      </span>
                    </div>

                    {/* Payment Status Badge (Paid vs Not Paid) */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Payment Status:</span>
                      {item.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>PAID (₹{item.amount || 300})</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>PAYMENT PENDING (₹{item.amount || 300})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(item, 'PAID')}
                            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition cursor-pointer"
                            title="Click to record payment"
                          >
                            Mark as Paid
                          </button>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Helpline Connect */}
                    <a
                      href={`https://wa.me/919440112233?text=${encodeURIComponent(
                        `Hello Sri Devi Children Hospital, regarding my teleconsultation ${item.teleconsultNumber} for ${item.childName}. I am available and ready.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 mt-1"
                    >
                      <MessageSquare className="w-3 h-3 text-teal-600" />
                      <span>WhatsApp Helpdesk (+91 944 011 2233)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teleconsultation Booking Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-800 to-sky-900 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black">Book Online Teleconsultation</h3>
                <p className="text-teal-100 text-xs sm:text-sm mt-1">
                  Fill in patient details, specify your availability, and choose payment option.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center shrink-0">
                <div className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Consultation Fee</div>
                <div className="text-2xl font-black text-white">₹300</div>
                <div className="text-[10px] text-teal-200">Doctor Video / Call</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Step 1: Doctor Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Pediatrician / వైద్యుడిని ఎంచుకోండి
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.slice(0, 2).map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                      selectedDoctorId === doc.id
                        ? 'border-teal-600 bg-teal-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="doctor"
                      value={doc.id}
                      checked={selectedDoctorId === doc.id}
                      onChange={() => setSelectedDoctorId(doc.id)}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-extrabold text-sm text-slate-900">{doc.name}</div>
                      <div className="text-xs text-teal-700 font-semibold">{doc.specialty}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online OPD Available Today</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Patient Availability Status */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Patient Availability / మీరు ఎప్పుడు సంప్రదించగలరు?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPatientAvailability('AVAILABLE_NOW')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    patientAvailability === 'AVAILABLE_NOW'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Available Right Now</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Doctor will call within 15 minutes
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPatientAvailability('AVAILABLE_TODAY_SLOT')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    patientAvailability === 'AVAILABLE_TODAY_SLOT'
                      ? 'border-teal-500 bg-teal-50 text-teal-950 font-bold shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Today Evening Slot</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Select preferred evening time
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPatientAvailability('AVAILABLE_TOMORROW')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    patientAvailability === 'AVAILABLE_TOMORROW'
                      ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Tomorrow Morning</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Between 10:30 AM – 01:00 PM
                  </div>
                </button>
              </div>

              {/* Slot selector when scheduled */}
              {patientAvailability !== 'AVAILABLE_NOW' && (
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Preferred Slot:</span>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </select>
                </div>
              )}

              {/* Preferred Channel */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Consultation Channel:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="channel"
                    value="WHATSAPP_VIDEO"
                    checked={preferredChannel === 'WHATSAPP_VIDEO'}
                    onChange={() => setPreferredChannel('WHATSAPP_VIDEO')}
                    className="text-teal-600"
                  />
                  <span>📹 WhatsApp Video Call</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="channel"
                    value="PHONE_AUDIO"
                    checked={preferredChannel === 'PHONE_AUDIO'}
                    onChange={() => setPreferredChannel('PHONE_AUDIO')}
                    className="text-teal-600"
                  />
                  <span>📞 Regular Phone Call</span>
                </label>
              </div>
            </div>

            {/* Step 3: Patient Demographics */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Patient &amp; Parent Details / రోగి వివరాలు
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Child Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Aarav"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      placeholder="e.g. 3"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Gender
                    </label>
                    <select
                      value={childGender}
                      onChange={(e) => setChildGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    WhatsApp / Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={parentMobile}
                    onChange={(e) => setParentMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Reason for Consultation / Symptoms (లక్షణాలు)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fever since yesterday evening, mild dry cough, needs dosage advice"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Step 4: Payment Status (Paid vs Not Paid) */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border-2 border-teal-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span>4. Payment Status / చెల్లింపు స్థితి (₹300)</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200">
                  Flat Fee: ₹300
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Payment Paid */}
                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    paymentStatus === 'PAID'
                      ? 'border-emerald-500 bg-white shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="PAID"
                      checked={paymentStatus === 'PAID'}
                      onChange={() => setPaymentStatus('PAID')}
                      className="mt-1 text-emerald-600"
                    />
                    <div>
                      <div className="font-black text-xs text-emerald-950 flex items-center gap-1">
                        <span>Payment Paid / నేను చెల్లించాను</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Paid via PhonePe / Google Pay / UPI
                      </div>
                    </div>
                  </div>
                </label>

                {/* Option 2: Payment Pending */}
                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    paymentStatus === 'PENDING'
                      ? 'border-amber-500 bg-white shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="PENDING"
                      checked={paymentStatus === 'PENDING'}
                      onChange={() => setPaymentStatus('PENDING')}
                      className="mt-1 text-amber-600"
                    />
                    <div>
                      <div className="font-black text-xs text-amber-950 flex items-center gap-1">
                        <span>Payment Pending / తర్వాత చెల్లిస్తాము</span>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Pay during call confirmation / UPI later
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* If Paid, show quick UPI details */}
              {paymentStatus === 'PAID' && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-slate-800">
                      Hospital UPI ID: <strong className="text-teal-800 font-mono">sridevihospital@upi</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Hospital QR Code</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      UPI Reference / UTR Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 402819283712 or PhonePe TXN ID"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentStatus === 'PENDING' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                  ℹ️ <strong>Note:</strong> Your teleconsultation request will be registered immediately as <strong>Payment Pending</strong>. Reception will share the payment link via SMS/WhatsApp before the doctor dials in.
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Prefer an in-person hospital OPD visit?{' '}
                <button
                  type="button"
                  onClick={onBookInPerson}
                  className="font-bold text-teal-700 hover:underline"
                >
                  Book In-Person Clinic Slot
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>{loading ? 'Scheduling...' : 'Confirm Teleconsultation Request'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* UPI QR Code Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
              <h4 className="font-extrabold text-slate-900 text-base mb-1">Sri Devi Children Hospital</h4>
              <p className="text-xs text-slate-500 mb-4">Official Hospital Teleconsultation QR</p>

              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl border-2 border-teal-500 flex flex-col items-center justify-center p-2 mb-4">
                <QrCode className="w-32 h-32 text-slate-800" />
                <span className="text-[10px] font-mono font-bold text-teal-800 mt-1">sridevihospital@upi</span>
              </div>

              <div className="text-xs font-bold text-slate-800 mb-1">Fee: ₹300</div>
              <p className="text-[11px] text-slate-500 mb-4">
                Scan with PhonePe, Google Pay, or Paytm. Enter the generated UTR number into the booking form.
              </p>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
              >
                Close &amp; Return to Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
