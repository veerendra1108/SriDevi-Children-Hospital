import React, { useState, useEffect } from 'react';
import {
  Parent,
  Child,
  Appointment,
  SystemConfiguration,
  BranchId,
} from '../types/index.js';
import { LiveQueueCard } from './LiveQueueCard.js';
import {
  Calendar,
  User,
  Plus,
  Edit2,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Phone,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
} from 'lucide-react';

interface ParentDashboardProps {
  parentUser: Parent;
  config: SystemConfiguration;
  onOpenBookAppointment: () => void;
  onRescheduleAppointment: (appointment: Appointment) => void;
  onLogout: () => void;
  onRefreshParent: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parentUser,
  config,
  onOpenBookAppointment,
  onRescheduleAppointment,
  onLogout,
  onRefreshParent,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  // Fetch appointments for this parent
  useEffect(() => {
    fetchParentAppointments();
    // Poll every 10 seconds for real-time queue synchronization
    const interval = setInterval(fetchParentAppointments, 10000);
    return () => clearInterval(interval);
  }, [parentUser.id, config.simulatedTime]);

  const fetchParentAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?parentId=${parentUser.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChildName = async () => {
    if (!editingChild || !editChildName.trim()) return;
    try {
      const res = await fetch(`/api/parents/${parentUser.id}/children/${editingChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editChildName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        editingChild.name = editChildName.trim();
        setEditingChild(null);
        onRefreshParent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewChild = async () => {
    if (!newChildName.trim()) return;
    try {
      const res = await fetch(`/api/parents/${parentUser.id}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChildName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.child) {
        parentUser.children.push(data.child);
        setNewChildName('');
        setShowAddChildModal(false);
        onRefreshParent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter active today appointment
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const todayActiveAppointment = safeAppointments.find(
    (a) =>
      a.date === config.simulatedDate &&
      ['BOOKED', 'APPROACHING', 'ARRIVED', 'WAITING', 'WITH_DOCTOR', 'LATE'].includes(a.status)
  );

  const otherUpcomingAppointments = safeAppointments.filter(
    (a) =>
      a.id !== todayActiveAppointment?.id &&
      ['BOOKED', 'APPROACHING', 'WAITING', 'ARRIVED'].includes(a.status)
  );

  const pastAppointments = safeAppointments.filter(
    (a) => ['COMPLETED', 'NO_SHOW', 'HOSPITAL_CANCELLED', 'RESCHEDULED'].includes(a.status)
  );

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Parent Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Parent Portal • Sri Devi Children Hospital</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {parentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Registered Mobile: <span className="font-mono font-medium text-slate-700">{parentUser.mobile}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              id="parent-dash-book-btn"
              onClick={onOpenBookAppointment}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={fetchParentAppointments}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Refresh Appointments"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-medium text-xs transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Section: Today's Active Live Booking Tracker (HIGHLIGHTED) */}
        {todayActiveAppointment ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span>Today’s Active Consultation Tracker</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Auto-updating every 10s • Wait comfortably at home
              </span>
            </div>

            <LiveQueueCard
              appointment={todayActiveAppointment}
              config={config}
              onRescheduleClick={onRescheduleAppointment}
              onRefresh={fetchParentAppointments}
            />
          </div>
        ) : otherUpcomingAppointments.length > 0 ? (
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    Upcoming Appointment Confirmed
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {otherUpcomingAppointments[0].childName} • Token #{otherUpcomingAppointments[0].appointmentNumber}
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
                Scheduled for {otherUpcomingAppointments[0].date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-2xl border border-teal-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Doctor &amp; Branch:</span>
                <strong className="text-slate-800">{otherUpcomingAppointments[0].doctorName}</strong>
                <div className="text-slate-500 text-[11px]">{otherUpcomingAppointments[0].branchName}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Consultation Date &amp; Time:</span>
                <strong className="text-teal-900 text-sm">{otherUpcomingAppointments[0].date} at {otherUpcomingAppointments[0].bookedTime}</strong>
                <div className="text-slate-500 text-[11px]">Arrive by {otherUpcomingAppointments[0].recommendedArrivalTime}</div>
              </div>
              <div className="flex items-center sm:justify-end gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => onRescheduleAppointment(otherUpcomingAppointments[0])}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </div>
            <p className="text-[11px] text-teal-800 font-medium">
              💡 Tip: On the appointment day, this tracker will automatically turn into your real-time Live Queue Card with live token calling and train-ETA delays!
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">No active appointments</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book an exact consultation slot with Dr. Subba Rao Vadarevu or Dr. Prashant.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBookAppointment}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Book New Appointment
            </button>
          </div>
        )}

        {/* Section: Children Profiles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              <span>Registered Children</span>
            </h2>
            <button
              id="dash-add-child-btn"
              onClick={() => setShowAddChildModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 text-teal-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Child</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {parentUser.children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-200 transition flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                    Child Profile
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-0.5">{child.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {child.id}</span>
                </div>

                <button
                  id={`edit-child-btn-${child.id}`}
                  onClick={() => {
                    setEditingChild(child);
                    setEditChildName(child.name);
                  }}
                  className="p-2 text-slate-400 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition"
                  title="Edit child name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Upcoming & Past Appointments List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming appointments */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Upcoming Appointments</span>
            </h3>

            {otherUpcomingAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No other future bookings.</p>
            ) : (
              <div className="space-y-3">
                {otherUpcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm">{appt.childName}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-semibold text-[10px]">
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Doctor: <span className="font-medium text-slate-800">{appt.doctorName}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span>Date: {appt.date}</span>
                      <span className="font-mono font-bold text-slate-800">{appt.bookedTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past consultation history */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <span>Consultation History</span>
            </h3>

            {pastAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No previous consultation logs.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {pastAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{appt.childName}</span>
                      <span className="text-[10px] text-slate-500">{appt.date}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      {appt.doctorName} • {appt.branchName.replace('Sri Devi Children Hospital - ', '')}
                    </div>
                    <div className="text-[11px] text-teal-700 font-medium">
                      Status: {appt.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Edit Child Name */}
        {editingChild && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="font-bold text-slate-900 text-base">Edit Child Name</h3>
              <input
                id="edit-child-input-name"
                type="text"
                value={editChildName}
                onChange={(e) => setEditChildName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingChild(null)}
                  className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  id="save-child-name-btn"
                  onClick={handleSaveChildName}
                  className="flex-1 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Child */}
        {showAddChildModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="font-bold text-slate-900 text-base">Add Child Profile</h3>
              <p className="text-xs text-slate-500">
                Add child name to book consultations under this parent account.
              </p>
              <input
                id="add-child-input-name"
                type="text"
                placeholder="Child's full name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  id="submit-new-child-btn"
                  onClick={handleAddNewChild}
                  className="flex-1 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-semibold"
                >
                  Add Child
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
