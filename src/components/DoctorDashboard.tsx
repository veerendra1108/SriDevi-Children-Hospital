import React, { useState, useEffect } from 'react';
import {
  Doctor,
  DoctorAccount,
  BranchId,
  Appointment,
  SystemConfiguration,
  PrescriptionItem,
  Prescription,
  Encounter,
  MedicineForm,
  DoseFrequency,
  MealTiming,
} from '../types/index.js';
import {
  Stethoscope,
  Clock,
  MapPin,
  Calendar,
  User,
  Users,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Search,
  ArrowRight,
  Sparkles,
  Heart,
  Scale,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Activity,
  Award,
} from 'lucide-react';
import { ChildHealthDashboardModal } from './ChildHealthDashboardModal.js';

interface DoctorDashboardProps {
  doctorUser: { doctor: Doctor; account: DoctorAccount; token: string };
  config: SystemConfiguration;
  onLogout: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorUser,
  config,
  onLogout,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchId>(
    doctorUser.account.primaryBranchId || doctorUser.doctor.branches[0] || 'kakinada'
  );
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active consultation state
  const [activeAppointment, setActiveAppointment] = useState<any | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [activeChildDetails, setActiveChildDetails] = useState<any | null>(null);

  // Clinical inputs
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [specialNotesEn, setSpecialNotesEn] = useState('Give plenty of fluids and oral hydration. Return immediately if high fever persists or breathing difficulty develops.');
  const [specialNotesTe, setSpecialNotesTe] = useState('ద్రవ పదార్థాలు ఎక్కువగా ఇవ్వండి. అధిక జ్వరం తగ్గకపోయినా లేదా ఆయాసం వచ్చినా వెంటనే తీసుకురండి.');

