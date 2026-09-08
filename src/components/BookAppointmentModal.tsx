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
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar as CalendarIcon,
  Phone,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Check,
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
  onBookingSuccess: (appointment: Appointment, parent?: Parent) => void;
  onViewDashboard?: () => void;
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
  onViewDashboard,
}) => {
  // Selection states (with smart defaults for 1-click experience)
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>(initialBranchId || 'kakinada');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || 'dr-subba-rao');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Patient details state
  const [childName, setChildName] = useState<string>('');
  const [parentMobile, setParentMobile] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Slots & network state
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Track previous open state so parentUser updates don't wipe out confirmedAppt
  const prevIsOpenRef = React.useRef(false);

  // Date calculation helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Reset or pre-fill ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setErrorMsg('');
      setConfirmedAppt(null);
      setBookingLoading(false);

      if (initialDoctorId) setSelectedDoctorId(initialDoctorId);
      if (initialBranchId) setSelectedBranchId(initialBranchId);

      if (parentUser) {
        setParentMobile(parentUser.mobile);
        setParentName(parentUser.name);
        if (parentUser.children && parentUser.children.length > 0) {
          setSelectedChildId(parentUser.children[0].id);
          setChildName(parentUser.children[0].name);
        } else {
          setSelectedChildId('');
          setChildName('');
        }
      } else {
        setSelectedChildId('');
        // Keep entered child/mobile if any, or leave clean
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, parentUser, initialDoctorId, initialBranchId]);

  // Load available slots whenever doctor, branch, or date changes
  useEffect(() => {
    if (isOpen && selectedDoctorId && selectedBranchId && selectedDate) {
      loadSlots();
    }
  }, [isOpen, selectedDoctorId, selectedBranchId, selectedDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/slots?doctorId=${selectedDoctorId}&branchId=${selectedBranchId}&date=${selectedDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        // Exclude internal buffer slots from patient view
        const availableSlots = data.filter((s) => !s.isBufferSlot);
        setSlots(availableSlots);

        // Auto-select first available slot if previous selection is not in list
        const stillValid = availableSlots.some((s) => s.time === selectedTime && s.available);
        if (!stillValid) {
          const firstAvail = availableSlots.find((s) => s.available);
          if (firstAvail) {
            setSelectedTime(firstAvail.time);
          } else {
            setSelectedTime('');
          }
        }
      } else {
        setSlots([]);
        setSelectedTime('');
      }
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleModalClose = () => {
    prevIsOpenRef.current = false;
    setConfirmedAppt(null);
    setErrorMsg('');
    setBookingLoading(false);
    onClose();
  };

  const handleQuickBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const effectiveChildName = childName.trim();
    const effectiveMobile = parentMobile.trim().replace(/\D/g, '');

    if (!effectiveChildName) {
      setErrorMsg('Please enter your child’s name.');
      return;
    }

    if (!effectiveMobile || effectiveMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!selectedTime) {
      setErrorMsg('Please tap an available time slot for your appointment.');
      return;
    }

    setBookingLoading(true);

    try {
      const payload: any = {
        doctorId: selectedDoctorId,
        branchId: selectedBranchId,
        date: selectedDate,
        bookedTime: selectedTime,
        childName: effectiveChildName,
        parentMobile: effectiveMobile,
        parentName: parentName.trim() || effectiveChildName + ' Guardian',
        bookingSource: 'ONLINE',
      };

      if (parentUser && parentUser.id) {
        payload.parentId = parentUser.id;
        if (selectedChildId) {
          payload.childId = selectedChildId;
        }
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Could not complete booking. Please try another slot.');
        setBookingLoading(false);
        return;
      }

      setConfirmedAppt(data.appointment);
      onBookingSuccess(data.appointment, data.parent);
    } catch (err) {
      setErrorMsg('Connection problem. Please check internet and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen) return null;

  // Selected entities for display
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Group slots into Morning and Evening for easy mobile browsing
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 14;
  });

  const eveningSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 14;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Sticky Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              🏥
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Quick Appointment Booking
              </h3>
              <p className="text-[11px] text-teal-700 font-medium">
                Sri Devi Children Hospital • No password needed
              </p>
            </div>
          </div>

          <button
            id="book-modal-close-btn"
            onClick={handleModalClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= SUCCESS CONFIRMATION SCREEN ================= */}
        {confirmedAppt ? (
          <div className="overflow-y-auto space-y-5 py-2 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Prominent confirmation banner requested by user */}
            <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-4 sm:p-5 text-emerald-950 space-y-2 shadow-xs text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 inline-block">
                ✓ Appointment Fixed Successfully
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-900 leading-snug">
                Your appointment was confirmed with <span className="text-teal-800 underline decoration-teal-600">{confirmedAppt.doctorName}</span> at <span className="text-teal-800 underline decoration-teal-600">{confirmedAppt.bookedTime}</span> on <span className="text-teal-800 underline decoration-teal-600">{confirmedAppt.date}</span>.
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                Child: <strong>{confirmedAppt.childName}</strong> • Hospital: <strong>{confirmedAppt.branchName}</strong>
              </p>
            </div>

            <div>
              <div className="text-xs text-slate-500 font-medium">Assigned Consultation Token:</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-teal-900 font-mono tracking-tight">
                #{confirmedAppt.appointmentNumber}
              </div>
            </div>

            {/* Ticket Card */}
            <div className="bg-gradient-to-b from-teal-50/90 to-sky-50/90 rounded-2xl p-4 sm:p-5 border border-teal-200/80 text-left space-y-3 shadow-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-teal-200/60">
                <div>
                  <span className="text-[11px] text-slate-500 block">Child Patient:</span>
                  <strong className="text-slate-900 text-sm">{confirmedAppt.childName}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Doctor:</span>
                  <strong className="text-slate-900 text-sm">{confirmedAppt.doctorName}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-teal-200/60">
                <div>
                  <span className="text-[11px] text-slate-500 block">Hospital Location:</span>
                  <strong className="text-slate-900 text-xs">{confirmedAppt.branchName}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Date of Visit:</span>
                  <strong className="text-teal-900 text-xs font-bold">{confirmedAppt.date}</strong>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Booked Consultation:</span>
                  <span className="text-base font-bold text-slate-900 font-mono">{confirmedAppt.bookedTime}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-teal-700 uppercase font-bold block">Reach Hospital By:</span>
                  <span className="text-base font-bold text-teal-900 font-mono">{confirmedAppt.recommendedArrivalTime}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              💬 <strong>No need to rush early!</strong> You can track live doctor delays &amp; queue status directly from your parent portal at home. Reception fee is collected when you arrive physically.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                id="confirmed-view-queue-btn"
                onClick={() => {
                  handleModalClose();
                  if (onViewDashboard) {
                    onViewDashboard();
                  }
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer transition"
              >
                <span>Done • View My Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setConfirmedAppt(null);
                  setSelectedTime('');
                }}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition"
              >
                Book Another Child
              </button>
            </div>
          </div>
        ) : (
          /* ================= SINGLE-PAGE EASY BOOKING FORM ================= */
          <form onSubmit={handleQuickBook} className="overflow-y-auto space-y-4 pr-1">

            {/* 1. HOSPITAL LOCATION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>1. Select Hospital Branch</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {branches.map((b) => {
                  const isSelected = selectedBranchId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      id={`quick-branch-${b.id}`}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {b.id === 'kakinada' ? '📍 Kakinada' : '📍 Pithapuram'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {b.id === 'kakinada' ? 'Main Hospital (24/7)' : 'Clinical Branch'}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. DOCTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>2. Select Pediatric Doctor</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      id={`quick-doc-${doc.id}`}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <img
                        src={doc.photoUrl}
                        alt={doc.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {doc.name.replace('Dr. Subba Rao Vadarevu', 'Dr. Subba Rao')}
                        </div>
                        <div className="text-[10px] text-teal-700 truncate">
                          {doc.specialty}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. DATE OF VISIT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>3. When do you want to come?</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="quick-date-today"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-center ${
                    selectedDate === todayStr
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div>📅 Today</div>
                  <div className="text-[10px] opacity-80 font-normal">{todayStr}</div>
                </button>

                <button
                  type="button"
                  id="quick-date-tomorrow"
                  onClick={() => setSelectedDate(tomorrowStr)}
                  className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-center ${
                    selectedDate === tomorrowStr
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div>📅 Tomorrow</div>
                  <div className="text-[10px] opacity-80 font-normal">{tomorrowStr}</div>
                </button>

                <div className="flex-1 min-w-[130px] flex items-center">
                  <input
                    id="quick-custom-date"
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. TIME SLOT SELECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>4. Choose Time Slot</span>
                </label>
                {selectedTime && (
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Selected: {selectedTime}
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse">
                  Checking doctor slots...
                </div>
              ) : slots.length === 0 ? (
                <div className="p-4 text-center text-xs text-amber-800 bg-amber-50 rounded-2xl border border-amber-200">
                  Doctor has no regular clinic session on this date. Please pick another date or doctor above.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {morningSlots.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        ☀️ Morning Session (10:00 AM – 01:00 PM)
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {morningSlots.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs scale-102 ring-2 ring-teal-600/30'
                                  : slot.available
                                  ? 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200'
                                  : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50 line-through'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {eveningSlots.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        🌅 Evening Session (05:00 PM – 08:00 PM)
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {eveningSlots.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs scale-102 ring-2 ring-teal-600/30'
                                  : slot.available
                                  ? 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200'
                                  : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50 line-through'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. PATIENT DETAILS (Very simple & accessible) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  👶 5. Patient &amp; Mobile Number
                </span>

                {parentUser && (
                  <button
                    type="button"
                    onClick={onOpenParentLogin}
                    className="text-[11px] text-teal-700 font-semibold underline cursor-pointer"
                  >
                    Switch Phone
                  </button>
                )}
              </div>

              {/* If logged in with children, show quick tap chips */}
              {parentUser && parentUser.children && parentUser.children.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">Tap registered child:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parentUser.children.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedChildId(c.id);
                          setChildName(c.name);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          childName === c.name
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        👶 {c.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChildId('');
                        setChildName('');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                        !selectedChildId && childName === ''
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-dashed border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      + New Child
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Child Name *
                  </label>
                  <input
                    id="quick-child-name"
                    type="text"
                    required
                    placeholder="e.g. Aarav, Veeransh"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    WhatsApp / Mobile Number *
                  </label>
                  <input
                    id="quick-mobile-number"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={parentMobile}
                    onChange={(e) => setParentMobile(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {!parentUser && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Parent / Guardian Name (Optional)
                  </label>
                  <input
                    id="quick-parent-name"
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
              {/* Error message displayed at bottom near submit button so user instantly spots it */}
              {errorMsg && (
                <div
                  id="quick-book-error-banner"
                  className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <div className="font-bold leading-relaxed">
                    {errorMsg}
                  </div>
                </div>
              )}

              <button
                id="quick-book-submit-btn"
                type="submit"
                disabled={bookingLoading || !selectedTime || !childName.trim() || !parentMobile.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 cursor-pointer transition active:scale-98"
              >
                <span>
                  {bookingLoading
                    ? 'Securing Consultation Token...'
                    : `Confirm & Get Token ${selectedTime ? `(${selectedTime})` : ''} ➔`}
                </span>
              </button>

              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400">
                  Instant Token • Live Queue Tracking from Home • Free Rescheduling
                </span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
