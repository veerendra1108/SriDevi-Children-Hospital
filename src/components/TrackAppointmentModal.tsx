import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Phone,
  Calendar,
  Clock,
  MapPin,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Appointment, SystemConfiguration } from '../types/index.js';

interface TrackAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfiguration;
  initialMobile?: string;
  onOpenBooking: () => void;
  onNavigateToParentPortal?: () => void;
}

export const TrackAppointmentModal: React.FC<TrackAppointmentModalProps> = ({
  isOpen,
  onClose,
  config,
  initialMobile = '',
  onOpenBooking,
  onNavigateToParentPortal,
}) => {
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialMobile) {
        setMobileNumber(initialMobile);
        handleSearch(initialMobile);
      } else {
        setAppointments([]);
        setSearched(false);
        setErrorMsg(null);
      }
    }
  }, [isOpen, initialMobile]);

  if (!isOpen) return null;

  const handleSearch = async (mobileToSearch?: string) => {
    const query = (mobileToSearch !== undefined ? mobileToSearch : mobileNumber).trim();
    if (!query) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/appointments/track?mobile=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Failed to track appointment');
      }
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setSearched(true);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setErrorMsg('Unable to retrieve appointment status. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (num: string) => {
    setMobileNumber(num);
    handleSearch(num);
  };

  const todayStr = config.simulatedDate;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-200 border border-white/20">
              <Activity className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="track-modal-title" className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Track My Appointment
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-semibold border border-teal-300/30">
                  Live Queue
                </span>
              </div>
              <p className="text-xs text-teal-100/80 font-medium">
                Enter your mobile number to check real-time queue ETA &amp; schedule
              </p>
            </div>
          </div>

          <button
            id="track-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close track appointment dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Presets */}
        <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="track-mobile-input"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter 10-digit mobile number (e.g. 9000000001)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium shadow-xs"
                maxLength={15}
                autoFocus
              />
            </div>

            <button
              id="track-search-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track Now</span>
            </button>
          </form>

          {/* Preset testing pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick Test Numbers:</span>
            <button
              type="button"
              onClick={() => handlePresetClick('9000000001')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-medium transition cursor-pointer shadow-2xs"
            >
              9000000001 (Today &amp; Tomorrow)
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('9000000003')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-medium transition cursor-pointer shadow-2xs"
            >
              9000000003 (Today 10:30)
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('9000000005')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-medium transition cursor-pointer shadow-2xs"
            >
              9000000005 (Today 11:00)
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!searched && !loading && (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Search className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Check Your Consultation Status
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Enter your mobile number above. You’ll receive real-time doctor delays and your live queue token position for today’s appointments, or your confirmed date &amp; time for future visits.
              </p>
            </div>
          )}

          {searched && appointments.length === 0 && !loading && (
            <div className="py-10 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  No Appointments Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't locate any active appointments for mobile number{' '}
                  <strong className="text-slate-800">{mobileNumber}</strong>.
                </p>
              </div>
              <div className="pt-2">
                <button
                  id="track-book-new-btn"
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book New Appointment</span>
                </button>
              </div>
            </div>
          )}

          {appointments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-semibold text-slate-700">
                  Found {appointments.length} appointment{appointments.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => handleSearch()}
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Status</span>
                </button>
              </div>

              {appointments.map((appt) => {
                const isToday = appt.date === todayStr;

                return (
                  <div
                    key={appt.id}
                    className={`rounded-2xl border transition-all overflow-hidden shadow-xs ${
                      isToday
                        ? 'border-teal-300 bg-white ring-2 ring-teal-500/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Top card header */}
                    <div
                      className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
                        isToday
                          ? 'bg-gradient-to-r from-teal-50 to-sky-50 border-teal-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isToday ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Today’s Active Appointment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold text-[11px] border border-sky-300">
                            <Calendar className="w-3 h-3 text-sky-600" />
                            Upcoming / Future Date
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {appt.childName}
                        </span>
                      </div>

                      {/* Token Number pill */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Token:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-teal-900 text-white font-mono font-extrabold text-xs tracking-tight shadow-xs">
                          {appt.appointmentNumber}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Doctor & Branch details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {appt.doctorName}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{appt.branchName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status chip */}
                        <div className="text-left sm:text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                              appt.status === 'WITH_DOCTOR'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : appt.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : appt.status === 'WAITING' || appt.status === 'ARRIVED'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-teal-100 text-teal-900 border border-teal-300'
                            }`}
                          >
                            Status: {appt.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Condition 1: TODAY's APPOINTMENT -> Full Expected Time Delay, Live Queue Radar & Times */}
                      {isToday ? (
                        <div className="space-y-3">
                          {/* Delay Banner */}
                          <div
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                              appt.delayExplanation?.toLowerCase().includes('late')
                                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                                : appt.delayExplanation?.toLowerCase().includes('ahead')
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                : 'bg-teal-50/90 border-teal-200 text-teal-950'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 shrink-0 text-teal-700" />
                              <div>
                                <div className="text-xs font-bold">
                                  Expected Time Delay &amp; Doctor Pace
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium">
                                  {appt.delayExplanation || 'Doctor consulting on schedule.'}
                                </div>
                              </div>
                            </div>

                            {appt.positionInQueue !== undefined && appt.positionInQueue > 0 && (
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                  Queue Position
                                </span>
                                <span className="text-sm font-extrabold font-mono text-teal-900">
                                  #{appt.positionInQueue}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Time Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                                Booked Slot
                              </span>
                              <span className="text-sm font-bold text-slate-800 font-mono">
                                {appt.bookedTime}
                              </span>
                            </div>
                            <div className="border-x border-slate-200 px-1">
                              <span className="text-[10px] font-bold text-teal-700 uppercase block">
                                Expected Time
                              </span>
                              <span className="text-sm font-extrabold text-teal-900 font-mono">
                                {appt.expectedConsultationTime || appt.bookedTime}
                              </span>
                            </div>
                            {Boolean(
                              appt.actualArrivalTime ||
                              ['ARRIVED', 'WAITING', 'WITH_DOCTOR', 'COMPLETED'].includes(appt.status)
                            ) ? (
                              <div>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                                  Checked In
                                </span>
                                <span className="text-sm font-extrabold text-emerald-950 font-mono">
                                  {appt.actualArrivalTime || 'At Hospital'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] font-semibold text-sky-700 uppercase block">
                                  Reach By
                                </span>
                                <span className="text-sm font-bold text-sky-950 font-mono">
                                  {appt.recommendedArrivalTime || appt.bookedTime}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Live Guidance notice */}
                          {Boolean(
                            appt.actualArrivalTime ||
                            ['ARRIVED', 'WAITING', 'WITH_DOCTOR', 'COMPLETED'].includes(appt.status)
                          ) ? (
                            <p className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-1.5 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Check-in Completed:</strong> Patient is present at Sri Devi Children Hospital. Please relax in the waiting lounge until called.
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Live home tracking active:</strong> You can stay comfortable at home and arrive at the hospital by{' '}
                                <strong className="text-teal-900">{appt.recommendedArrivalTime}</strong>.
                              </span>
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Condition 2: NEXT / OTHER DAY APPOINTMENT -> ONLY Date and Time Displayed */
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-200 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
                                Scheduled Date of Visit
                              </span>
                              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-sky-600" />
                                <span>{appt.date}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
                                Confirmed Slot Time
                              </span>
                              <div className="text-base font-extrabold text-teal-900 font-mono mt-0.5 flex items-center gap-1.5 justify-end">
                                <Clock className="w-4 h-4 text-teal-600" />
                                <span>{appt.bookedTime}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong>Future Appointment Confirmed:</strong> Live queue tracking and real-time doctor delay updates activate on the day of your appointment starting at 08:00 AM.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Need to book another slot?{' '}
            <button
              id="track-footer-book-link"
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
            >
              Book Here
            </button>
          </div>

          <button
            id="track-close-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
