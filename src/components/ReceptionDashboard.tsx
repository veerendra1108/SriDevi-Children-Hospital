import React, { useState, useEffect } from 'react';
import {
  Appointment,
  Doctor,
  DoctorSession,
  HospitalBranch,
  BranchId,
  SystemConfiguration,
} from '../types/index.js';
import {
  ShieldCheck,
  Building,
  User,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
  PhoneCall,
  Search,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  X,
  ChevronRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';

interface ReceptionDashboardProps {
  receptionUser: { username: string; branchId: BranchId; name: string };
  doctors: Doctor[];
  branches: HospitalBranch[];
  config: SystemConfiguration;
  onLogout: () => void;
  onOpenAnalytics: () => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  receptionUser,
  doctors,
  branches,
  config,
  onLogout,
  onOpenAnalytics,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>(receptionUser.branchId);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('dr-subba-rao');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showPhoneBookingModal, setShowPhoneBookingModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState<Appointment | null>(null);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  // Phone booking form state
  const [parentMobileSearch, setParentMobileSearch] = useState('');
  const [foundParent, setFoundParent] = useState<any>(null);
  const [newParentName, setNewParentName] = useState('');
  const [newParentChild, setNewParentChild] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [phoneBookingDate, setPhoneBookingDate] = useState(config.simulatedDate);
  const [phoneBookingDoctor, setPhoneBookingDoctor] = useState('dr-subba-rao');
  const [phoneSlots, setPhoneSlots] = useState<any[]>([]);
  const [selectedPhoneSlot, setSelectedPhoneSlot] = useState('');

  // Emergency form state
  const [emergencyChildName, setEmergencyChildName] = useState('');
  const [emergencyParentName, setEmergencyParentName] = useState('');
  const [emergencyParentMobile, setEmergencyParentMobile] = useState('');

  // Reassign form state
  const [reassignTime, setReassignTime] = useState('');

  // Cancel session form state
  const [cancelReason, setCancelReason] = useState('Emergency clinical contingency');

  // Load live queue
  useEffect(() => {
    fetchLiveQueue();
    const interval = setInterval(fetchLiveQueue, 10000);
    return () => clearInterval(interval);
  }, [selectedBranchId, selectedDoctorId, config.simulatedTime]);

  const fetchLiveQueue = async () => {
    try {
      const res = await fetch(
        `/api/queue/live?doctorId=${selectedDoctorId}&branchId=${selectedBranchId}&date=${config.simulatedDate}`
      );
      const data = await res.json();
      setQueueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  // Queue actions
  const handleCheckInPayment = async (apptId: string) => {
    try {
      const res = await fetch('/api/reception/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Payment received & patient checked in to active queue.');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToDoctor = async (apptId: string) => {
    try {
      const res = await fetch('/api/reception/send-to-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Patient sent into consultation room with doctor.');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteConsultation = async (apptId: string) => {
    try {
      const res = await fetch('/api/reception/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Consultation marked completed. Next patient ready.');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkLate = async (apptId: string) => {
    try {
      const res = await fetch('/api/reception/mark-late', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Patient marked late. Position can be reassigned on arrival.');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassignSubmit = async () => {
    if (!showReassignModal) return;
    try {
      const res = await fetch('/api/reception/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: showReassignModal.id,
          newExpectedTime: reassignTime || 'Next available',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Patient assigned to active consultation queue.');
        setShowReassignModal(null);
        setReassignTime('');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNoShow = async (apptId: string) => {
    try {
      const res = await fetch('/api/reception/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Slot released. Reassuring notification sent to parent.');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencySubmit = async () => {
    if (!emergencyChildName.trim()) return;
    try {
      const res = await fetch('/api/reception/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          branchId: selectedBranchId,
          childName: emergencyChildName.trim(),
          parentName: emergencyParentName.trim() || 'Emergency Attendant',
          parentMobile: emergencyParentMobile.trim() || '9999999999',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Emergency patient inserted. Buffer capacity utilized.');
        setShowEmergencyModal(false);
        setEmergencyChildName('');
        setEmergencyParentName('');
        setEmergencyParentMobile('');
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSessionSubmit = async () => {
    try {
      const res = await fetch('/api/reception/cancel-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          branchId: selectedBranchId,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Doctor session cancelled. ${data.affectedCount} parents notified.`);
        setShowCancelSessionModal(false);
        fetchLiveQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Telephone booking helpers
  const handleSearchParent = async () => {
    if (!parentMobileSearch.trim()) return;
    try {
      const res = await fetch(`/api/parents/search?mobile=${parentMobileSearch.trim()}`);
      const data = await res.json();
      if (res.ok && data.id) {
        setFoundParent(data);
        if (data.children.length > 0) {
          setSelectedChildId(data.children[0].id);
        }
      } else {
        setFoundParent(null);
      }
    } catch (err) {
      setFoundParent(null);
    }
  };

  const handleLoadPhoneSlots = async () => {
    try {
      const res = await fetch(
        `/api/slots?doctorId=${phoneBookingDoctor}&branchId=${selectedBranchId}&date=${phoneBookingDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setPhoneSlots(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePhoneBooking = async () => {
    let parentId = foundParent?.id;
    let childId = selectedChildId;

    try {
      // If parent doesn't exist, create parent + child first
      if (!foundParent) {
        if (!newParentName || !parentMobileSearch || !newParentChild) return;
        const resP = await fetch('/api/parents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newParentName,
            mobile: parentMobileSearch,
            childName: newParentChild,
          }),
        });
        const dataP = await resP.json();
        parentId = dataP.parent.id;
        childId = dataP.parent.children[0].id;
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          childId,
          doctorId: phoneBookingDoctor,
          branchId: selectedBranchId,
          date: phoneBookingDate,
          bookedTime: selectedPhoneSlot,
          bookingSource: 'RECEPTION_PHONE',
          advanceNoticePreferenceMinutes: 30,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Telephone appointment created successfully with reserved priority!');
        setShowPhoneBookingModal(false);
        setParentMobileSearch('');
        setFoundParent(null);
        setSelectedPhoneSlot('');
        fetchLiveQueue();
      } else {
        showToast(data.message || 'Booking conflict');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const session = queueData?.session as DoctorSession | undefined;
  const currentPatient = queueData?.currentPatient as Appointment | undefined;
  const nextPatient = queueData?.nextPatient as Appointment | undefined;
  const appointments = (queueData?.appointments as Appointment[]) || [];

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast Alert */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-teal-800 text-white font-medium text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top-3">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-teal-200 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Reception Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Hospital Reception Console
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Logged in as <strong className="text-slate-800">{receptionUser.name}</strong> • Simulated Time:{' '}
              <span className="font-mono font-bold text-teal-800">{config.simulatedTime}</span> ({config.simulatedDate})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Branch Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              <button
                id="rec-branch-kakinada"
                onClick={() => setSelectedBranchId('kakinada')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  selectedBranchId === 'kakinada'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kakinada Branch
              </button>
              <button
                id="rec-branch-pithapuram"
                onClick={() => setSelectedBranchId('pithapuram')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  selectedBranchId === 'pithapuram'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pithapuram Branch
              </button>
            </div>

            {/* Quick Actions */}
            <button
              id="rec-phone-booking-btn"
              onClick={() => {
                setShowPhoneBookingModal(true);
                handleLoadPhoneSlots();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Create Phone Booking</span>
            </button>

            <button
              id="rec-emergency-btn"
              onClick={() => setShowEmergencyModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Emergency Adjustment</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Operational Analytics"
            >
              <TrendingUp className="w-4 h-4" />
            </button>

            <button
              onClick={fetchLiveQueue}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
              title="Logout Reception"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor Switcher Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              id={`rec-doc-pill-${doc.id}`}
              onClick={() => setSelectedDoctorId(doc.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                selectedDoctorId === doc.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <img
                src={doc.photoUrl}
                alt={doc.name}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span>{doc.name}</span>
              {doc.id === 'dr-subba-rao' && (
                <span className="text-[10px] opacity-80">(Configured Days)</span>
              )}
            </button>
          ))}
        </div>

        {/* Doctor Live Metrics Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Doctor Live Operational Card
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {doctors.find((d) => d.id === selectedDoctorId)?.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="rec-cancel-session-btn"
                onClick={() => setShowCancelSessionModal(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
              >
                Hospital Session Cancellation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 block">Scheduled Start:</span>
              <strong className="text-slate-900 text-sm font-mono">
                {session?.scheduledStart || '10:00'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 block">Actual Start:</span>
              <strong className="text-slate-900 text-sm font-mono">
                {session?.actualStart || 'Not started'}
              </strong>
            </div>

            <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200">
              <span className="text-[11px] text-teal-700 block">Current Delay:</span>
              <strong className="text-teal-900 text-sm font-mono">
                {session ? `${session.currentDelayMinutes} min` : '0 min'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 block">Waiting:</span>
              <strong className="text-slate-900 text-sm font-mono">
                {queueData?.waitingCount || 0}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 block">Remaining:</span>
              <strong className="text-slate-900 text-sm font-mono">
                {queueData?.remainingCount || 0}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 block">Avg Duration:</span>
              <strong className="text-slate-900 text-sm font-mono">
                {session?.avgConsultationDurationMinutes || 14} min
              </strong>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[11px] text-amber-800 block">Buffer Avail:</span>
              <strong className="text-amber-900 text-sm font-mono">
                {session?.bufferAvailableMinutes || 20} min
              </strong>
            </div>
          </div>

          {/* Current & Next Patient Quick Strips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Inside with Doctor Now
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {currentPatient ? currentPatient.childName : 'Doctor is currently available'}
                </div>
                {currentPatient && (
                  <div className="text-[11px] text-teal-800">
                    Slot: {currentPatient.bookedTime} • Started: {currentPatient.consultationStartTime || 'Recently'}
                  </div>
                )}
              </div>
              {currentPatient && (
                <button
                  id="rec-complete-current-btn"
                  onClick={() => handleCompleteConsultation(currentPatient.id)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold"
                >
                  Complete
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                  Next Expected Patient
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {nextPatient ? nextPatient.childName : 'No patients queued'}
                </div>
                {nextPatient && (
                  <div className="text-[11px] text-sky-800">
                    Booked: {nextPatient.bookedTime} • Expected: {nextPatient.expectedConsultationTime} ({nextPatient.status})
                  </div>
                )}
              </div>
              {nextPatient && nextPatient.status === 'WAITING' && (
                <button
                  id="rec-send-next-btn"
                  onClick={() => handleSendToDoctor(nextPatient.id)}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold"
                >
                  Send In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Queue Table / Cards (Mobile-first responsive) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Today’s Patient Queue ({appointments.length} Consultations)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Reserved Priority = Walk-in &gt; Emergency priority
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appt) => {
              const isWithDoctor = appt.status === 'WITH_DOCTOR';
              const isWaiting = appt.status === 'WAITING';
              const isBooked = appt.status === 'BOOKED' || appt.status === 'APPROACHING';
              const isCompleted = appt.status === 'COMPLETED';
              const isLate = appt.status === 'LATE';
              const isNoShow = appt.status === 'NO_SHOW';

              return (
                <div
                  key={appt.id}
                  id={`queue-row-${appt.id}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isWithDoctor
                      ? 'bg-teal-50/70 border-teal-400 ring-2 ring-teal-400/30'
                      : isWaiting
                      ? 'bg-sky-50/60 border-sky-300'
                      : isCompleted
                      ? 'bg-slate-50/60 border-slate-200 opacity-70'
                      : isLate
                      ? 'bg-amber-50/60 border-amber-300'
                      : isNoShow
                      ? 'bg-rose-50/60 border-rose-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Patient Info */}
                  <div className="space-y-1 sm:max-w-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {appt.childName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        #{appt.appointmentNumber}
                      </span>
                      {appt.isEmergency && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold">
                          EMERGENCY
                        </span>
                      )}
                      {appt.bookingSource === 'RECEPTION_PHONE' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-semibold">
                          Phone Booking
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Parent: <strong className="text-slate-700">{appt.parentName}</strong> ({appt.parentMobile})
                    </div>
                  </div>

                  {/* Times Breakdown (Booked vs Expected vs Status) */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Booked:</span>
                      <span className="font-mono font-bold text-slate-800">{appt.bookedTime}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-teal-700 block uppercase font-bold">Expected:</span>
                      <span className="font-mono font-bold text-teal-900 text-sm">
                        {appt.expectedConsultationTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Payment:</span>
                      <span
                        className={`font-semibold ${
                          appt.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {appt.paymentStatus}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Status:</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800">
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Operational Action Buttons (Simple, Low-click workflow) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* 1. CHECK IN / PAYMENT RECEIVED */}
                    {appt.paymentStatus === 'PENDING' && !isCompleted && !isNoShow && (
                      <button
                        id={`btn-checkin-${appt.id}`}
                        onClick={() => handleCheckInPayment(appt.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Check In / Pay</span>
                      </button>
                    )}

                    {/* 2. SEND TO DOCTOR */}
                    {isWaiting && (
                      <button
                        id={`btn-send-${appt.id}`}
                        onClick={() => handleSendToDoctor(appt.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Send to Doctor</span>
                      </button>
                    )}

                    {/* 3. COMPLETE */}
                    {isWithDoctor && (
                      <button
                        id={`btn-complete-${appt.id}`}
                        onClick={() => handleCompleteConsultation(appt.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </button>
                    )}

                    {/* 4. MARK LATE */}
                    {isBooked && (
                      <button
                        id={`btn-late-${appt.id}`}
                        onClick={() => handleMarkLate(appt.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-amber-800 text-xs font-medium transition"
                        title="Patient not arrived yet; mark late"
                      >
                        Mark Late
                      </button>
                    )}

                    {/* 5. REASSIGN POSITION */}
                    {(isLate || isWaiting) && (
                      <button
                        id={`btn-reassign-${appt.id}`}
                        onClick={() => setShowReassignModal(appt)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                      >
                        Reassign
                      </button>
                    )}

                    {/* 6. NO-SHOW */}
                    {!isCompleted && !isNoShow && (
                      <button
                        id={`btn-noshow-${appt.id}`}
                        onClick={() => handleNoShow(appt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Release slot for no-show"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Telephone Booking */}
        {showPhoneBookingModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setShowPhoneBookingModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Telephone Appointment</h3>
                <p className="text-xs text-slate-500">
                  Equal reserved priority with online booking. Never double-books.
                </p>
              </div>

              {/* Step A: Search parent by mobile */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parent Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      id="rec-phone-input-mobile"
                      type="tel"
                      placeholder="e.g. 9000000001"
                      value={parentMobileSearch}
                      onChange={(e) => setParentMobileSearch(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={handleSearchParent}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {foundParent ? (
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                    <div className="font-bold text-teal-900">Existing Parent: {foundParent.name}</div>
                    <label className="block text-slate-700 font-semibold">Select Child</label>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-teal-300 text-xs"
                    >
                      {foundParent.children.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">New Parent Quick Profile</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Parent Full Name"
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Child Full Name"
                        value={newParentChild}
                        onChange={(e) => setNewParentChild(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Doctor, Date, Slot */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Doctor</label>
                    <select
                      value={phoneBookingDoctor}
                      onChange={(e) => {
                        setPhoneBookingDoctor(e.target.value);
                        handleLoadPhoneSlots();
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={phoneBookingDate}
                      onChange={(e) => {
                        setPhoneBookingDate(e.target.value);
                        handleLoadPhoneSlots();
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Available Slot</label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1">
                    {phoneSlots.map((s) => (
                      <button
                        key={s.time}
                        disabled={!s.available}
                        onClick={() => setSelectedPhoneSlot(s.time)}
                        className={`p-2 rounded-lg text-xs font-semibold text-center transition ${
                          selectedPhoneSlot === s.time
                            ? 'bg-teal-600 text-white'
                            : s.available
                            ? 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                            : 'bg-slate-100 text-slate-400 line-through opacity-50'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowPhoneBookingModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  id="rec-submit-phone-booking-btn"
                  disabled={!selectedPhoneSlot}
                  onClick={handleCreatePhoneBooking}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Emergency Adjustment */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-700">
                <Zap className="w-5 h-5" />
                <span>Emergency Priority Adjustment</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inserts child into immediate consultation position, absorbs 15 min buffer, and recalculates downstream ETAs without collecting disease information.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Child Name *</label>
                  <input
                    id="rec-emg-child-name"
                    type="text"
                    required
                    placeholder="e.g. Baby Aryan"
                    value={emergencyChildName}
                    onChange={(e) => setEmergencyChildName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Reddy"
                    value={emergencyParentName}
                    onChange={(e) => setEmergencyParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={emergencyParentMobile}
                    onChange={(e) => setEmergencyParentMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  id="rec-submit-emergency-btn"
                  onClick={handleEmergencySubmit}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Admit Emergency Patient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reassign Late Patient */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="font-bold text-slate-900 text-base">Reassign Queue Position</h3>
              <p className="text-xs text-slate-500">
                Assign next available buffer or suitable queue slot for <strong>{showReassignModal.childName}</strong>.
              </p>

              <div className="text-xs">
                <label className="block text-slate-700 font-semibold mb-1">New Estimated Consultation Time</label>
                <input
                  type="time"
                  value={reassignTime}
                  onChange={(e) => setReassignTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowReassignModal(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  id="rec-submit-reassign-btn"
                  onClick={handleReassignSubmit}
                  className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  Assign to Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cancel Doctor Session */}
        {showCancelSessionModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Hospital Caused Session Cancellation</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cancels remaining appointments for today’s session and sends reassuring apologies to affected families. Will NOT be recorded as parent no-show.
              </p>

              <div className="text-xs">
                <label className="block text-slate-700 font-semibold mb-1">Operational Reason for Cancellation</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowCancelSessionModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs"
                >
                  Keep Session
                </button>
                <button
                  id="rec-confirm-cancel-session-btn"
                  onClick={handleCancelSessionSubmit}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                >
                  Confirm Hospital Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
