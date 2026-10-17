import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  AlertCircle,
  Search,
  Sparkles,
  ShieldCheck,
  Building,
  UserCheck,
} from 'lucide-react';
import { Doctor, SlotAvailability } from '../types/index.js';

interface TelephoneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  hospitalName?: string;
  doctors: Doctor[];
  selectedDoctorId?: string;
  onBookingSuccess: () => void;
}

export const TelephoneBookingModal: React.FC<TelephoneBookingModalProps> = ({
  isOpen,
  onClose,
  hospitalId,
  hospitalName = 'Doctormate Hospital',
  doctors,
  selectedDoctorId,
  onBookingSuccess,
}) => {
  const [bookingSource, setBookingSource] = useState<'PHONE' | 'WALK_IN' | 'OTHER'>('PHONE');
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [doctorId, setDoctorId] = useState(selectedDoctorId || doctors[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing patient matching state
  const [existingMatch, setExistingMatch] = useState<{ id: string; name: string; age?: number } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Success confirmation state
  const [confirmedBooking, setConfirmedBooking] = useState<{
    appointmentNumber: string;
    patientName: string;
    doctorName: string;
    bookedTime: string;
    date: string;
    trackerUrl: string;
    confirmationText: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedDoctorId) {
      setDoctorId(selectedDoctorId);
    } else if (doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [selectedDoctorId, doctors]);

  // Fetch slots whenever doctor, date or hospitalId changes
  useEffect(() => {
    if (!doctorId || !date) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      try {
        const doctor = doctors.find((d) => d.id === doctorId);
        const branchId = doctor?.branches[0] || 'main';
        const res = await fetch(`/api/slots?doctorId=${doctorId}&branchId=${branchId}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(Array.isArray(data) ? data : []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [doctorId, date, doctors]);

  // Check existing patient phone matching (without forced auto-merging)
  useEffect(() => {
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      setCheckingExisting(true);
      fetch(`/api/parents/search?q=${encodeURIComponent(cleanPhone)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const firstParent = data[0];
            const firstChild = firstParent.children?.[0];
            setExistingMatch({
              id: firstChild?.id || firstParent.id,
              name: firstChild?.name || firstParent.name,
              age: firstChild?.ageYears,
            });
          } else {
            setExistingMatch(null);
          }
        })
        .catch(() => setExistingMatch(null))
        .finally(() => setCheckingExisting(false));
    } else {
      setExistingMatch(null);
    }
  }, [mobileNumber]);

  const handleApplyMatch = () => {
    if (existingMatch) {
      setPatientName(existingMatch.name);
      if (existingMatch.age) setPatientAge(String(existingMatch.age));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientName.trim()) {
      setError('Please enter patient name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select an available consultation slot.');
      return;
    }

    setSubmitting(true);
    try {
      const doctor = doctors.find((d) => d.id === doctorId);
      const branchId = doctor?.branches[0] || 'main';

      const res = await fetch('/api/reception/phone-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          patientName: patientName.trim(),
          mobileNumber: mobileNumber.trim(),
          patientAge: patientAge ? Number(patientAge) : undefined,
          guardianName: guardianName.trim() || undefined,
          doctorId,
          branchId,
          date,
          bookedTime: selectedSlot,
          bookingSource,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking.');
      }

      setConfirmedBooking({
        appointmentNumber: data.token,
        patientName: patientName.trim(),
        doctorName: doctor?.name || 'Assigned Doctor',
        bookedTime: selectedSlot,
        date,
        trackerUrl: data.trackerUrl,
        confirmationText: data.confirmationText,
      });

      onBookingSuccess();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyConfirmation = () => {
    if (confirmedBooking?.confirmationText) {
      navigator.clipboard.writeText(confirmedBooking.confirmationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    setPatientName('');
    setMobileNumber('');
    setPatientAge('');
    setGuardianName('');
    setSelectedSlot('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentDoctor = doctors.find((d) => d.id === doctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">New Staff-Assisted Booking</h3>
              <p className="text-xs text-teal-100 font-medium">
                {hospitalName} • Live Smart OPD Engine
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  Booking Confirmed
                </span>
                <h4 className="text-2xl font-extrabold text-slate-800">
                  Token: {confirmedBooking.appointmentNumber}
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Successfully allocated to {confirmedBooking.doctorName}'s live queue
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.patientName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold text-teal-700">{confirmedBooking.doctorName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.date} at {confirmedBooking.bookedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Source:</span>
                  <span className="font-semibold text-indigo-600 uppercase">{bookingSource}</span>
                </div>
              </div>

              {/* Share & Copy Tracker Link */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-teal-800 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Secure Patient Tracker Ready</span>
                </div>
                <p className="text-xs text-teal-700">
                  Provide this booking details or tracking link to the patient over call or SMS.
                </p>
                <button
                  type="button"
                  onClick={handleCopyConfirmation}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-all shadow"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Booking Details & Tracker'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Booking Source Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Booking Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'PHONE', label: 'Telephone Call', icon: Phone },
                    { key: 'WALK_IN', label: 'Walk-In Desk', icon: User },
                    { key: 'OTHER', label: 'Staff Assisted', icon: Building },
                  ].map((src) => {
                    const Icon = src.icon;
                    const active = bookingSource === src.key;
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => setBookingSource(src.key as any)}
                        className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          active
                            ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Phone & Matching Workflow */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                    required
                  />
                  {checkingExisting && (
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                      Searching records...
                    </span>
                  )}
                </div>

                {/* Match Banner if authorized record found */}
                {existingMatch && (
                  <div className="mt-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs text-sky-800 animate-fadeIn">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>
                        Found existing record: <strong>{existingMatch.name}</strong>
                        {existingMatch.age ? ` (${existingMatch.age} yrs)` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyMatch}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium text-[11px] transition-colors"
                    >
                      Use Details
                    </button>
                  </div>
                )}
              </div>

              {/* Patient Name, Age & Guardian Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Aarav Kumar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 5"
                    min={0}
                    max={120}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent / Guardian Name (Optional)
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                />
              </div>

              {/* Doctor & Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Doctor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium bg-white"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty} • {d.slotDurationMinutes || 15}m slots)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium bg-white"
                    required
                  />
                </div>
              </div>

              {/* Available Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Slot <span className="text-rose-500">*</span>
                  </label>
                  {currentDoctor && (
                    <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                      Doctor slot length: {currentDoctor.slotDurationMinutes || 15} mins
                    </span>
                  )}
                </div>

                {loadingSlots ? (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    Calculating available slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                    No available consultation slots for this doctor on the selected date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {slots.map((slot) => {
                      const isAvailable = slot.available;
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md'
                              : isAvailable
                              ? 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                              : 'bg-slate-100 border border-transparent text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>Allocating Token...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm & Generate Token</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
