import React, { useState, useEffect } from 'react';
import { Appointment, SlotAvailability } from '../types/index.js';
import { X, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onRescheduleSuccess: (updatedAppointment: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRescheduleSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (appointment) {
      setSelectedDate(appointment.date);
      setSelectedTime('');
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment && selectedDate) {
      fetchSlots();
    }
  }, [appointment, selectedDate]);

  const fetchSlots = async () => {
    if (!appointment) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/slots?doctorId=${appointment.doctorId}&branchId=${appointment.branchId}&date=${selectedDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        // Exclude buffer slots from normal parent booking
        setSlots(data.filter((s) => !s.isBufferSlot));
      } else {
        setSlots([]);
      }
    } catch (err) {
      setErrorMsg('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!appointment || !selectedTime) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newBookedTime: selectedTime,
          newDate: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Could not reschedule appointment.');
        setSubmitting(false);
        return;
      }

      onRescheduleSuccess(data.appointment);
      onClose();
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
            Online Rescheduling
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Reschedule Appointment for {appointment.childName}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Current Booking: {appointment.date} at {appointment.bookedTime} with {appointment.doctorName}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Select Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-semibold">Select New Time Slot</label>
              <span className="text-[11px] text-slate-500">15-minute slot</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center text-slate-500 bg-slate-50 rounded-xl">
                No slots available on this date. Please pick another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                    className={`p-2 rounded-xl text-xs font-semibold text-center transition ${
                      selectedTime === s.time
                        ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-600 ring-offset-1'
                        : s.available
                        ? 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 line-through opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>{s.time}</div>
                    <div className="text-[9px] opacity-75">{s.available ? 'Available' : 'Booked'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Important Rule:</strong> Your current slot ({appointment.bookedTime}) will be released atomically once you confirm the new time.
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={!selectedTime || submitting}
            onClick={handleRescheduleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Updating...' : 'Confirm Reschedule'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
