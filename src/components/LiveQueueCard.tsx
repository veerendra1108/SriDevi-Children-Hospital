import React, { useState } from 'react';
import { Appointment, SystemConfiguration } from '../types/index.js';
import {
  Clock,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Bell,
  RefreshCw,
  MapPin,
  User,
  Shield,
  ArrowRight,
  Info,
} from 'lucide-react';

interface LiveQueueCardProps {
  appointment: Appointment;
  config: SystemConfiguration;
  onRescheduleClick: (appointment: Appointment) => void;
  onRefresh: () => void;
  onUpdateNoticePreference?: (minutes: number) => void;
}

export const LiveQueueCard: React.FC<LiveQueueCardProps> = ({
  appointment,
  config,
  onRescheduleClick,
  onRefresh,
  onUpdateNoticePreference,
}) => {
  const [noticeMinutes, setNoticeMinutes] = useState<number>(
    appointment.advanceNoticePreferenceMinutes || 30
  );

  // Time calculations
  const [nowHours, nowMins] = config.simulatedTime.split(':').map(Number);
  const nowTotal = nowHours * 60 + nowMins;

  const [bookedHours, bookedMins] = appointment.bookedTime.split(':').map(Number);
  const bookedTotal = bookedHours * 60 + bookedMins;

  const [expectedHours, expectedMins] = appointment.expectedConsultationTime.split(':').map(Number);
  const expectedTotal = expectedHours * 60 + expectedMins;

  const delayDifference = expectedTotal - bookedTotal;
  const minutesUntilBooked = bookedTotal - nowTotal;
  const isPastBookedTime = minutesUntilBooked < 0;

  // Cutoff rule: Reschedule allowed only until 60 minutes before appointment time
  const canReschedule =
    appointment.date === config.simulatedDate
      ? minutesUntilBooked >= config.rescheduleCutoffMinutes
      : true;

  // Status badge indicator color
  let statusBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs';
  let statusDotColor = 'bg-emerald-500';
  let delayText = 'Doctor running approximately on schedule';

  if (delayDifference > 20) {
    statusBadgeColor = 'bg-rose-50 text-rose-900 border-rose-300 shadow-xs';
    statusDotColor = 'bg-rose-500';
    delayText = `Doctor running approximately ${delayDifference} minutes late`;
  } else if (delayDifference > 5) {
    statusBadgeColor = 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs';
    statusDotColor = 'bg-amber-500';
    delayText = `Doctor running approximately ${delayDifference} minutes late`;
  } else if (delayDifference < -5) {
    statusBadgeColor = 'bg-teal-50 text-teal-900 border-teal-300 shadow-xs';
    statusDotColor = 'bg-teal-500';
    delayText = `Doctor is running slightly ahead of schedule`;
  }

  const handleNoticeChange = (val: number) => {
    setNoticeMinutes(val);
    if (onUpdateNoticePreference) {
      onUpdateNoticePreference(val);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500/30 shadow-lg relative overflow-hidden">
      {/* Decorative accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-sky-500 to-teal-600" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Live Active Queue Tracker
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                #{appointment.appointmentNumber}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {appointment.childName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Blinking Radar Status Badge */}
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusBadgeColor}`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColor}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDotColor} animate-pulse`}
              />
            </span>
            <span>{delayText}</span>
          </span>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:rotate-180 duration-300"
            title="Refresh Live Queue Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Doctor & Location Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 block text-[11px]">Consulting Pediatrician:</span>
            <strong className="text-slate-900 text-sm">{appointment.doctorName}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 block text-[11px]">Hospital Location:</span>
            <strong className="text-slate-900">{appointment.branchName}</strong>
          </div>
        </div>
      </div>

      {/* CORE QUEUE METRICS GRID (The high-precision time distinction) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 my-2">
        {/* Booked Time */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/60">
          <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
            Original Booked Time
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            {appointment.bookedTime}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Fixed audit slot</span>
        </div>

        {/* Current Expected Consultation Time */}
        <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200">
          <span className="text-[11px] font-bold text-teal-800 block uppercase tracking-wider">
            Current Expected Time
          </span>
          <div className="text-xl sm:text-2xl font-black text-teal-900 font-mono mt-1">
            {appointment.expectedConsultationTime}
          </div>
          <span className="text-[10px] text-teal-700 block mt-0.5">Dynamically updated</span>
        </div>

        {/* Please Arrive By */}
        <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200">
          <span className="text-[11px] font-bold text-sky-800 block uppercase tracking-wider">
            Please Arrive By
          </span>
          <div className="text-xl sm:text-2xl font-black text-sky-950 font-mono mt-1">
            {appointment.recommendedArrivalTime}
          </div>
          <span className="text-[10px] text-sky-700 block mt-0.5">15 min before expected</span>
        </div>
      </div>

      {/* Children Ahead & Queue Progress Bar */}
      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
              {appointment.childrenAhead !== undefined ? appointment.childrenAhead : '—'}
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {appointment.childrenAhead !== undefined
                  ? `${appointment.childrenAhead} children ahead of you`
                  : 'Checking queue status'}
              </span>
              <span className="text-slate-500 block text-[11px]">
                {appointment.status === 'WITH_DOCTOR'
                  ? 'Currently inside consultation room with doctor'
                  : appointment.status === 'WAITING'
                  ? 'Checked in & fee paid — waiting in hospital lounge'
                  : 'Tracking from home; hospital queue progressing'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Current Patient Status
            </span>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
              {appointment.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Reassuring Status Messages for Passed / Late / Rescheduled */}
      {appointment.status === 'LATE' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 mb-4">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Late Arrival Notice</span>
          </div>
          <p>
            Your original appointment time has passed. Reception will assign the next available consultation position as soon as you arrive.
          </p>
        </div>
      )}

      {appointment.status === 'NO_SHOW' && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1 mb-4">
          <div className="font-bold flex items-center gap-1.5 text-sky-900">
            <Info className="w-4 h-4 text-sky-600" />
            <span>Consultation Position Update</span>
          </div>
          <p>
            Your original appointment time has passed. If you are still planning to visit today, please come to the hospital. Reception will arrange the next available consultation slot based on availability.
          </p>
        </div>
      )}

      {appointment.status === 'HOSPITAL_CANCELLED' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1 mb-4">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Hospital Cancellation</span>
          </div>
          <p>
            Unfortunately today’s consultation with Dr. {appointment.doctorName} has been cancelled by the hospital. We apologise for the inconvenience. Please check available appointments or contact reception.
          </p>
        </div>
      )}

      {/* Advance Notice Preference Selector */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Bell className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-medium">How much advance notice do you need to travel to the hospital?</span>
        </div>

        <div className="flex items-center gap-1.5">
          {[10, 20, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleNoticeChange(mins)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                noticeMinutes === mins
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Reschedule Button / Cutoff Rule Action */}
      <div className="pt-5 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          {canReschedule ? (
            <span>Online reschedule available until 60 minutes before slot.</span>
          ) : (
            <span className="text-amber-800 font-medium">
              Your appointment is approaching and can no longer be rescheduled online. Please proceed to the hospital as planned.
            </span>
          )}
        </div>

        <button
          id={`reschedule-btn-${appointment.id}`}
          disabled={!canReschedule || appointment.status === 'COMPLETED'}
          onClick={() => onRescheduleClick(appointment)}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
            canReschedule && appointment.status !== 'COMPLETED'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer'
              : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Reschedule Appointment</span>
        </button>
      </div>
    </div>
  );
};
