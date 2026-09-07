import React, { useState, useEffect } from 'react';
import {
  Doctor,
  HospitalBranch,
  BranchId,
  Parent,
  SlotAvailability,
  Appointment,
} from '../types/index.js';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentUser: Parent | null;
  onOpenParentLogin: () => void;
  doctors: Doctor[];
  branches: HospitalBranch[];
  initialDoctorId?: string;
  initialBranchId?: BranchId;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  parentUser,
  onOpenParentLogin,
  doctors,
  branches,
  initialDoctorId,
  initialBranchId,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [newChildName, setNewChildName] = useState<string>('');
  const [showAddChildInput, setShowAddChildInput] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>(initialBranchId || 'kakinada');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || 'dr-subba-rao');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Set default child if parent is logged in
  useEffect(() => {
    if (parentUser && parentUser.children.length > 0 && !selectedChildId) {
      setSelectedChildId(parentUser.children[0].id);
    }
  }, [parentUser, selectedChildId]);

  // Update initial doctor/branch if passed
  useEffect(() => {
    if (initialDoctorId) setSelectedDoctorId(initialDoctorId);
    if (initialBranchId) setSelectedBranchId(initialBranchId);
  }, [initialDoctorId, initialBranchId]);

  // Fetch slots whenever doctor, branch, or date changes and we reach step 5
  useEffect(() => {
    if (step === 5 && selectedDoctorId && selectedBranchId && selectedDate) {
      fetchSlots();
    }
  }, [step, selectedDoctorId, selectedBranchId, selectedDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/slots?doctorId=${selectedDoctorId}&branchId=${selectedBranchId}&date=${selectedDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter out internal buffer slots from parent bookable view
        const parentSlots = data.filter((s) => !s.isBufferSlot);
        setSlots(parentSlots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      setErrorMsg('Could not load appointment slots. Please check connection.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddChildQuick = async () => {
    if (!newChildName.trim() || !parentUser) return;
    try {
      const res = await fetch(`/api/parents/${parentUser.id}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChildName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.child) {
        parentUser.children.push(data.child);
        setSelectedChildId(data.child.id);
        setNewChildName('');
        setShowAddChildInput(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBooking = async () => {
    if (!parentUser) {
      onOpenParentLogin();
      return;
    }
    if (!selectedChildId || !selectedDoctorId || !selectedBranchId || !selectedDate || !selectedTime) {
      setErrorMsg('Please complete all steps before confirming.');
      return;
    }

    setBookingLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentUser.id,
          childId: selectedChildId,
          doctorId: selectedDoctorId,
          branchId: selectedBranchId,
          date: selectedDate,
          bookedTime: selectedTime,
          bookingSource: 'ONLINE',
          advanceNoticePreferenceMinutes: 30,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to book appointment. Please try again.');
        setBookingLoading(false);
        return;
      }

      setConfirmedAppt(data.appointment);
      onBookingSuccess(data.appointment);
      setStep(6); // Confirmation screen
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen) return null;

  // Selected entities for display
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const currentBranch = branches.find((b) => b.id === selectedBranchId);
  const currentChild = parentUser?.children.find((c) => c.id === selectedChildId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-6 animate-in fade-in zoom-in-95">
        <button
          id="book-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Sri Devi Children Hospital • Exact Consultation Booking</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Book Pediatric Consultation
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Select your child, preferred doctor, and exact 15-minute consultation slot.
          </p>
        </div>

        {/* Progress Stepper (Steps 1-5) */}
        {step < 6 && (
          <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100 pb-3 overflow-x-auto">
            {[
              { num: 1, label: '1. Child' },
              { num: 2, label: '2. Location' },
              { num: 3, label: '3. Doctor' },
              { num: 4, label: '4. Date' },
              { num: 5, label: '5. Time Slot' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => s.num < step && setStep(s.num)}
                disabled={s.num > step}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  step === s.num
                    ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                    : step > s.num
                    ? 'text-teal-700 hover:bg-slate-50 cursor-pointer'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                {step > s.num ? '✓ ' : ''}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: Select Child */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Step 1: Select Your Child</h4>

            {!parentUser ? (
              <div className="p-6 rounded-2xl bg-sky-50 border border-sky-100 text-center space-y-3">
                <User className="w-8 h-8 text-sky-600 mx-auto" />
                <h5 className="font-bold text-slate-900 text-sm">Parent Sign In Required</h5>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Please sign in with your mobile number to select or add your child profile.
                </p>
                <button
                  id="book-step1-login-btn"
                  onClick={onOpenParentLogin}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition"
                >
                  Sign In with Mobile
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Select which child requires consultation:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parentUser.children.map((child) => (
                    <button
                      key={child.id}
                      id={`book-child-option-${child.id}`}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                        selectedChildId === child.id
                          ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{child.name}</div>
                        <div className="text-[11px] text-teal-700">Child ID: {child.id}</div>
                      </div>
                      {selectedChildId === child.id && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Add Child Quickly */}
                {showAddChildInput ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">Add Child Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Child's full name"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:border-teal-500"
                      />
                      <button
                        onClick={handleAddChildQuick}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Save Child
                      </button>
                      <button
                        onClick={() => setShowAddChildInput(false)}
                        className="px-3 py-2 text-slate-500 hover:bg-slate-200 rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddChildInput(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-semibold hover:underline pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add another child</span>
                  </button>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    id="book-step1-next-btn"
                    disabled={!selectedChildId}
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition"
                  >
                    <span>Proceed to Location</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Select Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Step 2: Select Hospital Branch</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((b) => (
                <button
                  key={b.id}
                  id={`book-branch-option-${b.id}`}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    selectedBranchId === b.id
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                      {b.id === 'kakinada' ? 'Main Hospital' : 'Clinical Branch'}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base">{b.name}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{b.address}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 font-medium">{b.phone}</span>
                    {selectedBranchId === b.id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                id="book-step2-next-btn"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <span>Proceed to Doctor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Doctor */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Step 3: Select Pediatric Doctor</h4>
            <div className="space-y-3">
              {(Array.isArray(doctors) ? doctors : [])
                .filter((d) => Array.isArray(d.branches) && d.branches.includes(selectedBranchId))
                .map((doctor) => (
                  <button
                    key={doctor.id}
                    id={`book-doctor-option-${doctor.id}`}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-4 ${
                      selectedDoctorId === doctor.id
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <img
                      src={doctor.photoUrl}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm sm:text-base">{doctor.name}</h5>
                        {doctor.id === 'dr-subba-rao' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                            Configured Days
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-700 font-medium">{doctor.specialty}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{doctor.experienceYears}+ years experience</p>
                    </div>
                    {selectedDoctorId === doctor.id && (
                      <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
                    )}
                  </button>
                ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                id="book-step3-next-btn"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <span>Select Date</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Select Date */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Step 4: Select Consultation Date</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  id="book-date-input"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 flex items-start gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Consulting slots are automatically populated according to Dr. {currentDoctor?.name}’s clinical session schedule.
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                id="book-step4-next-btn"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <span>View Available Slots</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Select Exact Time Slot */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Step 5: Select Exact Consultation Slot</h4>
              <span className="text-[11px] font-medium text-slate-500">15-minute intervals</span>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading available consultation slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-600 space-y-2">
                <p>No available consultation slots for this doctor on the selected date.</p>
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold"
                >
                  Choose Another Date
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    const isAvailable = slot.available;

                    return (
                      <button
                        key={slot.time}
                        id={`slot-btn-${slot.time.replace(':', '-')}`}
                        disabled={!isAvailable}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-2.5 rounded-xl text-xs font-semibold transition text-center ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600 ring-offset-1'
                            : isAvailable
                            ? 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border border-teal-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 line-through opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div>{slot.time}</div>
                        <div className="text-[9px] font-normal opacity-80 mt-0.5">
                          {isAvailable ? 'Available' : 'Booked'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>Selected Time: <strong className="text-slate-900">{selectedTime || 'None'}</strong></span>
                  {selectedTime && (
                    <span className="text-[11px] text-amber-800 font-medium">
                      Recommended hospital arrival: 15 mins early
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                id="book-step5-confirm-btn"
                disabled={!selectedTime || bookingLoading}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <span>{bookingLoading ? 'Securing Slot...' : 'Confirm Appointment'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Confirmation Screen */}
        {step === 6 && confirmedAppt && (
          <div className="space-y-6 py-2 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 mx-auto sm:mx-0 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Appointment Confirmed
              </span>
              <h4 className="text-2xl font-bold text-slate-900 mt-0.5">
                Token #{confirmedAppt.appointmentNumber}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your consultation slot has been reserved. You can now monitor the live queue from home!
              </p>
            </div>

            {/* Confirmation Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Child Name:</span>
                  <strong className="text-slate-900 text-sm">{confirmedAppt.childName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Doctor:</span>
                  <strong className="text-slate-900 text-sm">{confirmedAppt.doctorName}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Hospital Location:</span>
                  <strong className="text-slate-900">{confirmedAppt.branchName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date:</span>
                  <strong className="text-slate-900">{confirmedAppt.date}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-950">
                <div>
                  <span className="text-[11px] text-teal-700 block font-medium">Booked Appointment Time:</span>
                  <span className="text-base font-bold text-slate-900 font-mono">{confirmedAppt.bookedTime}</span>
                </div>
                <div>
                  <span className="text-[11px] text-teal-700 block font-medium">Please Reach Hospital By:</span>
                  <span className="text-base font-bold text-teal-900 font-mono">
                    {confirmedAppt.recommendedArrivalTime}
                  </span>
                  <span className="text-[10px] text-teal-700 block mt-0.5">(15 mins before consultation)</span>
                </div>
              </div>
            </div>

            {/* Next Steps Guidance */}
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-900 space-y-1">
              <span className="font-bold block">Hospital Instructions:</span>
              <p>
                You do not need to arrive hours in advance. Monitor your live tracking card from home. Reception will collect the consultation fee upon your physical arrival.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                id="book-modal-view-tracker-btn"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
              >
                <span>View in Live Queue Tracker</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
