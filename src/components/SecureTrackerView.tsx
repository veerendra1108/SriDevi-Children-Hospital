import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  Clock,
  User,
  Building,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ChevronRight,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface SecureTrackerViewProps {
  initialId?: string;
  initialToken?: string;
  initialMobile?: string;
  onClose?: () => void;
  onBack?: () => void;
  onBookNew?: () => void;
}

export const SecureTrackerView: React.FC<SecureTrackerViewProps> = ({
  initialId = '',
  initialToken = '',
  initialMobile = '',
  onClose,
  onBack,
  onBookNew,
}) => {
  const effectiveInitialId = initialToken || initialId || '';
  const [searchId, setSearchId] = useState(effectiveInitialId);
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [trackingData, setTrackingData] = useState<{
    appointmentNumber: string;
    hospitalName: string;
    doctorName: string;
    doctorSpecialty: string;
    patientName: string;
    date: string;
    scheduledTime: string;
    status: string;
    positionInQueue: number;
    patientsAhead: number;
    estimatedConsultationTime: string;
    estimatedDelayMinutes: number;
    recommendedArrivalTime: string;
    lastUpdatedTime: string;
  } | null>(null);

  const fetchTracking = async (idToSearch: string, phoneToSearch: string) => {
    if (!idToSearch.trim()) {
      setError('Please enter your Appointment ID or Token Number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `/api/appointments/secure-track?id=${encodeURIComponent(
        idToSearch.trim()
      )}&mobile=${encodeURIComponent(phoneToSearch.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 401 && data.verificationRequired) {
        setVerificationRequired(true);
        setError(data.error);
        setTrackingData(null);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch appointment queue status.');
      }

      setTrackingData(data);
      setVerificationRequired(false);
    } catch (err: any) {
      setError(err.message || 'Unable to track appointment.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tokenToUse = initialToken || initialId || '';
    if (tokenToUse) {
      setSearchId(tokenToUse);
      if (initialMobile) {
        setMobileNumber(initialMobile);
        fetchTracking(tokenToUse, initialMobile);
      }
    }
  }, [initialId, initialToken, initialMobile]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(searchId, mobileNumber);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WITH_DOCTOR':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Inside Consultation Chamber</span>
          </span>
        );
      case 'ARRIVED':
      case 'WAITING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Checked In & Waiting</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Consultation Completed</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-3 border border-teal-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Smart OPD Tracking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Track Your Appointment Live
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Real-time live queue progression, estimated doctor arrival, and queue position updates for telephone & online bookings.
          </p>

          {/* Lookup Input Form */}
          <form onSubmit={handleTrackSubmit} className="mt-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Appointment ID (e.g. DM-CITY-261017-001)"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm font-medium backdrop-blur-sm"
                  required
                />
              </div>

              <div className="w-full sm:w-56 relative">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Patient Mobile / Last 4"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm font-medium backdrop-blur-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Live</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Two-factor verification protects your patient health record and queue privacy.</span>
            </div>
          </form>
        </div>
      </div>

      {/* Error / Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start space-x-3 mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{error}</p>
            {verificationRequired && (
              <p className="text-xs text-rose-600 mt-1">
                Please enter the registered patient mobile number in the phone box above to confirm authorization.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Tracking Details */}
      {trackingData && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden space-y-6 p-6 sm:p-8 animate-fadeIn">
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Building className="w-4 h-4 text-teal-600" />
                <span>{trackingData.hospitalName}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {trackingData.doctorName}
              </h3>
              <p className="text-xs text-teal-700 font-semibold mt-0.5">
                {trackingData.doctorSpecialty}
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <div className="text-xs text-slate-400 mb-1">Current Queue Status</div>
              {getStatusBadge(trackingData.status)}
            </div>
          </div>

          {/* Main Queue Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-center">
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Your Token
              </span>
              <div className="text-2xl font-black text-teal-900 mt-1">
                {trackingData.appointmentNumber}
              </div>
              <span className="text-[11px] text-teal-600 font-medium">Position #{trackingData.positionInQueue}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Patients Ahead
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {trackingData.patientsAhead}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Waiting ahead of you</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Expected Time
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {trackingData.estimatedConsultationTime}
              </div>
              <span className="text-[11px] text-amber-700 font-medium">
                {trackingData.estimatedDelayMinutes > 0
                  ? `+${trackingData.estimatedDelayMinutes}m Doctor Delay`
                  : 'On Schedule'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Reach Clinic By
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {trackingData.recommendedArrivalTime}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">15 min buffer</span>
            </div>
          </div>

          {/* Progress Radar */}
          <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-400">Queue Flow Progress</span>
              <span className="text-slate-400">Last updated: {trackingData.lastUpdatedTime}</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(15, 100 - trackingData.patientsAhead * 15)
                  )}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Appointment Booked</span>
              <span>Checked-In At Hospital</span>
              <span className="text-teal-300 font-bold">Doctor Chamber Call</span>
            </div>
          </div>

          {/* Patient & Booking Details */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Booking Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500">Patient:</span>
                <p className="font-bold text-slate-800">{trackingData.patientName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Scheduled Slot:</span>
                <p className="font-bold text-slate-800">
                  {trackingData.date} at {trackingData.scheduledTime}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Hospital:</span>
                <p className="font-bold text-teal-700">{trackingData.hospitalName}</p>
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-slate-400">
              Refresh anytime to see live queue updates as consultations conclude.
            </p>
            <button
              onClick={() => fetchTracking(searchId, mobileNumber)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
