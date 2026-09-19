import React, { useState, useEffect } from 'react';
import {
  UpcomingVaccineReminderItem,
  ChildVaccinationProgram,
  BranchId,
} from '../types/index.js';
import {
  PhoneCall,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Syringe,
  Baby,
  User,
  PhoneForwarded,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Award,
  X,
} from 'lucide-react';
import { ChildVaccineTracker } from './ChildVaccineTracker.js';

interface VaccineRemindersDeskProps {
  onRegisterNewChild: () => void;
  receptionistName: string;
  currentBranchId: BranchId;
  simulatedDate: string;
}

export const VaccineRemindersDesk: React.FC<VaccineRemindersDeskProps> = ({
  onRegisterNewChild,
  receptionistName,
  currentBranchId,
  simulatedDate,
}) => {
  const [reminders, setReminders] = useState<UpcomingVaccineReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'OVERDUE' | '7_DAYS' | '15_DAYS'>('ALL');

  // Call Logging Modal
  const [selectedCallItem, setSelectedCallItem] = useState<UpcomingVaccineReminderItem | null>(null);
  const [callOutcome, setCallOutcome] = useState<'CONFIRMED' | 'CALL_LATER' | 'NOT_REACHABLE' | 'ALREADY_VACCINATED_ELSEWHERE'>('CONFIRMED');
  const [callNotes, setCallNotes] = useState('');
  const [savingCallLog, setSavingCallLog] = useState(false);

  // Administer Vaccine Modal
  const [administerItem, setAdministerItem] = useState<UpcomingVaccineReminderItem | null>(null);
  const [administerDate, setAdministerDate] = useState(simulatedDate);
  const [administerBatch, setAdministerBatch] = useState('SRI-VAC-2026');
  const [administerDoctor, setAdministerDoctor] = useState('Dr. Subba Rao Vadarevu');
  const [savingAdminister, setSavingAdminister] = useState(false);

  // Inspect Child Card Modal
  const [inspectChildProgram, setInspectChildProgram] = useState<ChildVaccinationProgram | null>(null);
  const [loadingChildProgram, setLoadingChildProgram] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vaccinations/reception/due-reminders?days=15');
      const data = await res.json();
      if (data.success && Array.isArray(data.reminders)) {
        setReminders(data.reminders);
      }
    } catch (err) {
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [simulatedDate]);

  // Handle Call Submit
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallItem) return;

    setSavingCallLog(true);
    try {
      const res = await fetch('/api/vaccinations/reception/call-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedCallItem.programId,
          doseId: selectedCallItem.doseId,
          milestoneId: selectedCallItem.milestoneId,
          calledBy: receptionistName || 'Reception Desk',
          callOutcome,
          notes: callNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Call logged for ${selectedCallItem.childName}: ${callOutcome}`);
        setSelectedCallItem(null);
        setCallNotes('');
        fetchReminders();
      } else {
        alert(data.message || 'Failed to save call log');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving call log');
    } finally {
      setSavingCallLog(false);
    }
  };

  // Handle Administer Dose
  const handleAdministerDoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administerItem) return;

    setSavingAdminister(true);
    try {
      const res = await fetch(`/api/vaccinations/doses/${administerItem.doseId}/administer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: administerItem.programId,
          administeredDate: administerDate,
          batchNumber: administerBatch,
          administeredBy: administerDoctor,
          branchId: currentBranchId,
          notes: `Vaccine dose administered at hospital on ${administerDate}.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Dose marked as completed for ${administerItem.childName}!`);
        setAdministerItem(null);
        fetchReminders();
      } else {
        alert(data.message || 'Failed to administer vaccine');
      }
    } catch (err) {
      console.error(err);
      alert('Error administering vaccine');
    } finally {
      setSavingAdminister(false);
    }
  };

  // Handle View Full Child Card
  const handleOpenChildCard = async (childId: string) => {
    setLoadingChildProgram(true);
    try {
      const res = await fetch(`/api/vaccinations/child/${childId}`);
      const data = await res.json();
      if (data.success && data.program) {
        setInspectChildProgram(data.program);
      } else {
        alert('Vaccination record not found for this child.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChildProgram(false);
    }
  };

  // Filter Logic
  const filteredReminders = reminders.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.childName.toLowerCase().includes(q) ||
      item.parentName.toLowerCase().includes(q) ||
      item.parentMobile.includes(q) ||
      item.milestoneLabel.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (urgencyFilter === 'OVERDUE') {
      return item.urgency === 'OVERDUE' || item.urgency === 'DUE_TODAY';
    }
    if (urgencyFilter === '7_DAYS') {
      return item.urgency === 'DUE_WITHIN_7_DAYS' || item.urgency === 'DUE_TODAY' || item.urgency === 'OVERDUE';
    }
    return true;
  });

  const overdueCount = reminders.filter((r) => r.urgency === 'OVERDUE' || r.urgency === 'DUE_TODAY').length;
  const within7Count = reminders.filter((r) => r.urgency === 'DUE_WITHIN_7_DAYS').length;
  const within15Count = reminders.length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> 15-Day Vaccine Outreach Desk
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white">
                IAP 2018 Protocol
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pediatric Vaccine Reminders & Calling Desk
            </h2>
            <p className="text-xs text-teal-100 mt-1 max-w-2xl">
              Parents whose children are due for vaccines within the next 15 days (calculated from their First Vaccine Given date). Call parents directly, log call outcomes, or administer doses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="rec-register-vaccine-btn"
              onClick={onRegisterNewChild}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Syringe className="w-4 h-4" />
              <span>Register Child for Vaccines</span>
            </button>
            <button
              onClick={fetchReminders}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Refresh Due Reminders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-teal-700/50 text-center">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-teal-200 block">Due in Next 15 Days</span>
            <strong className="text-2xl font-black text-white">{within15Count}</strong>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-amber-200 block">Due within 7 Days</span>
            <strong className="text-2xl font-black text-amber-300">{within7Count}</strong>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-rose-200 block">Overdue / Today</span>
            <strong className="text-2xl font-black text-rose-300">{overdueCount}</strong>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-teal-200 block">Simulated Date</span>
            <strong className="text-sm font-bold text-white block mt-1">{simulatedDate}</strong>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters and Search */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by child, parent name, mobile, or milestone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setUrgencyFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              urgencyFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 15 Days ({reminders.length})
          </button>
          <button
            onClick={() => setUrgencyFilter('7_DAYS')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              urgencyFilter === '7_DAYS'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Next 7 Days ({within7Count + overdueCount})
          </button>
          <button
            onClick={() => setUrgencyFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              urgencyFilter === 'OVERDUE'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue / Today ({overdueCount})
          </button>
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading 15-day upcoming vaccination list...
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Award className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No kids due for vaccines in this period!</p>
            <p className="text-slate-400 mt-1">
              All registered children have their vaccines up-to-date or beyond 15 days out.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReminders.map((item) => {
              const isOverdue = item.daysRemaining < 0;
              const isToday = item.daysRemaining === 0;
              const isWithin7 = item.daysRemaining <= 7 && item.daysRemaining > 0;

              return (
                <div
                  key={`${item.programId}-${item.doseId}`}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Child & Parent Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700'
                          : isToday
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      <Baby className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.childName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {item.childGender}
                        </span>

                        {/* Urgency Badge */}
                        {isOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue by {Math.abs(item.daysRemaining)}d
                          </span>
                        ) : isToday ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> Due Today!
                          </span>
                        ) : isWithin7 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Due in {item.daysRemaining} days
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                            Due in {item.daysRemaining} days
                          </span>
                        )}
                      </div>

                      {/* Parent Details */}
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Parent: <strong className="text-slate-800">{item.parentName}</strong>
                        </span>
                        <span>•</span>
                        <a
                          href={`tel:${item.parentMobile}`}
                          className="flex items-center gap-1 text-teal-700 font-bold hover:underline"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {item.parentMobile}
                        </a>
                      </div>

                      {/* Vaccine Milestone & Schedule */}
                      <div className="mt-2 text-xs">
                        <span className="font-bold text-slate-900">{item.milestoneLabel} Milestone:</span>{' '}
                        <span className="text-slate-600">
                          {item.vaccines.join(', ')}
                        </span>
                        <span className="ml-2 text-slate-400 font-medium">
                          (Due Date: <strong className="text-slate-700">{item.dueDate}</strong>)
                        </span>
                      </div>

                      {/* Last Call History Pill */}
                      {item.lastCallLog ? (
                        <div className="mt-2 flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 font-medium">Last Contacted:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              item.lastCallLog.callOutcome === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.lastCallLog.callOutcome === 'CALL_LATER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.lastCallLog.callOutcome.replace('_', ' ')}
                          </span>
                          <span className="text-slate-500">on {item.lastCallLog.calledAt}</span>
                          {item.lastCallLog.notes && (
                            <span className="text-slate-500 italic max-w-xs truncate">
                              "{item.lastCallLog.notes}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          No reminder call logged yet for this milestone.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedCallItem(item);
                        setCallOutcome('CONFIRMED');
                        setCallNotes('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      <span>Log Call Outcome</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdministerItem(item);
                        setAdministerDate(simulatedDate);
                        setAdministerBatch('SRI-VAC-2026');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Syringe className="w-3.5 h-3.5" />
                      <span>Administer</span>
                    </button>

                    <button
                      onClick={() => handleOpenChildCard(item.childId)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      title="View Complete Immunization Card"
                    >
                      Full Card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Log Call Outcome */}
      {selectedCallItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Log Reminder Call</h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedCallItem.childName} • {selectedCallItem.milestoneLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCallItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCallLog} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-slate-600 font-medium">
                  Parent:{' '}
                  <strong className="text-slate-900">{selectedCallItem.parentName}</strong>
                </p>
                <p className="text-slate-600 font-medium mt-0.5">
                  Mobile:{' '}
                  <a
                    href={`tel:${selectedCallItem.parentMobile}`}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    {selectedCallItem.parentMobile}
                  </a>
                </p>
                <p className="text-slate-600 font-medium mt-0.5">
                  Vaccine Due Date:{' '}
                  <strong className="text-slate-900">{selectedCallItem.dueDate}</strong> (
                  {selectedCallItem.daysRemaining} days remaining)
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Call Outcome *
                </label>
                <select
                  value={callOutcome}
                  onChange={(e: any) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="CONFIRMED">✅ Confirmed - Will visit hospital on due date</option>
                  <option value="CALL_LATER">⏳ Call Later / Parent Busy</option>
                  <option value="NOT_REACHABLE">📵 Not Reachable / Switched Off</option>
                  <option value="ALREADY_VACCINATED_ELSEWHERE">🏥 Already Vaccinated Elsewhere</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Parent Feedback / Reception Notes
                </label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Parent confirmed coming Saturday morning 10 AM..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCallItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCallLog}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingCallLog ? 'Saving...' : 'Save Call Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Administer Dose */}
      {administerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Administer Vaccine Dose</h3>
                  <p className="text-[11px] text-slate-500">
                    {administerItem.childName} • {administerItem.milestoneLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdministerItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdministerDoseSubmit} className="mt-4 space-y-3.5">
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  Vaccines in this Milestone:
                </span>
                <p className="text-slate-700">{administerItem.vaccines.join(' • ')}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Administered Date *
                </label>
                <input
                  type="date"
                  value={administerDate}
                  onChange={(e) => setAdministerDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Vaccine Batch Number *
                </label>
                <input
                  type="text"
                  value={administerBatch}
                  onChange={(e) => setAdministerBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Administering Pediatrician *
                </label>
                <select
                  value={administerDoctor}
                  onChange={(e) => setAdministerDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Dr. Subba Rao Vadarevu">Dr. Subba Rao Vadarevu (Senior Pediatrician)</option>
                  <option value="Dr. Ananya Rao">Dr. Ananya Rao (Pediatric Specialist)</option>
                  <option value="Duty Pediatric Nurse">Duty Pediatric Nurse</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdministerItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdminister}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingAdminister ? 'Recording...' : 'Mark Dose Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Inspect Full Child Vaccine Card */}
      {inspectChildProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Digital Immunization Card (IAP 2018)
              </h3>
              <button
                onClick={() => setInspectChildProgram(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ChildVaccineTracker
              program={inspectChildProgram}
              onRefresh={() => handleOpenChildCard(inspectChildProgram.childId)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