  // Vitals inputs in consultation
  const [currentHeight, setCurrentHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentTemp, setCurrentTemp] = useState('98.6');
  const [currentPulse, setCurrentPulse] = useState('');

  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);

  // Allergy warning alert in prescription
  const [allergyContraindication, setAllergyContraindication] = useState<string | null>(null);

  // Modals
  const [inspectChildId, setInspectChildId] = useState<string | null>(null);
  const [showPrintPrescription, setShowPrintPrescription] = useState<Prescription | null>(null);

  // Quick Child Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    loadQueue();
    loadCatalog();
  }, [selectedBranch, config.simulatedDate, config.simulatedTime]);

  const loadQueue = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(
        `/api/doctor/queue?doctorId=${doctorUser.doctor.id}&branchId=${selectedBranch}&date=${config.simulatedDate}`,
        {
          headers: { 'x-doctor-token': doctorUser.token },
        }
      );
      const data = await res.json();
      if (data.success) {
        setQueueData(data);

        // If an appointment is currently WITH_DOCTOR, automatically select it if none active
        if (data.currentPatient && (!activeAppointment || activeAppointment.id !== data.currentPatient.id)) {
          startConsultationForAppt(data.currentPatient);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const res = await fetch('/api/emr/medicines/catalog');
      const data = await res.json();
      if (data.success) {
        setCatalog(data.catalog);
      }
    } catch (err) {
      console.error('Failed to load medicine catalog:', err);
    }
  };

  const startConsultationForAppt = async (appt: any) => {
    setActiveAppointment(appt);
    setAllergyContraindication(null);

    // Fetch full child record to get active allergies and past growth
    try {
      const childRes = await fetch(`/api/emr/children/${appt.childId}`);
      const childData = await childRes.json();
      if (childData.success) {
        setActiveChildDetails(childData);

        const prevGrowth = childData.growthRecords?.[0];
        setCurrentHeight(appt.heightCm ? String(appt.heightCm) : prevGrowth?.heightCm ? String(prevGrowth.heightCm) : '');
        setCurrentWeight(appt.weightKg ? String(appt.weightKg) : prevGrowth?.weightKg ? String(prevGrowth.weightKg) : '');
        setCurrentTemp(appt.temperatureF ? String(appt.temperatureF) : '98.6');
        setCurrentPulse(appt.pulseRate ? String(appt.pulseRate) : '100');
      }

      // Start encounter on server
      const encRes = await fetch('/api/emr/encounters/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser.token,
        },
        body: JSON.stringify({
          childId: appt.childId,
          appointmentId: appt.id,
          doctorId: doctorUser.doctor.id,
          branchId: selectedBranch,
        }),
      });

      const encData = await encRes.json();
      if (encData.success) {
        setActiveEncounter(encData.encounter);
        setDiagnosis(encData.encounter.diagnosis || 'Acute Upper Respiratory Infection');
        setChiefComplaints(['Fever', 'Cough']);
      }
    } catch (err) {
      console.error('Error starting consultation encounter:', err);
    }
  };

  // Add medicine from quick-catalog
  const handleAddCatalogMedicine = (med: any) => {
    // Check allergy conflict
    if (activeChildDetails?.allergies) {
      const hasConflict = activeChildDetails.allergies.some(
        (a: any) =>
          a.status === 'ACTIVE' &&
          (med.medicineName.toLowerCase().includes(a.substance.toLowerCase()) ||
            (med.genericName && med.genericName.toLowerCase().includes(a.substance.toLowerCase())) ||
            (a.substance.toLowerCase().includes('amox') && med.medicineName.toLowerCase().includes('augm')))
      );

      if (hasConflict) {
        setAllergyContraindication(
          `CRITICAL CONTRAINDICATION: Patient has documented allergy to ${med.genericName || med.medicineName}! Prescription blocked for safety.`
        );
        return;
      }
    }

    setAllergyContraindication(null);

    const newItem: PrescriptionItem = {
      id: `item-${Date.now()}-${prescriptionItems.length}`,
      medicineName: med.medicineName,
      genericName: med.genericName,
      form: med.form,
      strength: med.strength,
      dosage: med.defaultDosage || '5 ml',
      frequency: med.frequency || 'TWICE_DAILY',
      timing: med.timing || 'AFTER_FOOD',
      durationDays: med.defaultDurationDays || 5,
      timeSlots: ['Morning', 'Night'],
      instructionEn: `Take ${med.defaultDosage} (${med.form}) ${med.frequency.replace(/_/g, ' ')}, ${med.timing.replace(/_/g, ' ')} for ${med.defaultDurationDays} days.`,
      instructionTe: `${med.defaultDosage} (${med.form}) రోజుకు రెండుసార్లు, ఆహారం తర్వాత ${med.defaultDurationDays} రోజుల పాటు వేయండి.`,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
  };

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
  };

  const handleFinalizeConsultation = async () => {
    if (!activeEncounter) return;
    setFinalizing(true);
    try {
      // Save growth if updated
      if (currentHeight && currentWeight) {
        await fetch(`/api/emr/children/${activeEncounter.childId}/growth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify({
            heightCm: Number(currentHeight),
            weightKg: Number(currentWeight),
            temperatureF: currentTemp ? Number(currentTemp) : undefined,
            pulseRate: currentPulse ? Number(currentPulse) : undefined,
            recordedByRole: 'DOCTOR',
            recordedByName: doctorUser.doctor.name,
            appointmentId: activeAppointment?.id,
          }),
        });
      }

      // Finalize encounter
      const res = await fetch(`/api/emr/encounters/${activeEncounter.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser.token,
        },
        body: JSON.stringify({
          diagnosis,
          chiefComplaints,
          clinicalObservations,
          followUpDate,
          items: prescriptionItems,
          specialNotesEn,
          specialNotesTe,
          doctorId: doctorUser.doctor.id,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setShowPrintPrescription(resData.prescription);
        setActiveAppointment(null);
        setActiveEncounter(null);
        setActiveChildDetails(null);
        setPrescriptionItems([]);
        loadQueue();
      }
    } catch (err) {
      console.error('Failed to finalize encounter:', err);
    } finally {
      setFinalizing(false);
    }
  };

  const handleSearchChildren = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/emr/children/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.children);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Professional App Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-800/40 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none">
                  {doctorUser.doctor.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  Reg: {doctorUser.account.medicalRegistrationNo || 'APMC-38492'}
                </span>
              </div>
              <div className="text-xs text-teal-200/80 flex items-center gap-2 mt-0.5">
                <span>{doctorUser.doctor.qualifications}</span>
                <span>•</span>
                <span className="text-white font-medium">{doctorUser.doctor.specialty}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center bg-black/30 rounded-xl p-1 border border-teal-700/40 text-xs font-semibold">
              <button
                onClick={() => setSelectedBranch('kakinada')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedBranch === 'kakinada' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-200 hover:text-white'
                }`}
              >
                Kakinada OPD
              </button>
              <button
                onClick={() => setSelectedBranch('pithapuram')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedBranch === 'pithapuram' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-200 hover:text-white'
                }`}
              >
                Pithapuram OPD
              </button>
            </div>

            {/* Refresh Live Queue */}
            <button
              onClick={loadQueue}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 hover:text-white transition"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Desk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Quick Search & KPI Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Fast Child EMR Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="doctor-child-search-input"
              value={searchQuery}
              onChange={(e) => handleSearchChildren(e.target.value)}
              placeholder="Search Child ID (DM-SDCH-...), Mobile, Name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />

            {/* Search Dropdown Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 max-h-80 overflow-y-auto p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                  Matching Patients ({searchResults.length})
                </div>
                {searchResults.map((c) => (
                  <button
                    key={c.childId}
                    onClick={() => {
                      setInspectChildId(c.childId);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-teal-50 transition flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-teal-800 flex items-center gap-1.5">
                        <span>{c.childName}</span>
                        <span className="font-mono text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                          {c.permanentId}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Parent: {c.parentName} ({c.parentMobile}) • {c.ageYears} Yrs ({c.gender})
                      </div>
                    </div>
                    {c.activeAllergyCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        {c.activeAllergyCount} Allergy
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* OPD Live Counters */}
          <div className="flex items-center gap-3 text-xs flex-wrap justify-center">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">OPD Session:</span>
              <strong className="text-slate-900 font-bold">{selectedBranch.toUpperCase()}</strong>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900 font-medium">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Waiting: <strong>{queueData?.counts?.waiting || 0}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 text-sky-900 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Upcoming: <strong>{queueData?.counts?.upcoming || 0}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed Today: <strong>{queueData?.counts?.completed || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main OPD Workspace: 2-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Smart OPD Live Patient Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm">Today&rsquo;s OPD Queue</h2>
                  <p className="text-[11px] text-slate-500">{config.simulatedDate} • Smart OPD Synced</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {queueData?.allAppointments?.length || 0} Scheduled
              </span>
            </div>

            {/* Active In-Consultation Patient Card */}
            {activeAppointment && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-400 shadow-sm relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Currently In Room
                </div>

                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Token #{activeAppointment.appointmentNumber}
                </div>
                <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{activeAppointment.childName}</span>
                  <span className="font-mono text-xs font-bold bg-white text-teal-800 px-2 py-0.5 rounded-md border border-teal-300">
                    {activeAppointment.childPermanentId}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Parent: <strong>{activeAppointment.parentName}</strong> ({activeAppointment.parentMobile})
                </div>

                {activeAppointment.criticalAllergyCount > 0 && (
                  <div className="mt-2.5 py-1 px-2.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Active Allergy: {activeAppointment.activeAllergies?.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Waiting List */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Waiting in Hospital Lobby ({queueData?.waitingPatients?.length || 0})</span>
                <span className="text-[10px] text-teal-600 font-normal">Ready for doctor</span>
              </div>

              {queueData?.waitingPatients && queueData.waitingPatients.length > 0 ? (
                queueData.waitingPatients.map((appt: any) => {
                  const isCurrent = activeAppointment?.id === appt.id;
                  return (
                    <div
                      key={appt.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isCurrent
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                              {appt.appointmentNumber}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{appt.childName}</span>
                            <span className="text-xs text-slate-500">({appt.childAge || 3}y)</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span className="font-mono text-teal-700 font-semibold">{appt.childPermanentId}</span>
                            <span>•</span>
                            <span>Slot: {appt.bookedTime}</span>
                            <span>•</span>
                            <span>Arrived: {appt.actualArrivalTime || 'Yes'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setInspectChildId(appt.childId)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-slate-50"
                            title="Inspect Child EMR"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startConsultationForAppt(appt)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1"
                          >
                            <span>Consult</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {appt.criticalAllergyCount > 0 && (
                        <div className="mt-2 py-0.5 px-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>ALLERGY: {appt.activeAllergies?.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-400 text-xs py-6 text-center bg-slate-50 rounded-2xl">
                  No children currently waiting in the lobby.
                </div>
              )}
            </div>

            {/* Upcoming List Accordion */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming Appointments Today ({queueData?.upcomingPatients?.length || 0})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {queueData?.upcomingPatients?.slice(0, 5).map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{appt.appointmentNumber}</span>
                      <span className="text-slate-500 ml-2">{appt.childName}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">{appt.bookedTime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pediatric Consultation Pad & Bilingual Prescription Pad (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeAppointment ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Consultation Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-900 font-mono font-bold text-xs">
                      {activeAppointment.childPermanentId}
                    </span>
                    <h2 className="text-xl font-black text-slate-900">{activeAppointment.childName}</h2>
                    <span className="text-xs text-slate-500">
                      {activeChildDetails?.child?.gender || 'Child'}, {activeChildDetails?.child?.ageYears || 3} Yrs
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Parent: {activeAppointment.parentName} ({activeAppointment.parentMobile}) • Blood: {activeChildDetails?.child?.bloodGroup || 'B+'}
                  </div>
                </div>

                <button
                  onClick={() => setInspectChildId(activeAppointment.childId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Full EMR History</span>
                </button>
              </div>

              {/* Persistent Critical Allergies Alert in Consultation */}
              {activeChildDetails?.allergies && activeChildDetails.allergies.some((a: any) => a.status === 'ACTIVE') && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-start gap-3 text-rose-950 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs">
                    <div className="font-extrabold uppercase tracking-wider text-rose-800">
                      Documented Drug Allergy Alert!
                    </div>
                    <div className="font-medium mt-0.5">
                      {activeChildDetails.allergies
                        .filter((a: any) => a.status === 'ACTIVE')
                        .map((a: any) => `${a.substance} (${a.reaction} - ${a.severity})`)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Allergy Contraindication Banner if doctor picks contraindicated drug */}
              {allergyContraindication && (
                <div className="p-3.5 bg-rose-600 text-white rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-shake">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{allergyContraindication}</span>
                  </div>
                  <button onClick={() => setAllergyContraindication(null)} className="text-white/80 hover:text-white">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Vitals Triage & Pediatric BMI Strip */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-teal-600" />
                    Pediatric Vitals &amp; Growth Trajectory
                  </span>
                  {currentHeight && currentWeight && (
                    <span className="text-[11px] text-teal-700 font-bold">
                      Calculated BMI: {(Number(currentWeight) / ((Number(currentHeight) / 100) ** 2)).toFixed(1)} kg/m²
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentHeight}
                      onChange={(e) => setCurrentHeight(e.target.value)}
                      placeholder="e.g. 98"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:ring-1 focus:ring-teal-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder="e.g. 14.5"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:ring-1 focus:ring-teal-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentTemp}
                      onChange={(e) => setCurrentTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={currentPulse}
                      onChange={(e) => setCurrentPulse(e.target.value)}
                      placeholder="100"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chief Complaints & Clinical Observations */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Common Chief Complaints</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Fever', 'Cough', 'Cold / Runny Nose', 'Vomiting', 'Loose Stools', 'Wheezing', 'Ear Pain', 'Skin Rash', 'Reduced Appetite'].map((complaint) => {
                      const isSelected = chiefComplaints.includes(complaint);
                      return (
                        <button
                          key={complaint}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setChiefComplaints(chiefComplaints.filter((c) => c !== complaint));
                            } else {
                              setChiefComplaints([...chiefComplaints, complaint]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {complaint}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Provisional / Confirmed Diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI), Viral Bronchitis"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Digital Fast Prescription Pad */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Fast Digital Prescription Pad</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Automatic bilingual English &amp; Telugu parent instruction schedule
                    </p>
                  </div>
                </div>

                {/* 1-Click Pediatric Medicines Catalog */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Quick-Add Pediatric Formulations (1-Click)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.map((med, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddCatalogMedicine(med)}
                        className="text-[11px] font-semibold bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-800 px-2.5 py-1.5 rounded-xl transition shadow-2xs text-left"
                      >
                        <span className="text-teal-700 font-bold">+</span> {med.medicineName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prescribed Items Table / List */}
                <div className="space-y-3">
                  {prescriptionItems.length > 0 ? (
                    prescriptionItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs relative space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{item.medicineName}</div>
                            <div className="text-slate-500 text-[11px] font-medium">
                              Form: <strong>{item.form}</strong> • Dose: <strong>{item.dosage}</strong> • Frequency: <strong>{item.frequency.replace(/_/g, ' ')}</strong> ({item.durationDays} Days)
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePrescriptionItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bilingual Translation Card */}
                        <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100/80 space-y-1">
                          <div className="text-[11px] text-slate-700">
                            <strong>English: </strong>{item.instructionEn}
                          </div>
                          <div className="text-[11px] text-teal-900 font-semibold">
                            <strong>తెలుగు (Telugu): </strong>{item.instructionTe}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      No medicines added yet. Click any formulation above to generate bilingual instructions.
                    </div>
                  )}
                </div>

                {/* Special Instructions & Follow-up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diet / Fluid Advice (English)</label>
                    <textarea
                      rows={2}
                      value={specialNotesEn}
                      onChange={(e) => setSpecialNotesEn(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ఆహారం / సూచనలు (Telugu)</label>
                    <textarea
                      rows={2}
                      value={specialNotesTe}
                      onChange={(e) => setSpecialNotesTe(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Finalize Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAppointment(null);
                      setActiveEncounter(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Discard / Pause
                  </button>

                  <button
                    type="button"
                    disabled={finalizing || !diagnosis}
                    onClick={handleFinalizeConsultation}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {finalizing ? (
                      <span>Finalizing Consultation...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finalize Consultation &amp; Print Prescription</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pediatric Consultation Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a waiting child from the OPD queue on the left or search by permanent Child ID to begin consultation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Child EMR Health Dashboard Modal */}
      {inspectChildId && (
        <ChildHealthDashboardModal
          isOpen={Boolean(inspectChildId)}
          onClose={() => setInspectChildId(null)}
          childId={inspectChildId}
          doctorUser={doctorUser}
          onRefresh={loadQueue}
        />
      )}

      {/* Print Prescription Preview Modal */}
      {showPrintPrescription && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Sri Devi Children Hospital</h3>
                  <div className="text-xs text-slate-500">Kakinada &amp; Pithapuram • Pediatric OPD</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-md border border-teal-200">
                  {showPrintPrescription.prescriptionNumber}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">{showPrintPrescription.date}</div>
              </div>
            </div>

            {/* Doctor & Patient Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <div className="text-slate-500">Pediatrician:</div>
                <div className="font-bold text-slate-900">{showPrintPrescription.doctorName}</div>
                <div className="text-teal-700 font-semibold">Reg. No: {showPrintPrescription.doctorRegNo}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500">Patient:</div>
                <div className="font-bold text-slate-900">{showPrintPrescription.childName}</div>
                <div className="font-mono text-teal-800 font-bold">{showPrintPrescription.childPermanentId}</div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="py-3 text-xs">
              <span className="text-slate-500">Diagnosis: </span>
              <strong className="text-slate-900 font-bold">{showPrintPrescription.diagnosis}</strong>
            </div>

            {/* Prescribed Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden my-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">Medicine &amp; Dosage</th>
                    <th className="p-3">English Instructions</th>
                    <th className="p-3">తెలుగు సూచనలు (Telugu)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showPrintPrescription.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.medicineName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.dosage} ({item.form}) • {item.durationDays} Days
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">{item.instructionEn}</td>
                      <td className="p-3 text-teal-900 font-semibold">{item.instructionTe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Special Instructions */}
            {(showPrintPrescription.specialNotesEn || showPrintPrescription.specialNotesTe) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 my-3">
                <div className="font-bold text-slate-800">Special Instructions:</div>
                {showPrintPrescription.specialNotesEn && (
                  <div className="text-slate-600">• {showPrintPrescription.specialNotesEn}</div>
                )}
                {showPrintPrescription.specialNotesTe && (
                  <div className="text-teal-900 font-medium">• {showPrintPrescription.specialNotesTe}</div>
                )}
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="pt-6 flex items-end justify-between text-xs">
              <div className="text-[11px] text-slate-400">
                Generated via Doctormate Pediatric EMR • Sri Devi Children Hospital
              </div>
              <div className="text-right">
                <div className="w-32 border-b border-slate-400 pb-1 mb-1 text-[11px] text-slate-500 italic">
                  Digitally Authenticated
                </div>
                <div className="font-bold text-slate-900">{showPrintPrescription.doctorName}</div>
                <div className="text-[11px] text-slate-500">APMC Registered Pediatrician</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowPrintPrescription(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
