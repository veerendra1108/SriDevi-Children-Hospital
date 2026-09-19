import React, { useState, useEffect } from 'react';
import {
  Appointment,
  Doctor,
  DoctorSession,
  HospitalBranch,
  BranchId,
  SystemConfiguration,
  PaymentMethod,
} from '../types/index.js';
import {
  ShieldCheck,
  Building,
  User,
  Users,
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
  Syringe,
  Lock,
  Unlock,
  FileText,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { VaccineRemindersDesk } from './VaccineRemindersDesk.js';
import { RegisterVaccineModal } from './RegisterVaccineModal.js';
import { Parent } from '../types/index.js';

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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(config.simulatedDate);
  const [isAllDates, setIsAllDates] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Vaccine Desk State
  const [activeMainTab, setActiveMainTab] = useState<'QUEUE' | 'VACCINES'>('QUEUE');
  const [showRegisterVaccineModal, setShowRegisterVaccineModal] = useState<boolean>(false);
  const [allParents, setAllParents] = useState<Parent[]>([]);
  const [dueVaccinesCount, setDueVaccinesCount] = useState<number>(0);

  // Modals state
  const [checkInModalAppt, setCheckInModalAppt] = useState<Appointment | null>(null);
  const [showPhoneBookingModal, setShowPhoneBookingModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState<Appointment | null>(null);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedParentsList, setBlockedParentsList] = useState<any[]>([]);
  const [unblockModalParent, setUnblockModalParent] = useState<any | null>(null);
  const [unblockJustification, setUnblockJustification] = useState<string>('');
  const [unblockLoading, setUnblockLoading] = useState<boolean>(false);
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
  }, [selectedBranchId, selectedDoctorId, selectedDateFilter, isAllDates, config.simulatedTime]);

  const fetchDueVaccinesCount = async () => {
    try {
      const res = await fetch('/api/vaccinations/reception/due-reminders?days=15');
      const data = await res.json();
      if (data.success) {
        setDueVaccinesCount(data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllParents = async () => {
    try {
      const res = await fetch('/api/parents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllParents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlockedParents = async () => {
    try {
      const res = await fetch('/api/reception/blocked-parents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlockedParentsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch blocked parents:', err);
    }
  };

  useEffect(() => {
    fetchDueVaccinesCount();
    fetchAllParents();
    fetchBlockedParents();
    if (config?.simulatedDate) {
      setSelectedDateFilter(config.simulatedDate);
      setPhoneBookingDate(config.simulatedDate);
    }
  }, [config?.simulatedDate]);

  const fetchLiveQueue = async () => {
    try {
      const dateParam = isAllDates ? 'all' : selectedDateFilter;
      const res = await fetch(
        `/api/queue/live?doctorId=${selectedDoctorId}&branchId=${selectedBranchId}&date=${dateParam}`
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
  const handleCheckInPayment = async (apptId: string, paymentMethod: PaymentMethod = 'CASH') => {
    try {
      const res = await fetch('/api/reception/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId, paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Payment received via ${paymentMethod === 'PHONEPE' ? 'PhonePe / UPI' : 'Cash'} & patient checked in.`);
        setCheckInModalAppt(null);
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
        if (data.isBlocked) {
          showToast(
            `🚫 Patient marked as No-Show. Parent ${data.parentName} (${data.parentMobile}) reached 3 consecutive No-Shows and is now RESTRICTED from online booking!`
          );
        } else {
          showToast(`Patient marked as No-Show (${data.consecutiveNoShows || 1}/3 consecutive). Slot released.`);
        }
        fetchLiveQueue();
        fetchBlockedParents();
        fetchAllParents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblockSubmit = async () => {
    if (!unblockModalParent || !unblockJustification.trim()) {
      showToast('Please provide a justification explanation before unblocking.');
      return;
    }
    setUnblockLoading(true);
    try {
      const res = await fetch('/api/reception/unblock-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: unblockModalParent.id,
          mobile: unblockModalParent.mobile,
          justification: unblockJustification.trim(),
          receptionistName: receptionUser.name || 'Reception Staff',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Booking privileges restored for ${unblockModalParent.name}. Justification logged.`);
        setUnblockModalParent(null);
        setUnblockJustification('');
        fetchBlockedParents();
        fetchAllParents();
        fetchLiveQueue();
      } else {
        showToast(data.message || 'Could not unblock patient');
      }
    } catch (err) {
      showToast('Network error while unblocking patient');
    } finally {
      setUnblockLoading(false);
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

  const realTodayStr = new Date().toLocaleDateString('en-CA');
  const todayDateStr = config.simulatedDate || realTodayStr;
  const tomorrowDate = new Date(todayDateStr);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowDateStr = tomorrowDate.toLocaleDateString('en-CA');

  const filteredAppointments = appointments.filter((appt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      appt.childName.toLowerCase().includes(q) ||
      appt.parentName.toLowerCase().includes(q) ||
      appt.parentMobile.toLowerCase().includes(q) ||
      appt.appointmentNumber.toLowerCase().includes(q) ||
      appt.bookedTime.toLowerCase().includes(q) ||
      (appt.doctorName && appt.doctorName.toLowerCase().includes(q))
    );
  });

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
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span>Logged in as <strong className="text-slate-800">{receptionUser.name}</strong> • Simulated Time:{' '}
              <span className="font-mono font-bold text-teal-800">{config.simulatedTime}</span> ({config.simulatedDate})</span>
              {config.simulatedDate !== realTodayStr && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch('/api/simulation/set-date', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: realTodayStr }),
                      });
                      setSelectedDateFilter(realTodayStr);
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-semibold hover:bg-amber-200 transition text-[11px] cursor-pointer"
                  title="Click to advance hospital date to today"
                >
                  Sync to Calendar Today ({realTodayStr})
                </button>
              )}
            </div>
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
              id="rec-register-vac-btn-top"
              onClick={() => {
                fetchAllParents();
                setShowRegisterVaccineModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>Register for Vaccines</span>
            </button>

            <button
              id="rec-blocked-patients-btn"
              onClick={() => {
                fetchBlockedParents();
                setShowBlockedModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Manage restricted patients and record justifications"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Blocked &amp; No-Shows</span>
              {blockedParentsList.filter((p) => p.isBlocked).length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black leading-none animate-pulse">
                  {blockedParentsList.filter((p) => p.isBlocked).length}
                </span>
              )}
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

        {/* Main View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            id="rec-tab-queue"
            onClick={() => setActiveMainTab('QUEUE')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'QUEUE'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>OPD Live Queue &amp; Consultations</span>
            {queueData?.stats?.totalBooked > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500 text-white font-black">
                {queueData.stats.totalBooked}
              </span>
            )}
          </button>

          <button
            id="rec-tab-vaccines"
            onClick={() => {
              setActiveMainTab('VACCINES');
              fetchDueVaccinesCount();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'VACCINES'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>Vaccine Desk &amp; 15-Day Reminders</span>
            {dueVaccinesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {dueVaccinesCount} Due in 15d
              </span>
            )}
          </button>
        </div>

        {/* TAB 2: VACCINE REMINDERS DESK */}
        {activeMainTab === 'VACCINES' && (
          <VaccineRemindersDesk
            onRegisterNewChild={() => {
              fetchAllParents();
              setShowRegisterVaccineModal(true);
            }}
            receptionistName={receptionUser.name}
            currentBranchId={selectedBranchId}
            simulatedDate={config.simulatedDate}
          />
        )}

        {/* TAB 1: LIVE OPD CONSULTATION QUEUE */}
        {activeMainTab === 'QUEUE' && (
          <>
        {/* Doctor Switcher Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <button
            id="rec-doc-pill-all"
            onClick={() => setSelectedDoctorId('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              selectedDoctorId === 'all'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Doctors ({doctors.length})</span>
          </button>

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
                {selectedDoctorId === 'all' ? 'Hospital Branch Live Queue Overview' : 'Doctor Live Operational Card'}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedDoctorId === 'all'
                  ? `All Doctors • ${branches.find((b) => b.id === selectedBranchId)?.name || 'Main Hospital'}`
                  : doctors.find((d) => d.id === selectedDoctorId)?.name}
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

        {/* Date Selector & Search Filters */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Date Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
                Queue Date:
              </span>
              <button
                type="button"
                id="rec-date-btn-today"
                onClick={() => {
                  setSelectedDateFilter(todayDateStr);
                  setIsAllDates(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  !isAllDates && selectedDateFilter === todayDateStr
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today ({todayDateStr})
              </button>

              <button
                type="button"
                id="rec-date-btn-tomorrow"
                onClick={() => {
                  setSelectedDateFilter(tomorrowDateStr);
                  setIsAllDates(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  !isAllDates && selectedDateFilter === tomorrowDateStr
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tomorrow ({tomorrowDateStr})
              </button>

              {realTodayStr !== todayDateStr && (
                <button
                  type="button"
                  id="rec-date-btn-real-today"
                  onClick={() => {
                    setSelectedDateFilter(realTodayStr);
                    setIsAllDates(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    !isAllDates && selectedDateFilter === realTodayStr
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Filter queue by actual calendar today"
                >
                  Calendar Today ({realTodayStr})
                </button>
              )}

              <button
                type="button"
                id="rec-date-btn-all"
                onClick={() => {
                  setIsAllDates(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  isAllDates
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Upcoming Dates
              </button>

              {/* Custom Date Input */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">or Pick Date:</span>
                <input
                  id="rec-custom-date-input"
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDateFilter(e.target.value);
                      setIsAllDates(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Quick Status Tag */}
            <div className="text-xs text-slate-500 font-medium">
              Active View: <strong className="text-teal-900 font-semibold">{isAllDates ? 'All Upcoming Bookings' : selectedDateFilter}</strong>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="rec-search-input"
              type="text"
              placeholder="Search by Patient Name, Parent Name, Mobile (e.g. 949237...), or Token # (e.g. 1011)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Queue Table / Cards (Mobile-first responsive) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>
                Patient Consultations ({filteredAppointments.length}
                {filteredAppointments.length !== appointments.length && ` of ${appointments.length}`}
                {isAllDates ? ' Total Future' : ` on ${selectedDateFilter}`})
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              Reserved Priority = Walk-in &gt; Emergency priority
            </span>
          </div>

          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <UserX className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700 text-sm">No patient appointments found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No matching patients for search query "${searchQuery}".`
                    : `No appointments found for ${isAllDates ? 'upcoming dates' : selectedDateFilter} in this branch.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-teal-700 font-semibold underline cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            ) : (
              filteredAppointments.map((appt) => {
                const isWithDoctor = appt.status === 'WITH_DOCTOR';
                const isWaiting = appt.status === 'WAITING';
                const isBooked = appt.status === 'BOOKED' || appt.status === 'APPROACHING';
                const isCompleted = appt.status === 'COMPLETED';
                const isLate = appt.status === 'LATE';
                const isNoShow = appt.status === 'NO_SHOW';

                const parentObj = allParents.find(
                  (p) => p.id === appt.parentId || p.mobile === appt.parentMobile
                );
                const isParentBlocked = Boolean(parentObj?.isBlocked);
                const noShowCount = parentObj?.consecutiveNoShows || (isNoShow ? 1 : 0);

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
                    <div className="space-y-1.5 sm:max-w-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {appt.childName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                          #{appt.appointmentNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            appt.date === todayDateStr
                              ? 'bg-teal-100 text-teal-800'
                              : appt.date === tomorrowDateStr
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          📅 {appt.date === todayDateStr ? 'Today' : appt.date === tomorrowDateStr ? 'Tomorrow' : appt.date}
                        </span>
                        {selectedDoctorId === 'all' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {appt.doctorName}
                          </span>
                        )}
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
                        {isParentBlocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-700 text-white font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                            <Lock className="w-3 h-3" />
                            <span>Blocked (3 No-Shows)</span>
                          </span>
                        )}
                        {!isParentBlocked && noShowCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-semibold">
                            ⚠️ {noShowCount}/3 No-Shows
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        Parent: <strong className="text-slate-800 font-semibold">{appt.parentName}</strong>{' '}
                        <span className="font-mono text-slate-600">({appt.parentMobile})</span>
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-semibold ${
                            appt.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {appt.paymentStatus}
                        </span>
                        {appt.paymentStatus === 'PAID' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-tight ${
                              appt.paymentMethod === 'PHONEPE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {appt.paymentMethod === 'PHONEPE' ? '📱 PhonePe' : '💵 Cash'}
                          </span>
                        )}
                      </div>
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
                    {/* 0. UNBLOCK (If parent blocked) */}
                    {isParentBlocked && (
                      <button
                        id={`btn-unblock-${appt.id}`}
                        onClick={() => {
                          setUnblockModalParent(
                            parentObj || { id: appt.parentId, name: appt.parentName, mobile: appt.parentMobile }
                          );
                          setUnblockJustification('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                        title="Patient called back to explain no-show? Record justification and unblock"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unblock</span>
                      </button>
                    )}

                    {/* 1. CHECK IN / PAYMENT RECEIVED */}
                    {appt.paymentStatus === 'PENDING' && !isCompleted && !isNoShow && (
                      <button
                        id={`btn-checkin-${appt.id}`}
                        onClick={() => setCheckInModalAppt(appt)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
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
            }))}
          </div>
        </div>
        </>
        )}

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
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-teal-900">Existing Parent: {foundParent.name}</div>
                      {foundParent.isBlocked && (
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md">
                          🚫 BLOCKED (3 No-Shows)
                        </span>
                      )}
                    </div>

                    {foundParent.isBlocked && (
                      <div className="p-2.5 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-950 text-xs flex items-center justify-between gap-2">
                        <div className="text-[11px]">
                          <strong>Online Booking Suspended.</strong> Parent is on the phone? Record their reason to reinstate.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUnblockModalParent(foundParent);
                            setUnblockJustification('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
                        >
                          Justify &amp; Unblock
                        </button>
                      </div>
                    )}

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

        {/* Modal: Register Child for Vaccines */}
        <RegisterVaccineModal
          isOpen={showRegisterVaccineModal}
          onClose={() => setShowRegisterVaccineModal(false)}
          onSuccess={(prog) => {
            showToast(`${prog.childName} registered for vaccines successfully!`);
            fetchDueVaccinesCount();
            fetchAllParents();
          }}
          parents={allParents}
          currentBranchId={selectedBranchId}
          simulatedDate={config.simulatedDate}
        />

        {/* Modal: Restricted Patients & No-Show Record Manager */}
        {showBlockedModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto animate-in zoom-in-95 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Restricted Patients &amp; No-Show Manager
                    </h3>
                    <p className="text-xs text-slate-500">
                      Patients restricted after 3 consecutive unattended appointments without notice.
                    </p>
                  </div>
                </div>

                <button
                  id="rec-close-blocked-modal"
                  onClick={() => setShowBlockedModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {blockedParentsList.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">No Restricted Patients</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All patients have maintained active attendance or communicated cancellations.
                    </p>
                  </div>
                ) : (
                  blockedParentsList.map((p: any) => {
                    const isBlocked = Boolean(p.isBlocked);
                    return (
                      <div
                        key={p.id}
                        id={`blocked-parent-card-${p.id}`}
                        className={`p-4 rounded-2xl border transition space-y-3 ${
                          isBlocked
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                              <span className="font-mono text-xs text-slate-600">({p.mobile})</span>
                              {isBlocked ? (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-700 text-white flex items-center gap-1 shadow-2xs">
                                  <Lock className="w-3 h-3" />
                                  <span>RESTRICTED (3x No-Show)</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  ⚠️ {p.consecutiveNoShows}/3 Missed
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 pt-0.5">
                              Children: {p.children?.map((c: any) => c.name).join(', ') || 'None recorded'}
                            </div>
                          </div>

                          {isBlocked && (
                            <button
                              id={`unblock-btn-${p.id}`}
                              onClick={() => {
                                setUnblockModalParent(p);
                                setUnblockJustification('');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Re-enable Booking</span>
                            </button>
                          )}
                        </div>

                        {/* Block details */}
                        {isBlocked && (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 text-xs space-y-1">
                            <div className="text-rose-900 font-semibold">
                              Booking Restriction Message Shown to Patient:
                            </div>
                            <div className="italic text-slate-700 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                              "As you didn't respect your appointment slot, we are temporarily blocking your appointment booking."
                            </div>
                            {p.blockedAt && (
                              <div className="text-[10px] text-slate-500">
                                Restricted on: <span className="font-mono font-medium">{p.blockedAt}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Missed appointments breakdown */}
                        {p.missedAppointments && p.missedAppointments.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-slate-700">
                              Missed Appointments History:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {p.missedAppointments.map((m: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700"
                                >
                                  <strong>{m.date}</strong> at {m.bookedTime} • {m.childName} (#{m.appointmentNumber})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Past Unblock History with justifications */}
                        {p.unblockHistory && p.unblockHistory.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-200/60">
                            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>Past Reinstatements &amp; Justifications:</span>
                            </div>
                            <div className="space-y-1">
                              {p.unblockHistory.map((h: any, hIdx: number) => (
                                <div
                                  key={hIdx}
                                  className="text-[11px] bg-white/70 p-2 rounded-xl border border-slate-200 text-slate-700"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <span>{h.timestamp}</span>
                                    <span>Staff: {h.receptionistName}</span>
                                  </div>
                                  <div className="font-medium text-slate-800 mt-0.5">
                                    "{h.justification}"
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Unblock Patient with Justification */}
        {unblockModalParent && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Reinstate Booking Privileges
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{unblockModalParent.name}</strong> ({unblockModalParent.mobile})
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                As per hospital policy, this patient was restricted after 3 consecutive missed slots. Re-enable only when the patient calls back and explains their reason for no-show.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Parent's Justification / Reason for No-Show *
                </label>
                <textarea
                  id="rec-unblock-justification-input"
                  required
                  rows={3}
                  value={unblockJustification}
                  onChange={(e) => setUnblockJustification(e.target.value)}
                  placeholder="e.g. Parent called back explaining child had acute emergency admitted elsewhere; apologized for not notifying."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUnblockModalParent(null);
                    setUnblockJustification('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="rec-confirm-unblock-btn"
                  disabled={unblockLoading || !unblockJustification.trim()}
                  onClick={handleUnblockSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{unblockLoading ? 'Reinstating...' : 'Confirm & Restore'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-In & Payment Method Selection Modal */}
        {checkInModalAppt && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    💳
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Check In &amp; Record Payment</h3>
                    <p className="text-xs text-slate-500">Select payment method received at reception</p>
                  </div>
                </div>
                <button
                  id="btn-close-checkin-modal"
                  onClick={() => setCheckInModalAppt(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Consultation Info Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Token #{checkInModalAppt.appointmentNumber}
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{checkInModalAppt.bookedTime}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  Child: {checkInModalAppt.childName}{' '}
                  <span className="font-normal text-slate-500 text-xs">(Parent: {checkInModalAppt.parentName})</span>
                </div>
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Dr. {checkInModalAppt.doctorName.replace(/^Dr\.\s*/, '')}</span>
                  <span className="text-slate-500 font-mono">{checkInModalAppt.parentMobile}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Receptionist Selection: How did patient pay?
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* PhonePe / UPI */}
                  <button
                    type="button"
                    id="btn-select-phonepe"
                    onClick={() => handleCheckInPayment(checkInModalAppt.id, 'PHONEPE')}
                    className="p-4 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-purple-50/60 hover:bg-purple-100/80 text-left transition flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold group-hover:scale-105 transition shadow-sm">
                      📱
                    </div>
                    <div className="text-center">
                      <span className="block font-extrabold text-purple-950 text-sm">PhonePe / UPI</span>
                      <span className="text-[11px] text-purple-700 font-medium">QR / Online UPI</span>
                    </div>
                  </button>

                  {/* Cash */}
                  <button
                    type="button"
                    id="btn-select-cash"
                    onClick={() => handleCheckInPayment(checkInModalAppt.id, 'CASH')}
                    className="p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold group-hover:scale-105 transition shadow-sm">
                      💵
                    </div>
                    <div className="text-center">
                      <span className="block font-extrabold text-emerald-950 text-sm">Cash</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Counter Physical Cash</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCheckInModalAppt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
