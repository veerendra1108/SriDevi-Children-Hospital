import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, AlertTriangle, ShieldCheck, Users, Zap } from 'lucide-react';
import { OperationalAnalytics } from '../types/index.js';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [analytics, setAnalytics] = useState<OperationalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const onlinePct = analytics && analytics.totalAppointments > 0
    ? Math.round((analytics.onlineBookings / analytics.totalAppointments) * 100)
    : 70;
  const phonePct = 100 - onlinePct;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Sri Devi Children Hospital • Operations Intelligence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hospital Operational Performance Analytics
          </h3>
          <p className="text-xs text-slate-500">
            Real-time indicators measuring waiting times, buffer absorption efficiency, and queue throughput.
          </p>
        </div>

        {loading || !analytics ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Calculating operational metrics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200">
                <span className="text-[11px] font-semibold text-teal-800 block">Avg Wait Time</span>
                <div className="text-2xl font-black text-teal-950 font-mono mt-1">
                  {analytics.averageParentWaitingTimeMinutes} min
                </div>
                <span className="text-[10px] text-teal-700">Down from 95 min traditional wait</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 block">Avg Consultation</span>
                <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                  {analytics.averageConsultationDurationMinutes} min
                </div>
                <span className="text-[10px] text-emerald-700">Detailed pediatric care</span>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
                <span className="text-[11px] font-semibold text-sky-800 block">Doctor Start Delay</span>
                <div className="text-2xl font-black text-sky-950 font-mono mt-1">
                  {analytics.averageDoctorStartDelayMinutes} min
                </div>
                <span className="text-[10px] text-sky-700">Absorbed by rolling train model</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-800 block">Buffer Utilized</span>
                <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                  {analytics.bufferMinutesUsed} min
                </div>
                <span className="text-[10px] text-amber-700">Preventing downstream cascading</span>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Emergency Priority</span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono">
                  {analytics.emergencyAdjustments} handled
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Without disrupting booked family arrival windows.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Late Arrivals Handled</span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono">
                  {analytics.lateArrivals} patients
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Reassigned dynamically to next available position.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Users className="w-4 h-4" />
                  <span>Total Completed</span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono">
                  {analytics.completedConsultations} consultations
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {analytics.appointmentsTreatedEarlierThanBooked} treated earlier than booked time.
                </p>
              </div>
            </div>

            {/* Booking Channel Distribution */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-bold text-slate-900 block">
                Booking Channel Distribution (Online vs. Reception Phone)
              </span>
              <div className="flex h-5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${onlinePct}%` }}
                  className="bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  {onlinePct}% Online ({analytics.onlineBookings})
                </div>
                <div
                  style={{ width: `${phonePct}%` }}
                  className="bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  {phonePct}% Phone ({analytics.receptionBookings})
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Direct Mobile / Web Booking</span>
                <span>Reception Desk / Telephone Call Desk</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
