import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  X,
  Filter,
  Pill,
  ChevronDown,
  Info,
  Settings,
  Sliders,
  Maximize2,
  Check,
  BookOpen,
} from 'lucide-react';
import { ChildHealthDashboardModal } from './ChildHealthDashboardModal.js';
import {
  PEDIATRIC_DIAGNOSES,
  PediatricDiagnosis,
  RecommendedMedicine,
} from '../data/pediatricDiagnoses.js';
import { PediatricGrowthChart } from './PediatricGrowthChart.js';
import { PrescriptionGrowthBackPage } from './PrescriptionGrowthBackPage.js';
import './DoctorDashboard.css';

interface DoctorDashboardProps {
  doctorUser: { doctor: Doctor; account: DoctorAccount; token: string };
  config: SystemConfiguration;
  onLogout: () => void;
}

interface MedicineToConfigure {
  medicineName: string;
  genericName?: string;
  form: MedicineForm;
  strength?: string;
  defaultDosage?: string;
  dosageUnit?: 'ml' | 'drops' | 'tablet' | 'puff' | 'sachet' | 'application';
  dosageAmount?: string;
  frequency?: DoseFrequency;
  timing?: MealTiming;
  defaultDurationDays?: number;
  instructionsHint?: string;
}

function buildClientBilingualInstructions(
  form: MedicineForm,
  dosage: string,
  frequency: DoseFrequency,
  timing: MealTiming,
  durationDays: number,
  route?: string,
  site?: string,
  instructionsHint?: string
) {
  const freqMap: Record<DoseFrequency, { en: string; te: string; slots: ('Morning' | 'Afternoon' | 'Night')[] }> = {
    ONCE_DAILY: { en: 'Once daily', te: 'రోజుకు ఒకసారి', slots: ['Morning'] },
    TWICE_DAILY: { en: 'Twice daily', te: 'రోజుకు రెండుసార్లు', slots: ['Morning', 'Night'] },
    THRICE_DAILY: { en: 'Three times daily', te: 'రోజుకు మూడుసార్లు', slots: ['Morning', 'Afternoon', 'Night'] },
    FOUR_TIMES_DAILY: { en: 'Four times daily (every 6 hours)', te: 'రోజుకు నాలుగుసార్లు (ప్రతి 6 గంటలకు)', slots: ['Morning', 'Afternoon', 'Night'] },
    SOS: { en: 'SOS (Only when fever or pain occurs)', te: 'అవసరమైనప్పుడు మాత్రమే (జ్వరం లేదా నొప్పి ఉన్నప్పుడు)', slots: ['Morning'] },
  };

  const timingMap: Record<MealTiming, { en: string; te: string }> = {
    AFTER_FOOD: { en: 'after food / milk', te: 'ఆహారం లేదా పాలు తాగిన తర్వాత' },
    BEFORE_FOOD: { en: 'before food / milk', te: 'ఆహారం లేదా పాలు తాగడానికి ముందు' },
    WITH_FOOD: { en: 'with food', te: 'ఆహారంతో పాటు' },
    AT_BEDTIME: { en: 'at bedtime', te: 'పడుకునే ముందు' },
    EMPTY_STOMACH: { en: 'on empty stomach', te: 'పరగడుపున' },
  };

  const formMap: Record<MedicineForm, { en: string; te: string }> = {
    SYRUP: { en: 'Syrup', te: 'సిరప్' },
    DROPS: { en: 'Drops', te: 'చుక్కలు' },
    TABLET: { en: 'Tablet', te: 'మాత్ర' },
    INHALER: { en: 'Inhaler puff', te: 'ఇన్హేలర్' },
    INJECTION: { en: 'Injection', te: 'ఇంజెక్షన్' },
    CREAM: { en: 'Cream / Ointment', te: 'మందు పూత' },
  };

  const f = freqMap[frequency] || freqMap.TWICE_DAILY;
  const t = timingMap[timing] || timingMap.AFTER_FOOD;
  const fm = formMap[form] || { en: form, te: form };

  const durationStrEn = durationDays > 0 ? ` for ${durationDays} day${durationDays > 1 ? 's' : ''}` : '';
  const durationStrTe = durationDays > 0 ? ` ${durationDays} రోజుల పాటు` : '';

  let routeEn = '';
  let routeTe = '';

  const r = (route || '').toLowerCase();
  const s = (site || '').toLowerCase();
  const hint = (instructionsHint || '').toLowerCase();

  if (r.includes('nasal') || s.includes('nostril') || hint.includes('nostril')) {
    routeEn = ' in each nostril';
    routeTe = ' రెండు ముక్కు రంధ్రాలలో';
  } else if (r.includes('ear') || s.includes('ear')) {
    routeEn = ' in affected ear';
    routeTe = ' చెవిలో';
  } else if (r.includes('eye') || s.includes('eye')) {
    routeEn = ' in affected eye';
    routeTe = ' కంటిలో';
  } else if (r.includes('topical') || form === 'CREAM') {
    routeEn = ' gently on affected area';
    routeTe = ' ప్రభావిత భాగంపై సున్నితంగా';
  } else if (r.includes('inhal') || form === 'INHALER') {
    routeEn = ' via spacer mask';
    routeTe = ' స్పేసర్ ద్వారా';
  }

  const verbEn = (form === 'CREAM' || r.includes('topical')) ? 'Apply' : (form === 'DROPS' ? 'Instill' : 'Take');
  const verbTe = (form === 'CREAM' || r.includes('topical')) ? 'రాయండి' : 'వేయండి';

  const hintEn = instructionsHint ? ` Note: ${instructionsHint}` : '';

  return {
    instructionEn: `${verbEn} ${dosage} (${fm.en})${routeEn} ${f.en}, ${t.en}${durationStrEn}.${hintEn}`,
    instructionTe: `${dosage} (${fm.te})${routeTe} ${f.te}, ${t.te}${durationStrTe} ${verbTe}.`,
    timeSlots: f.slots,
  };
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
  const activeAppointmentRef = useRef<any | null>(null);
  activeAppointmentRef.current = activeAppointment;
  const activeEncounterRef = useRef<Encounter | null>(null);
  activeEncounterRef.current = activeEncounter;
  const [activeChildDetails, setActiveChildDetails] = useState<any | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

  // Notice of just-completed patient (allows 1-click print without blocking next patient)
  const [lastCompletedPatientNotice, setLastCompletedPatientNotice] = useState<{
    childName: string;
    appointmentNumber: string;
    prescription: Prescription | null;
    hasNextPatient: boolean;
  } | null>(null);

  // Clinical inputs (Strictly empty defaults - no synthetic URTI/Fever/Cough)
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedDiagnosisObj, setSelectedDiagnosisObj] = useState<PediatricDiagnosis | null>(null);
  const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState('');
  const [selectedDiagnosisCategory, setSelectedDiagnosisCategory] = useState<string>('All');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);

  const [clinicalObservations, setClinicalObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [specialNotesEn, setSpecialNotesEn] = useState('');
  const [specialNotesTe, setSpecialNotesTe] = useState('');

  // Vitals inputs in consultation (Strictly empty defaults - no unmeasured 98.6°F / 100 bpm)
  const [currentHeight, setCurrentHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentTemp, setCurrentTemp] = useState('');
  const [currentPulse, setCurrentPulse] = useState('');

  // Prescription items & catalog
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Medicine Dosage & Schedule Configurator Modal
  const [configuringMedicine, setConfiguringMedicine] = useState<MedicineToConfigure | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [modalMedicineName, setModalMedicineName] = useState('');
  const [modalGenericName, setModalGenericName] = useState('');
  const [modalForm, setModalForm] = useState<MedicineForm>('SYRUP');
  const [modalStrength, setModalStrength] = useState('');
  const [modalDosageAmount, setModalDosageAmount] = useState('5');
  const [modalDosageUnit, setModalDosageUnit] = useState<'ml' | 'drops' | 'tablet' | 'puff' | 'sachet' | 'application'>('ml');
  const [modalFrequency, setModalFrequency] = useState<DoseFrequency>('TWICE_DAILY');
  const [modalTiming, setModalTiming] = useState<MealTiming>('AFTER_FOOD');
  const [modalDurationDays, setModalDurationDays] = useState(5);
  const [modalRoute, setModalRoute] = useState<string>('Oral');
  const [modalSite, setModalSite] = useState<string>('');
  const [isCustomMedicine, setIsCustomMedicine] = useState(false);

  // Allergy warning alert in prescription
  const [allergyContraindication, setAllergyContraindication] = useState<string | null>(null);

  // Modals
  const [inspectChildId, setInspectChildId] = useState<string | null>(null);
  const [showPrintPrescription, setShowPrintPrescription] = useState<Prescription | null>(null);
  const [prescriptionPreviewTab, setPrescriptionPreviewTab] = useState<'both' | 'front' | 'back'>('both');

  // Quick Child Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [finalizing, setFinalizing] = useState(false);

  // Top-level Doctor Desk Tabs: Consultation Desk vs Settings
  const [activeDeskTab, setActiveDeskTab] = useState<'consultation' | 'settings'>('consultation');

  // Adjustable drawer tab width for Medicine Configurator
  const [drawerWidth, setDrawerWidth] = useState<'compact' | 'standard' | 'wide'>('standard');

  // Master pediatric diagnoses (dynamically loaded from backend, initialized with 18 master conditions)
  const [masterDiagnoses, setMasterDiagnoses] = useState<PediatricDiagnosis[]>(PEDIATRIC_DIAGNOSES);
  const [settingsCategoryFilter, setSettingsCategoryFilter] = useState<string>('All');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');
  const [isAddDiagnosisModalOpen, setIsAddDiagnosisModalOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<PediatricDiagnosis | null>(null);

  // Form state for creating/modifying diagnosis in Doctor Settings
  const [formDiagName, setFormDiagName] = useState('');
  const [formDiagTeluguName, setFormDiagTeluguName] = useState('');
  const [formDiagCategory, setFormDiagCategory] = useState<any>('General Pediatrics');
  const [formDiagIcdCode, setFormDiagIcdCode] = useState('R69');
  const [formDiagSymptoms, setFormDiagSymptoms] = useState('');
  const [formDiagFollowUpDays, setFormDiagFollowUpDays] = useState(3);
  const [formDiagNotesEn, setFormDiagNotesEn] = useState('');
  const [formDiagNotesTe, setFormDiagNotesTe] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  useEffect(() => {
    loadQueue();
    loadCatalog();
    loadDiagnoses();

    // Automatic real-time queue polling every 3 seconds so next patient & queue stay live without manual refresh
    const queueInterval = setInterval(() => {
      loadQueueSilent();
    }, 3000);

    return () => clearInterval(queueInterval);
  }, [selectedBranch, config.simulatedDate, config.simulatedTime]);

  // D06: Auto-save active consultation draft to localStorage
  useEffect(() => {
    if (!activeAppointment?.id) return;
    const draftKey = `sdch_draft_${doctorUser.doctor.id}_${activeAppointment.id}`;
    const draftData = {
      appointmentId: activeAppointment.id,
      childId: activeAppointment.childId,
      branchId: selectedBranch,
      chiefComplaints,
      clinicalObservations,
      diagnosis,
      selectedDiagnosisObj,
      followUpDate,
      specialNotesEn,
      specialNotesTe,
      currentHeight,
      currentWeight,
      currentTemp,
      currentPulse,
      prescriptionItems,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (e) {
      // Storage quota or private browsing
    }
  }, [
    activeAppointment?.id,
    selectedBranch,
    chiefComplaints,
    clinicalObservations,
    diagnosis,
    selectedDiagnosisObj,
    followUpDate,
    specialNotesEn,
    specialNotesTe,
    currentHeight,
    currentWeight,
    currentTemp,
    currentPulse,
    prescriptionItems,
    doctorUser.doctor.id,
  ]);

  // D06: Warn before browser refresh or close if consultation has unsaved inputs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent =
        activeAppointment &&
        (prescriptionItems.length > 0 ||
          clinicalObservations.trim().length > 0 ||
          diagnosis.trim().length > 0 ||
          chiefComplaints.length > 0 ||
          currentHeight ||
          currentWeight);
      if (hasContent) {
        e.preventDefault();
        e.returnValue = 'You have unsaved clinical consultation notes. Leave anyway?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeAppointment, prescriptionItems, clinicalObservations, diagnosis, chiefComplaints, currentHeight, currentWeight]);

  const loadDiagnoses = async () => {
    try {
      const res = await fetch('/api/emr/diagnoses');
      const data = await res.json();
      if (data.success && Array.isArray(data.diagnoses)) {
        setMasterDiagnoses(data.diagnoses);
      }
    } catch (err) {
      console.warn('Failed to load master diagnoses:', err);
    }
  };

  const handleOpenAddDiagnosis = () => {
    setEditingDiagnosis(null);
    setFormDiagName('');
    setFormDiagTeluguName('');
    setFormDiagCategory('General Pediatrics');
    setFormDiagIcdCode('R69');
    setFormDiagSymptoms('Fever, Cough');
    setFormDiagFollowUpDays(3);
    setFormDiagNotesEn('Ensure adequate hydration and observe closely. Return if high fever persists.');
    setFormDiagNotesTe('తగినంత ద్రవాలు తాగించండి మరియు జాగ్రత్తగా గమనించండి. జ్వరం తగ్గకపోతే వెంటనే తీసుకురండి.');
    setIsAddDiagnosisModalOpen(true);
  };

  const handleOpenEditDiagnosis = (diag: PediatricDiagnosis) => {
    setEditingDiagnosis(diag);
    setFormDiagName(diag.name);
    setFormDiagTeluguName(diag.teluguName);
    setFormDiagCategory(diag.category);
    setFormDiagIcdCode(diag.icdCode);
    setFormDiagSymptoms(diag.typicalSymptoms.join(', '));
    setFormDiagFollowUpDays(diag.defaultFollowUpDays);
    setFormDiagNotesEn(diag.specialNotesEn);
    setFormDiagNotesTe(diag.specialNotesTe);
    setIsAddDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDiagName.trim()) return;
    setSavingDiagnosis(true);
    try {
      const payload = {
        name: formDiagName.trim(),
        teluguName: formDiagTeluguName.trim() || formDiagName.trim(),
        category: formDiagCategory,
        icdCode: formDiagIcdCode.trim() || 'R69',
        typicalSymptoms: formDiagSymptoms.split(',').map((s) => s.trim()).filter(Boolean),
        defaultFollowUpDays: Number(formDiagFollowUpDays) || 3,
        specialNotesEn: formDiagNotesEn.trim(),
        specialNotesTe: formDiagNotesTe.trim(),
        recommendedMedicines: editingDiagnosis?.recommendedMedicines || [],
      };

      let res;
      if (editingDiagnosis) {
        res = await fetch(`/api/emr/diagnoses/${editingDiagnosis.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/emr/diagnoses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (resData.success) {
        await loadDiagnoses();
        setIsAddDiagnosisModalOpen(false);
        setEditingDiagnosis(null);
      }
    } catch (err) {
      console.error('Failed to save diagnosis:', err);
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const handleDeleteDiagnosis = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the protocol for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/emr/diagnoses/${id}`, {
        method: 'DELETE',
        headers: { 'x-doctor-token': doctorUser.token },
      });
      const data = await res.json();
      if (data.success) {
        await loadDiagnoses();
      }
    } catch (err) {
      console.error('Failed to delete diagnosis:', err);
    }
  };

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
        if (data.currentPatient && (!activeAppointmentRef.current || activeAppointmentRef.current.id !== data.currentPatient.id)) {
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

  const loadQueueSilent = async () => {
    try {
      const res = await fetch(
        `/api/doctor/queue?doctorId=${doctorUser.doctor.id}&branchId=${selectedBranch}&date=${config.simulatedDate}`,
        {
          headers: { 'x-doctor-token': doctorUser.token },
        }
      );
      const data = await res.json();
      if (data.success) {
        setQueueData(data);
        if (data.currentPatient && (!activeAppointmentRef.current || activeAppointmentRef.current.id !== data.currentPatient.id)) {
          startConsultationForAppt(data.currentPatient);
        }
      }
    } catch (err) {
      // Background poll failure handled silently
    }
  };

  // Branch Switch with active consultation protection (D08)
  const handleBranchSwitch = (newBranch: BranchId) => {
    if (newBranch === selectedBranch) return;
    if (activeAppointment) {
      const confirmSwitch = window.confirm(
        `You currently have an active consultation open for Token #${activeAppointment.appointmentNumber} (${activeAppointment.childName}) at ${selectedBranch.toUpperCase()}.\n\nSwitching branches will save your consultation draft and clear this patient from the consultation desk.\n\nDo you want to switch to ${newBranch.toUpperCase()}?`
      );
      if (!confirmSwitch) return;

      // Persist draft to localStorage before switching (D06 & D08)
      try {
        const draftKey = `sdch_draft_${doctorUser.doctor.id}_${activeAppointment.id}`;
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            appointmentId: activeAppointment.id,
            childId: activeAppointment.childId,
            chiefComplaints,
            clinicalObservations,
            diagnosis,
            selectedDiagnosisObj,
            followUpDate,
            specialNotesEn,
            specialNotesTe,
            currentHeight,
            currentWeight,
            currentTemp,
            currentPulse,
            prescriptionItems,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (e) {}

      // Reset active consultation states
      setActiveAppointment(null);
      setActiveEncounter(null);
      setActiveChildDetails(null);
      activeAppointmentRef.current = null;
      activeEncounterRef.current = null;
      setPrescriptionItems([]);
      setDiagnosis('');
      setSelectedDiagnosisObj(null);
      setChiefComplaints([]);
      setClinicalObservations('');
      setFollowUpDate('');
      setSpecialNotesEn('');
      setSpecialNotesTe('');
      setCurrentHeight('');
      setCurrentWeight('');
      setCurrentTemp('');
      setCurrentPulse('');
    }
    setSelectedBranch(newBranch);
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
    if (activeAppointmentRef.current?.id === appt.id && activeEncounterRef.current) {
      return;
    }
    activeAppointmentRef.current = appt;
    setActiveAppointment(appt);
    setAllergyContraindication(null);

    // D05/D07: Clean slate for every patient - strictly NO misleading dummy defaults
    setPrescriptionItems([]);
    setChiefComplaints([]);
    setDiagnosis('');
    setSelectedDiagnosisObj(null);
    setClinicalObservations('');
    setSpecialNotesEn('');
    setSpecialNotesTe('');
    setFollowUpDate('');
    setCurrentHeight(appt.heightCm ? String(appt.heightCm) : '');
    setCurrentWeight(appt.weightKg ? String(appt.weightKg) : '');
    setCurrentTemp(appt.temperatureF ? String(appt.temperatureF) : '');
    setCurrentPulse(appt.pulseRate ? String(appt.pulseRate) : '');

    // D06: Check if there is an unsaved recovered draft for this consultation in localStorage
    const draftKey = `sdch_draft_${doctorUser.doctor.id}_${appt.id}`;
    let hasRecoveredDraft = false;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d && d.appointmentId === appt.id) {
          if (Array.isArray(d.chiefComplaints)) setChiefComplaints(d.chiefComplaints);
          if (d.clinicalObservations) setClinicalObservations(d.clinicalObservations);
          if (d.diagnosis) setDiagnosis(d.diagnosis);
          if (d.selectedDiagnosisObj) setSelectedDiagnosisObj(d.selectedDiagnosisObj);
          if (d.followUpDate) setFollowUpDate(d.followUpDate);
          if (d.specialNotesEn) setSpecialNotesEn(d.specialNotesEn);
          if (d.specialNotesTe) setSpecialNotesTe(d.specialNotesTe);
          if (d.currentHeight) setCurrentHeight(d.currentHeight);
          if (d.currentWeight) setCurrentWeight(d.currentWeight);
          if (d.currentTemp) setCurrentTemp(d.currentTemp);
          if (d.currentPulse) setCurrentPulse(d.currentPulse);
          if (Array.isArray(d.prescriptionItems)) setPrescriptionItems(d.prescriptionItems);
          hasRecoveredDraft = true;
          setDraftRestoredNotice(true);
          setTimeout(() => setDraftRestoredNotice(false), 4000);
        }
      }
    } catch (e) {}

    // Fetch full child record to get active allergies and past growth (passing doctor auth)
    try {
      const childRes = await fetch(`/api/emr/children/${appt.childId}`, {
        headers: { 'x-doctor-token': doctorUser.token },
      });
      const childData = await childRes.json();
      if (childData.success) {
        setActiveChildDetails(childData);

        if (!hasRecoveredDraft) {
          const prevGrowth = childData.growthRecords?.[0];
          if (!appt.heightCm && prevGrowth?.heightCm) setCurrentHeight(String(prevGrowth.heightCm));
          if (!appt.weightKg && prevGrowth?.weightKg) setCurrentWeight(String(prevGrowth.weightKg));
        }
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
          branchId: selectedBranch,
        }),
      });

      const encData = await encRes.json();
      if (encData.success) {
        setActiveEncounter(encData.encounter);
        if (!hasRecoveredDraft && encData.encounter.diagnosis) {
          setDiagnosis(encData.encounter.diagnosis);
          const matched = masterDiagnoses.find(
            (d) => d.name.toLowerCase() === encData.encounter.diagnosis.toLowerCase()
          );
          if (matched) setSelectedDiagnosisObj(matched);
        }
      }
    } catch (err) {
      console.error('Error starting consultation encounter:', err);
    }
  };

  // Select diagnosis from pediatric library (accepts either PediatricDiagnosis object or string name)
  const handleSelectDiagnosis = (diagOrName: PediatricDiagnosis | string) => {
    if (!diagOrName) {
      setDiagnosis('');
      setSelectedDiagnosisObj(null);
      return;
    }

    const diag =
      typeof diagOrName === 'string'
        ? masterDiagnoses.find(
            (d) =>
              d.name.toLowerCase() === diagOrName.toLowerCase() ||
              d.id.toLowerCase() === diagOrName.toLowerCase()
          ) || null
        : diagOrName;

    if (diag) {
      setSelectedDiagnosisObj(diag);
      setDiagnosis(diag.name);
      setShowDiagnosisDropdown(false);
      setDiagnosisSearchQuery('');

      // Auto-suggest typical complaints
      if (Array.isArray(diag.typicalSymptoms) && diag.typicalSymptoms.length > 0) {
        setChiefComplaints(diag.typicalSymptoms.slice(0, 3));
      }

      // Auto-calculate optimal follow-up date
      if (diag.defaultFollowUpDays) {
        const d = new Date(config.simulatedDate);
        d.setDate(d.getDate() + diag.defaultFollowUpDays);
        setFollowUpDate(d.toISOString().split('T')[0]);
      }

      // Auto-populate bilingual clinical advice
      if (diag.specialNotesEn) setSpecialNotesEn(diag.specialNotesEn);
      if (diag.specialNotesTe) setSpecialNotesTe(diag.specialNotesTe);
    } else {
      setDiagnosis(typeof diagOrName === 'string' ? diagOrName : '');
      setSelectedDiagnosisObj(null);
    }
  };

  // Preview or print prescription at any time during consultation (Unambiguously DRAFT)
  const handlePreviewPrescription = () => {
    const activeAllergies =
      activeChildDetails?.allergies
        ?.filter((a: any) => a.status === 'ACTIVE')
        ?.map((a: any) => `${a.substance} (${a.reaction || a.severity})`) || [];

    const numHeight = currentHeight ? Number(currentHeight) : (activeChildDetails?.growthRecords?.[0]?.heightCm || activeAppointment?.heightCm);
    const numWeight = currentWeight ? Number(currentWeight) : (activeChildDetails?.growthRecords?.[0]?.weightKg || activeAppointment?.weightKg);
    let previewBmi: number | undefined;
    if (numHeight && numWeight) {
      const hM = numHeight / 100;
      previewBmi = Number((numWeight / (hM * hM)).toFixed(1));
    } else {
      previewBmi = activeChildDetails?.growthRecords?.[0]?.pediatricBmi || activeAppointment?.pediatricBmi;
    }

    const rx: any = {
      id: activeEncounter?.prescriptionId || `rx-draft-${Date.now()}`,
      encounterId: activeEncounter?.id || `enc-${Date.now()}`,
      childId: activeAppointment?.childId || activeEncounter?.childId || '',
      childName: activeAppointment?.childName || activeChildDetails?.child?.name || activeChildDetails?.name || 'Child Patient',
      childPermanentId: activeAppointment?.childPermanentId || activeChildDetails?.child?.permanentId || activeChildDetails?.permanentId || '',
      childAge: activeAppointment?.childAge ?? activeChildDetails?.child?.ageYears ?? activeChildDetails?.ageYears,
      childGender: activeAppointment?.childGender || activeChildDetails?.child?.gender || activeChildDetails?.gender,
      heightCm: numHeight,
      weightKg: numWeight,
      temperatureF: currentTemp ? Number(currentTemp) : activeAppointment?.temperatureF,
      pulseRate: currentPulse ? Number(currentPulse) : activeAppointment?.pulseRate,
      pediatricBmi: previewBmi,
      bloodGroup: activeChildDetails?.child?.bloodGroup || activeAppointment?.bloodGroup,
      doctorId: doctorUser.doctor.id,
      doctorName: doctorUser.doctor.name,
      doctorRegNo:
        doctorUser.account.medicalRegistrationNo ||
        doctorUser.doctor.medicalRegistrationNo ||
        doctorUser.doctor.regNo ||
        'APMC-38492',
      branchId: selectedBranch,
      date: config.simulatedDate,
      prescriptionNumber: 'DRAFT — PENDING FINALIZATION',
      isDraft: true,
      diagnosis: diagnosis || 'Pediatric Consultation',
      items: prescriptionItems || [],
      allergyBannerSnapshot: activeAllergies,
      specialNotesEn: specialNotesEn || '',
      specialNotesTe: specialNotesTe || '',
      followUpDate: followUpDate || '',
      createdAt: new Date().toISOString(),
    };
    setShowPrintPrescription(rx);
  };

  // Open dosage configurator for any medicine (recommended or catalog)
  const openMedicineConfigurator = (med: any, editIndex: number | null = null) => {
    // Check allergy conflict first
    if (activeChildDetails?.allergies) {
      const hasConflict = activeChildDetails.allergies.some(
        (a: any) =>
          a.status === 'ACTIVE' &&
          ((med.medicineName && med.medicineName.toLowerCase().includes(a.substance.toLowerCase())) ||
            (med.genericName && med.genericName.toLowerCase().includes(a.substance.toLowerCase())) ||
            (a.substance.toLowerCase().includes('amox') && med.medicineName?.toLowerCase().includes('augm')))
      );

      if (hasConflict) {
        setAllergyContraindication(
          `CRITICAL CONTRAINDICATION: Patient has documented allergy to ${med.genericName || med.medicineName}! Prescription blocked for safety.`
        );
        return;
      }
    }

    setAllergyContraindication(null);
    setConfiguringMedicine(med);
    setEditingItemIndex(editIndex);
    setIsCustomMedicine(false);
    setModalMedicineName(med.medicineName || '');
    setModalGenericName(med.genericName || '');
    setModalForm(med.form || 'SYRUP');
    setModalStrength(med.strength || '');

    // Extract default amount and unit
    if (med.dosageAmount) {
      setModalDosageAmount(String(med.dosageAmount));
      setModalDosageUnit(med.dosageUnit || 'ml');
    } else if (med.dosage) {
      const parts = String(med.dosage).split(' ');
      setModalDosageAmount(parts[0] || '5');
      setModalDosageUnit((parts[1] as any) || (med.form === 'DROPS' ? 'drops' : 'ml'));
    } else if (med.defaultDosage) {
      const parts = String(med.defaultDosage).split(' ');
      setModalDosageAmount(parts[0] || '5');
      setModalDosageUnit((parts[1] as any) || (med.form === 'DROPS' ? 'drops' : 'ml'));
    } else {
      setModalDosageAmount(med.form === 'DROPS' ? '8' : med.form === 'TABLET' ? '1' : '5');
      setModalDosageUnit(med.form === 'DROPS' ? 'drops' : med.form === 'TABLET' ? 'tablet' : 'ml');
    }

    setModalFrequency(med.frequency || 'TWICE_DAILY');
    setModalTiming(med.timing || 'AFTER_FOOD');
    setModalDurationDays(med.durationDays || med.defaultDurationDays || 5);

    // Auto-detect route & site from med properties or defaults (D11)
    if (med.route) {
      setModalRoute(med.route);
      setModalSite(med.site || '');
    } else if (
      (med.form === 'DROPS' || med.medicineName?.toLowerCase().includes('drop')) &&
      (med.medicineName?.toLowerCase().includes('nasal') ||
        med.medicineName?.toLowerCase().includes('saline') ||
        med.instructionsHint?.toLowerCase().includes('nostril'))
    ) {
      setModalRoute('Nasal');
      setModalSite('both nostrils');
    } else if (med.form === 'CREAM') {
      setModalRoute('Topical');
      setModalSite('affected area');
    } else if (med.form === 'INHALER') {
      setModalRoute('Inhalation');
      setModalSite('spacer mask');
    } else {
      setModalRoute('Oral');
      setModalSite('');
    }
  };

  // Open custom medicine configurator
  const openCustomMedicineConfigurator = () => {
    setConfiguringMedicine({
      medicineName: '',
      genericName: '',
      form: 'SYRUP',
      strength: '',
      defaultDosage: '5 ml',
      dosageUnit: 'ml',
      dosageAmount: '5',
      frequency: 'TWICE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 5,
    });
    setEditingItemIndex(null);
    setIsCustomMedicine(true);
    setModalMedicineName('');
    setModalGenericName('');
    setModalForm('SYRUP');
    setModalStrength('');
    setModalDosageAmount('5');
    setModalDosageUnit('ml');
    setModalFrequency('TWICE_DAILY');
    setModalTiming('AFTER_FOOD');
    setModalDurationDays(5);
    setModalRoute('Oral');
    setModalSite('');
  };

  // Save medicine from dosage configurator with strict validation (D02 & D11)
  const handleSaveConfiguredMedicine = () => {
    if (!modalMedicineName.trim()) return;

    // Enforce positive numerical bounds (D02)
    const numDose = Number(modalDosageAmount);
    if (!Number.isFinite(numDose) || numDose <= 0) {
      alert('Invalid Dose: Dosage amount must be a positive number greater than 0.');
      return;
    }
    const numDuration = Number(modalDurationDays);
    if (!Number.isFinite(numDuration) || numDuration < 1) {
      alert('Invalid Duration: Treatment duration must be at least 1 day.');
      return;
    }

    const dosageStr = `${modalDosageAmount} ${modalDosageUnit}`;
    const bilingual = buildClientBilingualInstructions(
      modalForm,
      dosageStr,
      modalFrequency,
      modalTiming,
      numDuration,
      modalRoute,
      modalSite,
      configuringMedicine?.instructionsHint
    );

    const itemData: PrescriptionItem = {
      id:
        editingItemIndex !== null
          ? prescriptionItems[editingItemIndex].id
          : `item-${Date.now()}-${prescriptionItems.length}`,
      medicineName: modalMedicineName,
      genericName: modalGenericName || undefined,
      form: modalForm,
      strength: modalStrength || undefined,
      dosage: dosageStr,
      frequency: modalFrequency,
      timing: modalTiming,
      durationDays: numDuration,
      route: modalRoute,
      site: modalSite,
      instructionsHint: configuringMedicine?.instructionsHint,
      timeSlots: bilingual.timeSlots,
      instructionEn: bilingual.instructionEn,
      instructionTe: bilingual.instructionTe,
    };

    if (editingItemIndex !== null) {
      const updated = [...prescriptionItems];
      updated[editingItemIndex] = itemData;
      setPrescriptionItems(updated);
    } else {
      setPrescriptionItems([...prescriptionItems, itemData]);
    }

    setConfiguringMedicine(null);
    setEditingItemIndex(null);
  };

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
  };

  // Complete consultation: supports both "Finalize & Finish" (callNext=false) and "Finalize & Call Next Arrived" (callNext=true)
  const handleCompleteConsultation = async (callNext: boolean, showPrintModal: boolean = false) => {
    if (!activeAppointment && !activeEncounter) return;
    setFinalizing(true);
    try {
      // Save growth if entered
      if (currentHeight && currentWeight && activeEncounter) {
        const growthRes = await fetch(`/api/emr/children/${activeEncounter.childId}/growth`, {
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
            appointmentId: activeAppointment?.id,
          }),
        });
        const growthData = await growthRes.json();
        if (!growthRes.ok || !growthData.success) {
          alert(`Growth recording failed: ${growthData.message || 'Check height/weight values.'}`);
          setFinalizing(false);
          return;
        }
      }

      let generatedPrescription: Prescription | null = null;
      let nextPatientData: any = null;

      if (activeEncounter) {
        const res = await fetch(`/api/emr/encounters/${activeEncounter.id}/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify({
            diagnosis: diagnosis || 'General Pediatric Consultation',
            chiefComplaints,
            clinicalObservations,
            followUpDate,
            items: prescriptionItems,
            specialNotesEn,
            specialNotesTe,
            callNext,
            weightKg: currentWeight ? Number(currentWeight) : (activeAppointment?.weightKg || undefined),
            heightCm: currentHeight ? Number(currentHeight) : (activeAppointment?.heightCm || undefined),
            temperatureF: currentTemp ? Number(currentTemp) : (activeAppointment?.temperatureF || undefined),
            pulseRate: currentPulse ? Number(currentPulse) : (activeAppointment?.pulseRate || undefined),
            pediatricBmi: (currentHeight && currentWeight)
              ? Number((Number(currentWeight) / Math.pow(Number(currentHeight) / 100, 2)).toFixed(1))
              : (activeAppointment?.pediatricBmi || undefined),
            bloodGroup: activeChildDetails?.child?.bloodGroup || activeAppointment?.bloodGroup,
          }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          alert(`Prescription finalization failed: ${resData.message || 'Please check prescription items.'}`);
          setFinalizing(false);
          return;
        }
        generatedPrescription = resData.prescription;
        nextPatientData = resData.nextPatient;
      } else if (activeAppointment) {
        const res = await fetch('/api/doctor/complete-treatment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify({
            branchId: selectedBranch,
            appointmentId: activeAppointment.id,
            callNext,
          }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          alert(`Completion failed: ${resData.message || 'Server error.'}`);
          setFinalizing(false);
          return;
        }
        nextPatientData = resData.nextPatient;
      }

      // Clear persisted draft from localStorage
      if (activeAppointment?.id) {
        localStorage.removeItem(`sdch_draft_${doctorUser.doctor.id}_${activeAppointment.id}`);
      }

      // Record notice of completed patient
      if (activeAppointment) {
        setLastCompletedPatientNotice({
          childName: activeAppointment.childName,
          appointmentNumber: activeAppointment.appointmentNumber,
          prescription: generatedPrescription,
          hasNextPatient: Boolean(nextPatientData),
        });
      }

      if (showPrintModal && generatedPrescription) {
        setShowPrintPrescription(generatedPrescription);
      }

      // Clean consultation pad
      setPrescriptionItems([]);
      setDiagnosis('');
      setSelectedDiagnosisObj(null);
      setChiefComplaints([]);
      setClinicalObservations('');
      setFollowUpDate('');
      setSpecialNotesEn('');
      setSpecialNotesTe('');
      setCurrentHeight('');
      setCurrentWeight('');
      setCurrentTemp('');
      setCurrentPulse('');

      // If next arrived patient is returned, advance to them immediately; otherwise clean room
      if (nextPatientData) {
        await startConsultationForAppt(nextPatientData);
      } else {
        setActiveAppointment(null);
        setActiveEncounter(null);
        setActiveChildDetails(null);
        activeAppointmentRef.current = null;
        activeEncounterRef.current = null;
      }

      await loadQueue();
    } catch (err: any) {
      console.error('Failed to complete consultation:', err);
      alert(`An unexpected error occurred while completing consultation: ${err?.message || ''}`);
    } finally {
      setFinalizing(false);
    }
  };

  const handleCompleteAndCallNext = (showPrintModal: boolean = false) => {
    return handleCompleteConsultation(true, showPrintModal);
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
      const res = await fetch(`/api/emr/children/search?q=${encodeURIComponent(query)}`, {
        headers: { 'x-doctor-token': doctorUser.token },
      });
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

  // Filter diagnoses based on search and category
  const filteredDiagnoses = masterDiagnoses.filter((d) => {
    const matchesCategory =
      selectedDiagnosisCategory === 'All' || d.category.toLowerCase().includes(selectedDiagnosisCategory.toLowerCase());
    const matchesSearch =
      !diagnosisSearchQuery.trim() ||
      d.name.toLowerCase().includes(diagnosisSearchQuery.toLowerCase()) ||
      d.teluguName.toLowerCase().includes(diagnosisSearchQuery.toLowerCase()) ||
      d.icdCode.toLowerCase().includes(diagnosisSearchQuery.toLowerCase()) ||
      d.typicalSymptoms.some((s) => s.toLowerCase().includes(diagnosisSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter diagnoses for Doctor Settings tab
  const filteredSettingsDiagnoses = masterDiagnoses.filter((d) => {
    const matchesCategory =
      settingsCategoryFilter === 'All' || d.category.toLowerCase().includes(settingsCategoryFilter.toLowerCase());
    const matchesSearch =
      !settingsSearchQuery.trim() ||
      d.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
      d.teluguName.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
      d.icdCode.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
      d.typicalSymptoms.some((s) => s.toLowerCase().includes(settingsSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter full medicine catalog
  const filteredCatalog = catalog.filter((med) => {
    if (!catalogSearchQuery.trim()) return true;
    const q = catalogSearchQuery.toLowerCase();
    return (
      med.medicineName.toLowerCase().includes(q) ||
      (med.genericName && med.genericName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="doctor-workspace min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Professional App Bar */}
      <header className="doctor-toolbar bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-800/40 sticky top-0 z-30 shadow-md">
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

          <div className="flex items-center gap-3 flex-wrap">
            {/* Primary Doctor Desk Tabs: Consultation vs Settings */}
            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-teal-700/50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveDeskTab('consultation')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeDeskTab === 'consultation'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Consultation Desk</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDeskTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeDeskTab === 'settings'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Doctor Settings ({masterDiagnoses.length})</span>
              </button>
            </div>

            {/* Branch Selector */}
            <div className="flex items-center bg-black/30 rounded-xl p-1 border border-teal-700/40 text-xs font-semibold">
              <button
                onClick={() => handleBranchSwitch('kakinada')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedBranch === 'kakinada' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-200 hover:text-white'
                }`}
              >
                Kakinada OPD
              </button>
              <button
                onClick={() => handleBranchSwitch('pithapuram')}
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
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
              title="Live Queue Auto-Refreshes every 5s"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden md:inline">Sync</span>
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

      {/* Real-time Notice Banner for Just Completed Patient */}
      {lastCompletedPatientNotice && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-sm transition">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>
                Treatment completed for <strong>Token #{lastCompletedPatientNotice.appointmentNumber} {lastCompletedPatientNotice.childName}</strong>.{' '}
                {lastCompletedPatientNotice.hasNextPatient ? 'Automatically advanced to next patient!' : 'OPD room is now ready for the next patient.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastCompletedPatientNotice.prescription && (
                <button
                  onClick={() => setShowPrintPrescription(lastCompletedPatientNotice.prescription)}
                  className="px-2.5 py-1 rounded-lg bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Prescription</span>
                </button>
              )}
              <button
                onClick={() => setLastCompletedPatientNotice(null)}
                className="text-white/80 hover:text-white p-1"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              aria-label="Search patient by ID, mobile or name" placeholder="Search patient by name, mobile or ID"
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
                        Parent: {c.parentName} ({c.parentMobile}) • {typeof c.ageYears === 'number' && c.ageYears >= 0 ? `${c.ageYears} Yrs` : 'Age: Not recorded'} ({c.gender})
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
              <span>Waiting in Lobby: <strong>{queueData?.counts?.waiting || 0}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 text-sky-900 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Upcoming: <strong>{queueData?.counts?.upcoming || 0}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed Today: <strong>{queueData?.completedPatients?.length || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Desk Sub-view: Consultation Desk vs Doctor Settings */}
      {activeDeskTab === 'consultation' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* TOP SECTION: Left Hand Top (Patient Vitals & Growth Chart) + Right Hand Consultation Pad */}
          <div className="doctor-consultation-grid grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Active Patient, Vitals & Pediatric Growth Chart (5 cols) */}
            <div className="doctor-patient-panel lg:col-span-4 space-y-4">
              {activeAppointment ? (
                <>
                  {/* Active In-Room Patient Card */}
                  <div className="doctor-patient-card bg-white rounded-3xl border-2 border-emerald-400 p-5 shadow-xs relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        In Consultation Room
                      </div>
                      <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100/90 px-2.5 py-0.5 rounded-md border border-teal-200">
                        Token #{activeAppointment.appointmentNumber}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <span>{activeAppointment.childName}</span>
                        </h2>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-teal-800 font-bold bg-white px-1.5 py-0.5 rounded border border-teal-200">
                            {activeAppointment.childPermanentId || activeChildDetails?.child?.permanentId || 'ID Pending'}
                          </span>
                          <span>•</span>
                          <span>
                            {activeChildDetails?.child?.gender || activeAppointment.childGender || 'Child'}
                            {activeChildDetails?.child?.ageYears !== undefined && activeChildDetails?.child?.ageYears !== null
                              ? `, ${activeChildDetails.child.ageYears} Yrs`
                              : activeAppointment.childAge !== undefined && activeAppointment.childAge !== null
                              ? `, ${activeAppointment.childAge} Yrs`
                              : ', Age: Not recorded'}
                          </span>
                          <span>•</span>
                          <span className="text-rose-700 font-bold">
                            {activeChildDetails?.child?.bloodGroup || activeAppointment.bloodGroup
                              ? `Blood: ${activeChildDetails?.child?.bloodGroup || activeAppointment.bloodGroup}`
                              : 'Blood: Not recorded'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setInspectChildId(activeAppointment.childId)}
                        className="p-2 rounded-xl bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition shadow-2xs flex items-center gap-1 text-xs font-bold shrink-0"
                        title="View Full EMR Profile"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>EMR</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-teal-100/80 flex items-center justify-between flex-wrap gap-1">
                      <span>Parent: <strong className="text-slate-800">{activeAppointment.parentName}</strong> ({activeAppointment.parentMobile})</span>
                      <span className="text-slate-400">Slot: {activeAppointment.bookedTime}</span>
                    </div>

                    {/* Critical Allergy Warning inside Patient Card */}
                    {activeAppointment.criticalAllergyCount > 0 && (
                      <div className="mt-2.5 py-1.5 px-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                        <span>Active Allergy: {activeAppointment.activeAllergies?.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Pediatric Vitals & Physical Triage Box */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                          Consultation Vitals
                        </h3>
                      </div>
                      {currentHeight && currentWeight && (
                        <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          BMI: {(Number(currentWeight) / ((Number(currentHeight) / 100) ** 2)).toFixed(1)} kg/m²
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Height (cm) <span className="text-teal-600">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={currentHeight}
                          onChange={(e) => setCurrentHeight(e.target.value)}
                          placeholder="e.g. 96.5"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Weight (kg) <span className="text-teal-600">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={currentWeight}
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          placeholder="e.g. 14.2"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Temp (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={currentTemp}
                          onChange={(e) => setCurrentTemp(e.target.value)}
                          placeholder="98.6"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Pulse (bpm)
                        </label>
                        <input
                          type="number"
                          value={currentPulse}
                          onChange={(e) => setCurrentPulse(e.target.value)}
                          placeholder="100"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PEDIATRIC GROWTH CHART: WHO & IAP Standards based on Height, Weight & BMI */}
                  <PediatricGrowthChart
                    currentHeight={currentHeight}
                    currentWeight={currentWeight}
                    childAgeYears={
                      typeof activeChildDetails?.child?.ageYears === 'number' && activeChildDetails.child.ageYears >= 0
                        ? activeChildDetails.child.ageYears
                        : (typeof activeAppointment.childAge === 'number' && activeAppointment.childAge >= 0 ? activeAppointment.childAge : undefined)
                    }
                    childGender={activeChildDetails?.child?.gender || activeAppointment.childGender || 'Boy'}
                    childName={activeAppointment.childName}
                    growthRecords={activeChildDetails?.growthRecords || []}
                  />
                </>
              ) : (
                /* No Active Patient: Consultation Room Ready Card */
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">OPD Room Ready</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Doctor consultation room is active for {selectedBranch.toUpperCase()} branch. Call in a patient from the queue below.
                    </p>
                  </div>

                  {queueData?.waitingPatients && queueData.waitingPatients.length > 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Next in Queue
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          Token #{queueData.waitingPatients[0].appointmentNumber}
                        </span>
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {queueData.waitingPatients[0].childName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Parent: {queueData.waitingPatients[0].parentName} • Slot: {queueData.waitingPatients[0].bookedTime}
                        </div>
                      </div>
                      <button
                        onClick={() => startConsultationForAppt(queueData.waitingPatients[0])}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5"
                      >
                        <span>Call In Token #{queueData.waitingPatients[0].appointmentNumber}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      No patients currently waiting in lobby.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Pediatric Consultation & Prescription Pad (7 cols) */}
            <div className="doctor-consultation-panel lg:col-span-8 space-y-5">
              {activeAppointment ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Consultation Header & Quick Action Buttons */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                        Active Examination &amp; Prescription
                      </div>
                      <h2 className="text-lg font-black text-slate-900">
                        {activeAppointment.childName} • Token #{activeAppointment.appointmentNumber}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePreviewPrescription}
                        className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        title="Preview and print current prescription at any time"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-600" />
                        <span>Preview / Print Rx</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveAppointment(null);
                          setActiveEncounter(null);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                      >
                        Discard
                      </button>

                      {/* Primary Next Patient Quick Button */}
                      <button
                        type="button"
                        disabled={finalizing || !diagnosis}
                        onClick={() => handleCompleteAndCallNext(false)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                        title="Mark current patient completed and automatically start next patient"
                      >
                        {finalizing ? (
                          <span>Saving...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completed &amp; Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Persistent Critical Allergies Alert */}
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

                  {/* Chief Complaints */}
                  <div className="space-y-2 text-xs">
                    <label className="block font-bold text-slate-800">Chief Complaints</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Fever', 'Cough', 'Cold / Runny Nose', 'Vomiting', 'Loose Stools', 'Wheezing', 'Ear Pain', 'Skin Rash', 'Reduced Appetite', 'Excessive Crying / Colic'].map((complaint) => {
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
                                ? 'bg-teal-700 text-white shadow-2xs font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {complaint}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Observations */}
                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Clinical Observations &amp; Exam Notes
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalObservations}
                      onChange={(e) => setClinicalObservations(e.target.value)}
                      placeholder="e.g. Chest clear, throat congestion, throat signs, abdomen soft..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Master Pediatric Diagnosis Selector */}
                  <div className="doctor-diagnosis-panel bg-teal-50/50 p-4 rounded-2xl border border-teal-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                        Pediatric Clinical Diagnosis *
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveDeskTab('settings')}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Manage Protocols ({masterDiagnoses.length})</span>
                      </button>
                    </div>

                    {/* Category Filter Chips (Harmonized with Canonical Pediatric Protocols - D13) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {[
                        'All',
                        'General Pediatrics',
                        'Respiratory',
                        'Fever & Infection',
                        'Gastrointestinal',
                        'ENT & Eyes',
                        'Skin & Allergies',
                        'Nutrition & Growth',
                      ].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedDiagnosisCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                            selectedDiagnosisCategory === cat
                              ? 'bg-teal-700 text-white shadow-2xs'
                              : 'bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/60'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search & Select Diagnosis */}
                    <div className="relative">
                      <select
                        value={diagnosis}
                        onChange={(e) => handleSelectDiagnosis(e.target.value)}
                        className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-xs sm:text-sm text-slate-900 shadow-2xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="">-- Choose Pediatric Diagnosis Protocol ({filteredDiagnoses.length}) --</option>
                        {filteredDiagnoses.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} ({d.teluguName}) • ICD: {d.icdCode} [{d.category}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Diagnosis Details Banner */}
                    {selectedDiagnosisObj && typeof selectedDiagnosisObj === 'object' && selectedDiagnosisObj.name && (
                      <div className="bg-white p-3.5 rounded-xl border border-teal-200 space-y-1.5 text-xs shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-teal-950 text-sm">
                            {selectedDiagnosisObj.name}
                          </span>
                          <span className="font-mono text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded">
                            ICD: {selectedDiagnosisObj.icdCode}
                          </span>
                        </div>
                        <div className="text-teal-900 font-semibold text-xs">
                          తెలుగు పేరు: <strong>{selectedDiagnosisObj.teluguName}</strong>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Symptoms: {Array.isArray(selectedDiagnosisObj.typicalSymptoms) ? selectedDiagnosisObj.typicalSymptoms.join(', ') : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1. RECOMMENDED MEDICINES CHIPS FOR SELECTED DIAGNOSIS */}
                  {selectedDiagnosisObj && typeof selectedDiagnosisObj === 'object' && Array.isArray(selectedDiagnosisObj.recommendedMedicines) && selectedDiagnosisObj.recommendedMedicines.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 rounded-2xl border border-emerald-300 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Recommended Formulations for {selectedDiagnosisObj.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Click to customize dosage
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedDiagnosisObj.recommendedMedicines.map((med, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => openMedicineConfigurator(med)}
                            className="p-2.5 bg-white border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl text-left transition shadow-2xs group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-800">
                                {med.medicineName}
                              </span>
                              <span className="text-emerald-600 font-extrabold text-[11px]">+ Configure</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                {med.form}
                              </span>
                              <span>Dose: <strong>{med.defaultDosage}</strong></span>
                              <span>•</span>
                              <span>{med.frequency.replace(/_/g, ' ')}</span>
                            </div>
                            {med.instructionsHint && (
                              <div className="text-[10px] text-emerald-800/80 mt-1 italic line-clamp-1">
                                {med.instructionsHint}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. FULL PEDIATRIC FORMULATIONS CATALOG */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        All Pediatric Formulations Catalog
                      </div>
                      <div className="w-48 relative">
                        <input
                          type="text"
                          value={catalogSearchQuery}
                          onChange={(e) => setCatalogSearchQuery(e.target.value)}
                          aria-label="Search medicine catalog" placeholder="Search medicines..."
                          className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {filteredCatalog.map((med, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openMedicineConfigurator(med)}
                          className="text-[11px] font-semibold bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-800 px-2.5 py-1.5 rounded-xl transition shadow-2xs text-left"
                        >
                          <span className="text-teal-700 font-bold">+</span> {med.medicineName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. PRESCRIBED ITEMS LIST */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Prescription Items ({prescriptionItems.length})</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Parent receives bilingual instructions
                      </span>
                    </div>

                    {prescriptionItems.length > 0 ? (
                      prescriptionItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs relative space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <span>{item.medicineName}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                  {item.form}
                                </span>
                              </div>
                              <div className="text-slate-600 text-[11px] font-medium mt-0.5">
                                Dose: <strong className="text-slate-900">{item.dosage}</strong> • Frequency: <strong className="text-slate-900">{item.frequency.replace(/_/g, ' ')}</strong> • Timing: <strong className="text-slate-900">{item.timing.replace(/_/g, ' ')}</strong> • Duration: <strong className="text-slate-900">{item.durationDays} Days</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openMedicineConfigurator(item, idx)}
                                className="text-slate-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                                title="Edit dosage / timing"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePrescriptionItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                        No medicines prescribed yet. Select from recommended medicines above or click any formulation to configure dosage.
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

                  {/* Follow-up Date with Quick Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-800 text-xs">Follow-up Date</label>
                      <span className="text-[11px] text-teal-700 font-medium">Quick Select Days</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
                      />

                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: '+2 Days', days: 2 },
                          { label: '+3 Days', days: 3 },
                          { label: '+5 Days', days: 5 },
                          { label: '+1 Week', days: 7 },
                          { label: '+2 Weeks', days: 14 },
                          { label: '+1 Month', days: 30 },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => {
                              const d = new Date(config.simulatedDate);
                              d.setDate(d.getDate() + opt.days);
                              setFollowUpDate(d.toISOString().split('T')[0]);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 transition"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Finalize & Finish / Finalize & Call Next Arrived / Print (D09) */}
                  <div className="doctor-consultation-actions pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
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

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Direct Preview Draft Prescription Button (D10) */}
                      <button
                        type="button"
                        onClick={handlePreviewPrescription}
                        className="px-4 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 border border-teal-300 shadow-2xs"
                        title="Preview and check prescription draft without finalizing consultation"
                      >
                        <Printer className="w-4 h-4 text-teal-600" />
                        <span>Check &amp; Print Draft Rx</span>
                      </button>

                      {/* Finalize & Finish (leaves room clean & ready without auto-calling) */}
                      <button
                        type="button"
                        disabled={finalizing || !diagnosis}
                        onClick={() => handleCompleteConsultation(false, false)}
                        className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Finalize this consultation and leave room ready without calling next patient"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Finalize &amp; Finish</span>
                      </button>

                      {/* Finalize & Call Next Arrived Patient */}
                      <button
                        type="button"
                        disabled={finalizing || !diagnosis}
                        onClick={() => handleCompleteConsultation(true, false)}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Finalize consultation and immediately call the next waiting arrived patient"
                      >
                        {finalizing ? (
                          <span>Updating Patient...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Finalize &amp; Call Next Arrived</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Finalize & Print */}
                      <button
                        type="button"
                        disabled={finalizing || !diagnosis}
                        onClick={() => handleCompleteConsultation(false, true)}
                        className="px-4 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Finalize &amp; Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Active Consultation Right Panel */
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Pediatric Consultation Ready</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select a child from the OPD Patient Queue below to start consultation, record vitals, and generate bilingual prescriptions.
                  </p>
                  {queueData?.waitingPatients && queueData.waitingPatients.length > 0 && (
                    <button
                      onClick={() => startConsultationForAppt(queueData.waitingPatients[0])}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                    >
                      <span>Start Next Waiting Patient: {queueData.waitingPatients[0].childName}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SECTION: Panoramic OPD Patient Queue & Completed Sessions */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">
                    OPD Patient Queue &amp; Completed Sessions
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedBranch.toUpperCase()} Branch • Live Real-time Sync ({config.simulatedDate})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                  Waiting: {queueData?.waitingPatients?.length || 0}
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 font-bold">
                  Upcoming: {queueData?.upcomingPatients?.length || 0}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                  Completed: {queueData?.completedPatients?.length || 0}
                </span>
              </div>
            </div>

            {/* 3-Column Queue Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Column 1: Waiting In Lobby & Next in Line */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Waiting in Lobby ({queueData?.waitingPatients?.length || 0})</span>
                  <span className="text-[10px] text-teal-600 font-normal">Next enters automatically</span>
                </div>

                {queueData?.waitingPatients && queueData.waitingPatients.length > 0 ? (
                  <div className="space-y-2.5">
                    {queueData.waitingPatients.map((appt: any, idx: number) => {
                      const isNextInLine = idx === 0;
                      const isCurrent = activeAppointment?.id === appt.id;
                      return (
                        <div
                          key={appt.id}
                          className={`p-3.5 rounded-2xl border transition ${
                            isCurrent
                              ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                              : isNextInLine
                              ? 'border-amber-300 bg-amber-50/50 shadow-xs ring-1 ring-amber-300'
                              : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                                  #{appt.appointmentNumber}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">{appt.childName}</span>
                                {appt.childAge !== undefined && appt.childAge !== null ? (
                                  <span className="text-xs text-slate-500">({appt.childAge}y)</span>
                                ) : null}
                                {isNextInLine && (
                                  <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Next in Queue
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-teal-700 font-semibold">{appt.childPermanentId}</span>
                                <span>•</span>
                                <span>Slot: {appt.bookedTime}</span>
                                <span>•</span>
                                <span>Parent: {appt.parentName}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setInspectChildId(appt.childId)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-slate-50 transition"
                                title="Inspect Child EMR"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startConsultationForAppt(appt)}
                                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
                              >
                                <span>Call In</span>
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
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No children currently waiting in the lobby.
                  </div>
                )}
              </div>

              {/* Column 2: Upcoming Appointments Today */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Upcoming Today ({queueData?.upcomingPatients?.length || 0})
                </div>

                {queueData?.upcomingPatients && queueData.upcomingPatients.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {queueData.upcomingPatients.map((appt: any) => (
                      <div
                        key={appt.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/80 transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">#{appt.appointmentNumber}</span>
                            <span className="font-bold text-slate-800">{appt.childName}</span>
                            {appt.childAge !== undefined && appt.childAge !== null ? (
                              <span className="text-[11px] text-slate-500">({appt.childAge}y)</span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Slot: <strong>{appt.bookedTime}</strong> • {appt.parentName}
                          </div>
                        </div>
                        <button
                          onClick={() => startConsultationForAppt(appt)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition border border-teal-200"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No upcoming appointments remaining today.
                  </div>
                )}
              </div>

              {/* Column 3: Completed Today History */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Completed Sessions Today ({queueData?.completedPatients?.length || 0})</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Click print anytime</span>
                </div>

                {queueData?.completedPatients && queueData.completedPatients.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {queueData.completedPatients.map((appt: any) => (
                      <div
                        key={appt.id}
                        className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                              #{appt.appointmentNumber}
                            </span>
                            <span className="font-extrabold text-slate-900">{appt.childName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {appt.diagnosis || 'Consultation complete'} • {appt.completedAt || 'Today'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {appt.prescription && (
                            <button
                              onClick={() => setShowPrintPrescription(appt.prescription)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                              title="Print prescription"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          )}
                          <button
                            onClick={() => setInspectChildId(appt.childId)}
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-white"
                            title="Inspect EMR"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No patients completed yet today.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DOCTOR SETTINGS TAB: Pediatric Protocols & Clinical Instructions Management */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">
                    Doctor Settings &amp; Pediatric Protocols
                  </h2>
                  <span className="text-xs font-bold bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full">
                    {masterDiagnoses.length} Conditions
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage standard pediatric diagnostic guidelines, custom health issues, and bilingual Telugu &amp; English patient instructions.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddDiagnosis}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Health Issue</span>
            </button>
          </div>

          {/* Search & Category Pills */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  placeholder="Search condition, Telugu name, symptoms..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
                {[
                  'All',
                  'General Pediatrics',
                  'Respiratory',
                  'Fever & Infection',
                  'Gastrointestinal',
                  'ENT & Eyes',
                  'Skin & Allergies',
                  'Nutrition & Growth',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSettingsCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                      settingsCategoryFilter === cat
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnoses Protocol Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSettingsDiagnoses.map((diag) => (
              <div
                key={diag.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {diag.category}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1">
                        {diag.name}
                      </h3>
                      <div className="text-xs font-semibold text-teal-900 mt-0.5">
                        {diag.teluguName}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {diag.icdCode}
                    </span>
                  </div>

                  {/* Typical Symptoms */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                      Common Symptoms
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {diag.typicalSymptoms.map((s, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bilingual Advice & Instructions */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">English Advice: </span>
                      <span className="text-slate-600">{diag.specialNotesEn}</span>
                    </div>
                    <div>
                      <span className="font-bold text-teal-900">తెలుగు సూచనలు: </span>
                      <span className="text-teal-800 font-medium">{diag.specialNotesTe}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      Standard follow-up: {diag.defaultFollowUpDays} days
                    </div>
                  </div>

                  {/* Recommended Formulations Preview */}
                  {diag.recommendedMedicines && diag.recommendedMedicines.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                        Recommended Medicines ({diag.recommendedMedicines.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {diag.recommendedMedicines.map((m, idx) => (
                          <span key={idx} className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-semibold">
                            {m.medicineName} ({m.form})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEditDiagnosis(diag)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition flex items-center gap-1.5 border border-teal-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modify Protocol &amp; Instructions</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDiagnosis(diag.id, diag.name)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove protocol"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADJUSTABLE SLIDE-OVER RIGHT DRAWER TAB: PEDIATRIC DOSAGE & SCHEDULE CONFIGURATOR */}
      {configuringMedicine && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with click-to-dismiss */}
          <div
            onClick={() => {
              setConfiguringMedicine(null);
              setEditingItemIndex(null);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Adjustable Drawer Panel */}
          <div
            className={`relative z-10 bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-200 ${
              drawerWidth === 'compact'
                ? 'w-full sm:w-[440px]'
                : drawerWidth === 'wide'
                ? 'w-full sm:w-[720px]'
                : 'w-full sm:w-[560px]'
            }`}
          >
            {/* Sticky Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {isCustomMedicine ? 'Prescribe Custom Medicine' : modalMedicineName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modalGenericName ? `Generic: ${modalGenericName}` : 'Pediatric Dosage & Schedule Configurator'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Drawer Width Adjuster */}
                <div className="hidden sm:flex items-center bg-white rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDrawerWidth('compact')}
                    className={`px-2 py-1 rounded transition ${drawerWidth === 'compact' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Compact width (440px)"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerWidth('standard')}
                    className={`px-2 py-1 rounded transition ${drawerWidth === 'standard' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Standard width (560px)"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerWidth('wide')}
                    className={`px-2 py-1 rounded transition ${drawerWidth === 'wide' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Wide width (720px)"
                  >
                    Wide
                  </button>
                </div>

                {/* Close Button [X] */}
                <button
                  type="button"
                  onClick={() => {
                    setConfiguringMedicine(null);
                    setEditingItemIndex(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                  title="Close Medicine Tab (or click outside)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* If custom medicine, allow typing name and generic */}
              {isCustomMedicine && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={modalMedicineName}
                      onChange={(e) => setModalMedicineName(e.target.value)}
                      placeholder="e.g. Syrup Meftal-P"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Generic Name</label>
                    <input
                      type="text"
                      value={modalGenericName}
                      onChange={(e) => setModalGenericName(e.target.value)}
                      placeholder="e.g. Mefenamic Acid"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Formulation & Form */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-700">Formulation Form</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(['SYRUP', 'DROPS', 'TABLET', 'INHALER', 'CREAM', 'INJECTION'] as MedicineForm[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setModalForm(f);
                        if (f === 'DROPS') setModalDosageUnit('drops');
                        else if (f === 'TABLET') setModalDosageUnit('tablet');
                        else if (f === 'INHALER') setModalDosageUnit('puff');
                        else if (f === 'CREAM') setModalDosageUnit('application');
                        else setModalDosageUnit('ml');
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                        modalForm === f
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dosage Amount & Unit */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  Single Dose Volume / Quantity ({modalForm === 'SYRUP' ? 'how many ml' : modalDosageUnit})
                </label>

                {/* Quick dose amount chips */}
                <div className="flex flex-wrap gap-1.5">
                  {modalForm === 'SYRUP' &&
                    ['1.5', '2.5', '3.5', '5', '7.5', '10', '15'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setModalDosageAmount(amt);
                          setModalDosageUnit('ml');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                          modalDosageAmount === amt && modalDosageUnit === 'ml'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amt} ml
                      </button>
                    ))}

                  {modalForm === 'DROPS' &&
                    ['4', '6', '8', '10', '0.5', '1'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setModalDosageAmount(amt);
                          setModalDosageUnit(amt.includes('.') ? 'ml' : 'drops');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                          modalDosageAmount === amt
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amt} {amt.includes('.') ? 'ml' : 'drops'}
                      </button>
                    ))}

                  {modalForm === 'TABLET' &&
                    ['1/4', '1/2', '1', '2'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setModalDosageAmount(amt);
                          setModalDosageUnit('tablet');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                          modalDosageAmount === amt
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amt} tab
                      </button>
                    ))}

                  {modalForm === 'INHALER' &&
                    ['1', '2'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setModalDosageAmount(amt);
                          setModalDosageUnit('puff');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                          modalDosageAmount === amt
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amt} puff{amt === '2' ? 's' : ''} (spacer)
                      </button>
                    ))}
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={modalDosageAmount}
                    onChange={(e) => setModalDosageAmount(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-center text-xs"
                  />
                  <select
                    value={modalDosageUnit}
                    onChange={(e) => setModalDosageUnit(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="ml">ml (Milliliters)</option>
                    <option value="drops">drops (చుక్కలు)</option>
                    <option value="tablet">tablet (మాత్ర)</option>
                    <option value="puff">puff (ఇన్హేలర్)</option>
                    <option value="sachet">sachet (ప్యాకెట్)</option>
                    <option value="application">thin layer (పూత)</option>
                  </select>
                  <span className="text-slate-400 text-xs">Per dose</span>
                </div>
              </div>

              {/* Daily Frequency */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">
                  Daily Frequency (ఎప్పుడు వేయాలి / ఎన్ని సార్లు)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { value: 'SOS', label: 'SOS / As Needed (అవసరమైనప్పుడు)', desc: 'Only for fever/pain' },
                    { value: 'ONCE_DAILY', label: 'Once Daily (రోజుకు 1 సారి)', desc: 'Morning or Bedtime' },
                    { value: 'TWICE_DAILY', label: 'Twice Daily (రోజుకు 2 సార్లు)', desc: 'Morning & Night' },
                    { value: 'THRICE_DAILY', label: 'Three Times Daily (రోజుకు 3 సార్లు)', desc: 'Morning, Noon, Night' },
                    { value: 'FOUR_TIMES_DAILY', label: 'Four Times Daily (రోజుకు 4 సార్లు)', desc: 'Every 6 hours' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setModalFrequency(f.value as DoseFrequency)}
                      className={`p-2 rounded-xl text-left transition border ${
                        modalFrequency === f.value
                          ? 'border-teal-500 bg-teal-50 text-teal-950 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">{f.label}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Timing */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-700">Food / Milk Timing</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { value: 'AFTER_FOOD', label: 'After Food (ఆహారం తర్వాత)' },
                    { value: 'BEFORE_FOOD', label: 'Before Food (ఆహారం ముందు)' },
                    { value: 'WITH_FOOD', label: 'With Food (ఆహారంతో)' },
                    { value: 'AT_BEDTIME', label: 'At Bedtime (పడుకునే ముందు)' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setModalTiming(t.value as MealTiming)}
                      className={`p-2 rounded-xl text-center text-[11px] transition ${
                        modalTiming === t.value
                          ? 'bg-teal-700 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Days */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">Duration (Days)</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5, 7, 10, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModalDurationDays(d)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        modalDurationDays === d
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={modalDurationDays}
                    onChange={(e) => setModalDurationDays(Number(e.target.value))}
                    className="w-16 p-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* LIVE BILINGUAL PREVIEW BOX */}
              <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-1 text-xs">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
                  Live Instructions Preview for Parent
                </div>
                <div className="text-slate-800">
                  <strong>English: </strong>
                  {
                    buildClientBilingualInstructions(
                      modalForm,
                      `${modalDosageAmount} ${modalDosageUnit}`,
                      modalFrequency,
                      modalTiming,
                      modalDurationDays,
                      modalRoute,
                      modalSite,
                      configuringMedicine?.instructionsHint
                    ).instructionEn
                  }
                </div>
                <div className="text-teal-900 font-semibold">
                  <strong>తెలుగు: </strong>
                  {
                    buildClientBilingualInstructions(
                      modalForm,
                      `${modalDosageAmount} ${modalDosageUnit}`,
                      modalFrequency,
                      modalTiming,
                      modalDurationDays,
                      modalRoute,
                      modalSite,
                      configuringMedicine?.instructionsHint
                    ).instructionTe
                  }
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer with Pinned Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setConfiguringMedicine(null);
                  setEditingItemIndex(null);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition"
              >
                Cancel / Close
              </button>
              <button
                type="button"
                onClick={handleSaveConfiguredMedicine}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemIndex !== null ? 'Save Changes' : 'Add to Prescription'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / MODIFY PEDIATRIC HEALTH ISSUE PROTOCOL */}
      {isAddDiagnosisModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingDiagnosis ? 'Modify Pediatric Protocol & Instructions' : 'Add New Pediatric Health Issue'}
                </h3>
                <p className="text-xs text-slate-500">
                  Define diagnosis guidelines, typical symptoms, and English &amp; Telugu care advice.
                </p>
              </div>
              <button
                onClick={() => setIsAddDiagnosisModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condition / Diagnosis Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formDiagName}
                    onChange={(e) => setFormDiagName(e.target.value)}
                    placeholder="e.g. Acute Pharyngitis"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">వ్యాధి పేరు (Telugu Translation) *</label>
                  <input
                    type="text"
                    required
                    value={formDiagTeluguName}
                    onChange={(e) => setFormDiagTeluguName(e.target.value)}
                    placeholder="e.g. గొంతు ఇన్ఫెక్షన్"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Category</label>
                  <select
                    value={formDiagCategory}
                    onChange={(e) => setFormDiagCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="General Pediatrics">General Pediatrics</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Fever & Infection">Fever &amp; Infection</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="ENT & Eyes">ENT &amp; Eyes</option>
                    <option value="Skin & Allergies">Skin &amp; Allergies</option>
                    <option value="Nutrition & Growth">Nutrition &amp; Growth</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ICD-10 Code</label>
                  <input
                    type="text"
                    value={formDiagIcdCode}
                    onChange={(e) => setFormDiagIcdCode(e.target.value)}
                    placeholder="e.g. J02.9"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Days</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formDiagFollowUpDays}
                    onChange={(e) => setFormDiagFollowUpDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Typical Symptoms (Comma separated)</label>
                <input
                  type="text"
                  value={formDiagSymptoms}
                  onChange={(e) => setFormDiagSymptoms(e.target.value)}
                  placeholder="e.g. Sore throat, Fever, Difficulty swallowing, Mild cough"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Diet &amp; Care Advice (English)</label>
                <textarea
                  rows={2}
                  value={formDiagNotesEn}
                  onChange={(e) => setFormDiagNotesEn(e.target.value)}
                  placeholder="Warm fluids, soft bland diet, observe hydration..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ఆహారం మరియు తీసుకోవాల్సిన జాగ్రత్తలు (Telugu Instructions)</label>
                <textarea
                  rows={2}
                  value={formDiagNotesTe}
                  onChange={(e) => setFormDiagNotesTe(e.target.value)}
                  placeholder="గోరువెచ్చని నీరు తాగించండి, మెత్తని ఆహారం ఇవ్వండి..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-teal-950"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddDiagnosisModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDiagnosis}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingDiagnosis ? 'Saving...' : editingDiagnosis ? 'Save Changes' : 'Create Health Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Child EMR Full Modal */}
      {inspectChildId && (
        <ChildHealthDashboardModal
          isOpen={!!inspectChildId}
          childId={inspectChildId}
          doctorUser={doctorUser}
          onClose={() => setInspectChildId(null)}
        />
      )}

      {/* Print Prescription Preview Modal */}
      {showPrintPrescription && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="printable-prescription"
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]"
          >
            {/* Preview Page Selector (no-print) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 no-print">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPrescriptionPreviewTab('both')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    prescriptionPreviewTab === 'both' ? 'bg-white text-teal-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📑 Full 2-Page Document
                </button>
                <button
                  type="button"
                  onClick={() => setPrescriptionPreviewTab('front')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    prescriptionPreviewTab === 'front' ? 'bg-white text-teal-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 Page 1: Clinical Rx
                </button>
                <button
                  type="button"
                  onClick={() => setPrescriptionPreviewTab('back')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    prescriptionPreviewTab === 'back' ? 'bg-white text-teal-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 Page 2: Growth &amp; Nutrition Guide (Back)
                </button>
              </div>
              <span className="text-[11px] text-teal-800 font-semibold hidden sm:inline">
                ✨ 2-Sided Print Ready (Front: Rx • Back: Growth Table)
              </span>
            </div>

            {/* PAGE 1: CLINICAL PRESCRIPTION (FRONT) */}
            <div className={`prescription-front-page ${prescriptionPreviewTab === 'back' ? 'preview-hide-front' : ''}`}>
              {/* DRAFT Watermark Alert Banner (D10) */}
              {Boolean((showPrintPrescription as any).isDraft) && (
                <div className="mb-4 p-3 bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl text-center">
                  <span className="text-xs font-black text-amber-800 tracking-wider uppercase">
                    ⚠ DRAFT PREVIEW — PENDING FINALIZATION — NOT VALID FOR DISPENSING
                  </span>
                </div>
              )}

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
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  Boolean((showPrintPrescription as any).isDraft)
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {showPrintPrescription.prescriptionNumber}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">{showPrintPrescription.date}</div>
              </div>
            </div>

            {/* Doctor & Patient Info (D12) */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <div className="text-slate-500">Pediatrician:</div>
                <div className="font-bold text-slate-900">{showPrintPrescription.doctorName}</div>
                <div className="text-teal-700 font-semibold">Reg. No: {showPrintPrescription.doctorRegNo}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{selectedBranch.toUpperCase()} Branch OPD</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500">Patient:</div>
                <div className="font-bold text-slate-900">{showPrintPrescription.childName}</div>
                <div className="font-mono text-teal-800 font-bold">{showPrintPrescription.childPermanentId || 'ID Pending'}</div>
                <div className="text-slate-600 text-[11px] mt-0.5 font-medium">
                  {(showPrintPrescription as any).childAge !== undefined && (showPrintPrescription as any).childAge !== null
                    ? `${(showPrintPrescription as any).childAge} yrs`
                    : ''}
                  {(showPrintPrescription as any).childGender
                    ? `${(showPrintPrescription as any).childAge !== undefined ? ' • ' : ''}${(showPrintPrescription as any).childGender}`
                    : ''}
                  {showPrintPrescription.bloodGroup ? ` • Blood: ${showPrintPrescription.bloodGroup}` : ''}
                </div>
              </div>
            </div>

            {/* Comprehensive Pediatric Vitals Strip (All vitals included) */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 my-2.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Pediatric Vitals &amp; Growth Measurements</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Height</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {showPrintPrescription.heightCm ? `${showPrintPrescription.heightCm} cm` : '—'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Weight</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {showPrintPrescription.weightKg ? `${showPrintPrescription.weightKg} kg` : '—'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">BMI</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {showPrintPrescription.pediatricBmi
                      ? `${showPrintPrescription.pediatricBmi} kg/m²`
                      : showPrintPrescription.heightCm && showPrintPrescription.weightKg
                      ? `${(showPrintPrescription.weightKg / Math.pow(showPrintPrescription.heightCm / 100, 2)).toFixed(1)} kg/m²`
                      : '—'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Temp</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {showPrintPrescription.temperatureF ? `${showPrintPrescription.temperatureF} °F` : '—'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Pulse</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {showPrintPrescription.pulseRate ? `${showPrintPrescription.pulseRate} bpm` : '—'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Blood Group</div>
                  <div className="font-black text-rose-700 mt-0.5">
                    {showPrintPrescription.bloodGroup || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Allergy Alert Banner (D12) */}
            {(showPrintPrescription as any).allergyBannerSnapshot && (showPrintPrescription as any).allergyBannerSnapshot.length > 0 ? (
              <div className="my-3 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <strong>DOCUMENTED DRUG ALLERGIES: </strong>
                  <span>{(showPrintPrescription as any).allergyBannerSnapshot.join(', ')}</span>
                </div>
              </div>
            ) : (
              <div className="my-2 text-[11px] text-slate-500 italic">
                Allergies: No Known Drug Allergies (NKDA) recorded.
              </div>
            )}

            {/* Diagnosis & Follow-up (D12) */}
            <div className="py-2.5 text-xs flex items-center justify-between border-b border-slate-100">
              <div>
                <span className="text-slate-500">Diagnosis: </span>
                <strong className="text-slate-900 font-bold">{showPrintPrescription.diagnosis}</strong>
              </div>
              {showPrintPrescription.followUpDate && (
                <div className="text-right">
                  <span className="text-slate-500">Review / Follow-up: </span>
                  <strong className="text-teal-900 font-bold">{showPrintPrescription.followUpDate}</strong>
                </div>
              )}
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
                  {(showPrintPrescription.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.medicineName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.dosage} ({item.form}) {item.route ? `• ${item.route}` : ''} • {item.durationDays} Days
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

            {/* Doctor Signature Block (D10) */}
            <div className="pt-6 flex items-end justify-between text-xs">
              <div className="text-[11px] text-slate-400">
                Generated via Doctormate Pediatric EMR • Sri Devi Children Hospital
              </div>
              <div className="text-right">
                {Boolean((showPrintPrescription as any).isDraft) ? (
                  <>
                    <div className="w-36 border-b border-dashed border-amber-500 pb-1 mb-1 text-[11px] text-amber-700 font-bold uppercase">
                      Unfinalized Draft
                    </div>
                    <div className="font-bold text-slate-500">{showPrintPrescription.doctorName}</div>
                    <div className="text-[11px] text-amber-600 font-semibold">[Pending Doctor Finalization]</div>
                  </>
                ) : (
                  <>
                    <div className="w-32 border-b border-slate-400 pb-1 mb-1 text-[11px] text-slate-500 italic">
                      Digitally Authenticated
                    </div>
                    <div className="font-bold text-slate-900">{showPrintPrescription.doctorName}</div>
                    <div className="text-[11px] text-slate-500">APMC Registered Pediatrician</div>
                  </>
                )}
              </div>
            </div>
          </div>

            {/* PAGE 2: PEDIATRIC GROWTH & NUTRITION ASSESSMENT (BACK OF PRESCRIPTION) */}
            <div
              className={`prescription-back-page ${
                prescriptionPreviewTab === 'front' ? 'preview-hide-back' : ''
              } ${prescriptionPreviewTab === 'both' ? 'mt-8 pt-6 border-t-2 border-dashed border-teal-500' : ''}`}
            >
              <PrescriptionGrowthBackPage
                childName={showPrintPrescription.childName}
                childAge={(showPrintPrescription as any).childAge}
                childAgeMonths={(showPrintPrescription as any).childAgeMonths}
                childGender={(showPrintPrescription as any).childGender}
                heightCm={showPrintPrescription.heightCm}
                weightKg={showPrintPrescription.weightKg}
                pediatricBmi={showPrintPrescription.pediatricBmi}
                prescriptionNumber={showPrintPrescription.prescriptionNumber}
                doctorName={showPrintPrescription.doctorName}
                date={showPrintPrescription.date}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 no-print">
              <button
                onClick={() => setShowPrintPrescription(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContent = document.getElementById('printable-prescription');
                  if (!printContent) {
                    window.print();
                    return;
                  }

                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const doc = iframe.contentWindow?.document;
                  if (!doc) {
                    window.print();
                    return;
                  }

                  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                    .map((s) => s.outerHTML)
                    .join('\n');

                  const clone = printContent.cloneNode(true) as HTMLElement;
                  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

                  doc.open();
                  doc.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Prescription - ${showPrintPrescription?.childName || 'Patient'}</title>
                        ${styles}
                        <style>
                          @page { size: A4 portrait; margin: 8mm 12mm; }
                          html, body {
                            background: #ffffff !important;
                            margin: 0 !important;
                            padding: 8px !important;
                            color: #000000 !important;
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            height: auto !important;
                            overflow: visible !important;
                          }
                          #printable-prescription {
                            max-width: 100% !important;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            overflow: visible !important;
                          }
                          .prescription-front-page {
                            page-break-after: always !important;
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            display: block !important;
                          }
                          .prescription-back-page {
                            page-break-before: always !important;
                            break-before: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            display: block !important;
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                            border-top: none !important;
                          }
                          .preview-hide-front,
                          .preview-hide-back {
                            display: block !important;
                          }
                          .no-print { display: none !important; }
                        </style>
                      </head>
                      <body>
                        ${clone.outerHTML}
                      </body>
                    </html>
                  `);
                  doc.close();

                  iframe.contentWindow?.focus();
                  setTimeout(() => {
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                      if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                      }
                    }, 1500);
                  }, 300);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
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

