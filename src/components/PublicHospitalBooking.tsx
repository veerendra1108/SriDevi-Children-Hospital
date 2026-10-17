import React, { useState, useEffect } from 'react';
import {
  Building,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Phone,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Hospital, Doctor, DoctorSchedule, HospitalBranch, SlotAvailability } from '../types/index.js';

interface PublicHospitalBookingProps {
  hospitalSlug: string;
  onOpenTracker?: (appointmentId: string, mobile: string) => void;
  onBackToHome?: () => void;
}

export const PublicHospitalBooking: React.FC<PublicHospitalBookingProps> = ({
  hospitalSlug,
  onOpenTracker,
  onBackToHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<{
    hospital: Hospital;
    doctors: Doctor[];
    branches: HospitalBranch[];
    schedules: DoctorSchedule[];
  } | null>(null);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success Confirmation State
  const [confirmedAppt, setConfirmedAppt] = useState<{
    appointmentNumber: string;
    doctorName: string;
    date: string;
    bookedTime: string;
    trackerUrl: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Fetch Hospital by slug
  useEffect(() => {
    const fetchHospital = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/hospitals/${hospitalSlug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Hospital not found.');
        setHospitalInfo(data);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load hospital booking page.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [hospitalSlug]);

  // Fetch Available Slots
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate || !hospitalInfo) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      try {
        const doc = hospitalInfo.doctors.find((d) => d.id === selectedDoctorId);
        const branchId = doc?.branches[0] || hospitalInfo.branches[0]?.id || 'main';
        const res = await fetch(
          `/api/slots?doctorId=${selectedDoctorId}&branchId=${branchId}&date=${selectedDate}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(Array.isArray(data) ? data : []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, selectedDate, hospitalInfo]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedSlot) {
      alert('Please choose an available appointment slot.');
      return;
    }

    setSubmitting(true);
    try {
      const doc = hospitalInfo?.doctors.find((d) => d.id === selectedDoctorId);
      const branchId = doc?.branches[0] || hospitalInfo?.branches[0]?.id || 'main';

      const res = await fetch('/api/appointments/online-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospitalInfo?.hospital.id,
          doctorId: selectedDoctorId,
          branchId,
          date: selectedDate,
          bookedTime: selectedSlot,
          patientName: patientName.trim(),
          mobileNumber: mobileNumber.trim(),
          patientAge: patientAge ? Number(patientAge) : undefined,
          guardianName: guardianName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete booking.');

      setConfirmedAppt({
        appointmentNumber: data.token,
        doctorName: doc?.name || 'Consultant Doctor',
        date: selectedDate,
        bookedTime: selectedSlot,
        trackerUrl: data.trackerUrl,
      });
    } catch (err: any) {
      alert(err.message || 'Error booking appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Building className="w-10 h-10 text-teal-600 animate-pulse mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading Hospital Booking Page...</p>
      </div>
    );
  }

  if (error || !hospitalInfo) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800">Hospital Page Not Found</h3>
        <p className="text-sm text-slate-500">{error || 'Please check the hospital address.'}</p>
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
          >
            Go to Doctormate Directory
          </button>
        )}
      </div>
    );
  }

  const selectedDoctor = hospitalInfo.doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Hospital Branding Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-bold mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>{hospitalInfo.hospital.hospitalType}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {hospitalInfo.hospital.name}
          </h1>
          <p className="text-xs text-teal-100 mt-1">
            {hospitalInfo.hospital.city}, {hospitalInfo.hospital.state} • Phone:{' '}
            {hospitalInfo.hospital.phone}
          </p>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex-shrink-0"
          >
            Back to Directory
          </button>
        )}
      </div>

      {confirmedAppt ? (
        /* Confirmation Screen */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Appointment Confirmed
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              Token Number: {confirmedAppt.appointmentNumber}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Your appointment with {confirmedAppt.doctorName} is confirmed for {confirmedAppt.date} at {confirmedAppt.bookedTime}.
            </p>
          </div>

          <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Track Your Live OPD Queue Position</span>
            </div>
            <p className="text-xs text-teal-700">
              Check live doctor delays, patients ahead, and recommended arrival time from your phone.
            </p>
            {onOpenTracker && (
              <button
                onClick={() => onOpenTracker(confirmedAppt.appointmentNumber, mobileNumber)}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                <span>Track Appointment Live</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Booking Form */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Book Patient Appointment Online</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your doctor, convenient date, and slot to reserve your queue token.
            </p>
          </div>

          <form onSubmit={handleSubmitBooking} className="space-y-6">
            {/* Doctor Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Consultation Doctor
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hospitalInfo.doctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                          <p className="text-xs text-teal-700 font-medium">{doc.specialty}</p>
                          <span className="inline-block mt-2 text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                            {doc.slotDurationMinutes || 15} Min Slots
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          ₹{doc.consultationFee || 500}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date & Slot Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Slot
                  </label>
                  {selectedDoctor && (
                    <span className="text-xs text-teal-700 font-semibold">
                      {selectedDoctor.slotDurationMinutes || 15} min interval
                    </span>
                  )}
                </div>

                {loadingSlots ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Loading slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center text-xs text-amber-700 bg-amber-50 rounded-xl">
                    No open slots on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {slots.map((s) => {
                      const isAvailable = s.available;
                      const isSelected = selectedSlot === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(s.time)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md'
                              : isAvailable
                              ? 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                              : 'bg-slate-100 border border-transparent text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Patient Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Patient Full Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Age (Years)"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="10-Digit Mobile Number"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Guardian Name (Optional)"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <span>Reserving Slot...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
