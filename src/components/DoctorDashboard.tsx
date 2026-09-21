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
  Edit3,
  X,
  Filter,
  Pill,
  ChevronDown,
  Info,
} from 'lucide-react';
import { ChildHealthDashboardModal } from './ChildHealthDashboardModal.js';
import {
  PEDIATRIC_DIAGNOSES,
  PediatricDiagnosis,
  RecommendedMedicine,
} from '../data/pediatricDiagnoses.js';

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
  durationDays: number
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

  return {
    instructionEn: `Take ${dosage} (${fm.en}) ${f.en}, ${t.en}${durationStrEn}.`,
    instructionTe: `${dosage} (${fm.te}) ${f.te}, ${t.te}${durationStrTe} వేయండి.`,
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
  const [activeChildDetails, setActiveChildDetails] = useState<any | null>(null);

  // Notice of just-completed patient (allows 1-click print without blocking next patient)
  const [lastCompletedPatientNotice, setLastCompletedPatientNotice] = useState<{
    childName: string;
    appointmentNumber: string;
    prescription: Prescription | null;
  } | null>(null);

  // Clinical inputs
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedDiagnosisObj, setSelectedDiagnosisObj] = useState<PediatricDiagnosis | null>(null);
  const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState('');
  const [selectedDiagnosisCategory, setSelectedDiagnosisCategory] = useState<string>('All');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);

  const [clinicalObservations, setClinicalObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [specialNotesEn, setSpecialNotesEn] = useState('Give plenty of fluids and oral hydration. Return immediately if high fever persists or breathing difficulty develops.');
  const [specialNotesTe, setSpecialNotesTe] = useState('ద్రవ పదార్థాలు ఎక్కువగా ఇవ్వండి. అధిక జ్వరం తగ్గకపోయినా లేదా ఆయాసం వచ్చినా వెంటనే తీసుకురండి.');

  // Vitals inputs in consultation
  const [currentHeight, setCurrentHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentTemp, setCurrentTemp] = useState('98.6');
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
  const [isCustomMedicine, setIsCustomMedicine] = useState(false);

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

    // Automatic real-time queue polling every 5 seconds so next patient & queue stay live without manual refresh
    const queueInterval = setInterval(() => {
      loadQueueSilent();
    }, 5000);

    return () => clearInterval(queueInterval);
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
        if (data.currentPatient && !activeAppointment) {
          startConsultationForAppt(data.currentPatient);
        }
      }
    } catch (err) {
      // Background poll failure handled silently
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

    // Reset prescription items & inputs for fresh patient
    setPrescriptionItems([]);
    setChiefComplaints(['Fever', 'Cough']);
    setDiagnosis('Acute Upper Respiratory Tract Infection (URTI) / Common Cold');
    const defaultDiag = PEDIATRIC_DIAGNOSES.find((d) => d.id === 'diag-urti') || PEDIATRIC_DIAGNOSES[0];
    setSelectedDiagnosisObj(defaultDiag);
    setClinicalObservations('');

    // Default follow-up date (+3 days)
    const d = new Date(config.simulatedDate);
    d.setDate(d.getDate() + 3);
    setFollowUpDate(d.toISOString().split('T')[0]);

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
        if (encData.encounter.diagnosis) {
          setDiagnosis(encData.encounter.diagnosis);
          const matched = PEDIATRIC_DIAGNOSES.find(
            (d) => d.name.toLowerCase() === encData.encounter.diagnosis.toLowerCase()
          );
          if (matched) setSelectedDiagnosisObj(matched);
        }
      }
    } catch (err) {
      console.error('Error starting consultation encounter:', err);
    }
  };

  // Select diagnosis from pediatric library
  const handleSelectDiagnosis = (diag: PediatricDiagnosis) => {
    setSelectedDiagnosisObj(diag);
    setDiagnosis(diag.name);
    setShowDiagnosisDropdown(false);
    setDiagnosisSearchQuery('');

    // Auto-suggest typical complaints
    if (diag.typicalSymptoms && diag.typicalSymptoms.length > 0) {
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
  };

  // Save medicine from dosage configurator
  const handleSaveConfiguredMedicine = () => {
    if (!modalMedicineName.trim()) return;

    const dosageStr = `${modalDosageAmount} ${modalDosageUnit}`;
    const bilingual = buildClientBilingualInstructions(
      modalForm,
      dosageStr,
      modalFrequency,
      modalTiming,
      modalDurationDays
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
      durationDays: Number(modalDurationDays),
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

  // Complete consultation & automatically transition to next patient without refresh
  const handleCompleteAndCallNext = async (showPrintModal: boolean = false) => {
    if (!activeAppointment && !activeEncounter) return;
    setFinalizing(true);
    try {
      // Save growth if entered
      if (currentHeight && currentWeight && activeEncounter) {
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
            doctorId: doctorUser.doctor.id,
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          generatedPrescription = resData.prescription;
          nextPatientData = resData.nextPatient;
        }
      } else if (activeAppointment) {
        const res = await fetch('/api/doctor/complete-treatment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-doctor-token': doctorUser.token,
          },
          body: JSON.stringify({
            doctorId: doctorUser.doctor.id,
            branchId: selectedBranch,
            appointmentId: activeAppointment.id,
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          nextPatientData = resData.nextPatient;
        }
      }

      // Record notice of completed patient
      if (activeAppointment) {
        setLastCompletedPatientNotice({
          childName: activeAppointment.childName,
          appointmentNumber: activeAppointment.appointmentNumber,
          prescription: generatedPrescription,
        });
      }

      if (showPrintModal && generatedPrescription) {
        setShowPrintPrescription(generatedPrescription);
      }

      // Reset consultation pad
      setPrescriptionItems([]);
      setDiagnosis('');
      setSelectedDiagnosisObj(null);
      setChiefComplaints([]);
      setClinicalObservations('');
      setFollowUpDate('');

      // If next patient is available, automatically start consultation for them immediately
      if (nextPatientData) {
        await startConsultationForAppt(nextPatientData);
      } else {
        setActiveAppointment(null);
        setActiveEncounter(null);
        setActiveChildDetails(null);
      }

      await loadQueue();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
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

  // Filter diagnoses based on search and category
  const filteredDiagnoses = PEDIATRIC_DIAGNOSES.filter((d) => {
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
                Treatment completed for <strong>Token #{lastCompletedPatientNotice.appointmentNumber} {lastCompletedPatientNotice.childName}</strong>. Automatically advanced to next patient!
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

      {/* Main OPD Desk Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: OPD Live Queue & Room Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm">Today&rsquo;s OPD Queue</h2>
                  <p className="text-[11px] text-slate-500">{config.simulatedDate} • Real-time Live Sync</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {queueData?.allAppointments?.length || 0} Scheduled
              </span>
            </div>

            {/* Active In-Consultation Patient Card */}
            {activeAppointment ? (
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
            ) : (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No patient currently inside consultation room.</span>
                </div>
                {queueData?.waitingPatients && queueData.waitingPatients.length > 0 && (
                  <button
                    onClick={() => startConsultationForAppt(queueData.waitingPatients[0])}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    Call Token #{queueData.waitingPatients[0].appointmentNumber}
                  </button>
                )}
              </div>
            )}

            {/* Waiting List */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Waiting in Hospital Lobby ({queueData?.waitingPatients?.length || 0})</span>
                <span className="text-[10px] text-teal-600 font-normal">Next will enter automatically</span>
              </div>

              {queueData?.waitingPatients && queueData.waitingPatients.length > 0 ? (
                queueData.waitingPatients.map((appt: any, idx: number) => {
                  const isCurrent = activeAppointment?.id === appt.id;
                  const isNextInLine = idx === 0;
                  return (
                    <div
                      key={appt.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isCurrent
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                          : isNextInLine
                          ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                              #{appt.appointmentNumber}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{appt.childName}</span>
                            <span className="text-xs text-slate-500">({appt.childAge || 3}y)</span>
                            {isNextInLine && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                Next in Line
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
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-slate-50"
                            title="Inspect Child EMR"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startConsultationForAppt(appt)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1"
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
                })
              ) : (
                <div className="text-slate-400 text-xs py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No children currently waiting in the lobby.
                </div>
              )}
            </div>

            {/* Upcoming List */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming Appointments Today ({queueData?.upcomingPatients?.length || 0})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {queueData?.upcomingPatients?.slice(0, 6).map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">#{appt.appointmentNumber}</span>
                      <span className="text-slate-700 font-medium ml-2">{appt.childName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">{appt.bookedTime}</span>
                      <button
                        onClick={() => startConsultationForAppt(appt)}
                        className="text-teal-700 hover:text-teal-900 font-semibold text-[11px]"
                      >
                        Start
                      </button>
                    </div>
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
              {/* Consultation Top Header & Quick Action */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectChildId(activeAppointment.childId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-semibold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>EMR History</span>
                  </button>

                  {/* Primary Next Patient Quick Button in Header */}
                  <button
                    type="button"
                    disabled={finalizing}
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

              {/* Chief Complaints */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Common Chief Complaints</label>
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

                {/* SEARCHABLE PEDIATRIC DIAGNOSIS SELECTOR */}
                <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Provisional / Confirmed Diagnosis *
                    </label>
                    <span className="text-[11px] text-teal-700 font-semibold">
                      Pediatric Directory ({PEDIATRIC_DIAGNOSES.length} Conditions)
                    </span>
                  </div>

                  {/* Active Selected Diagnosis Highlight */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => {
                        setDiagnosis(e.target.value);
                        const matched = PEDIATRIC_DIAGNOSES.find(
                          (d) => d.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        setSelectedDiagnosisObj(matched || null);
                      }}
                      placeholder="Type or search pediatric condition (e.g., Bronchitis, Fever, Diarrhea, Colic, Asthma...)"
                      className="w-full p-2.5 bg-white rounded-xl border border-teal-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDiagnosisDropdown(!showDiagnosisDropdown)}
                      className="px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{showDiagnosisDropdown ? 'Close' : 'Browse Conditions'}</span>
                    </button>
                  </div>

                  {selectedDiagnosisObj && (
                    <div className="bg-white p-3 rounded-xl border border-teal-200 text-xs flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-teal-950 flex items-center gap-2">
                          <span>{selectedDiagnosisObj.name}</span>
                          <span className="font-mono text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                            ICD-10: {selectedDiagnosisObj.icdCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <strong>తెలుగు: </strong>{selectedDiagnosisObj.teluguName}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                        {selectedDiagnosisObj.recommendedMedicines.length} Matched Drugs
                      </span>
                    </div>
                  )}

                  {/* Diagnosis Search & Category Browser Dropdown */}
                  {showDiagnosisDropdown && (
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-300 shadow-xl space-y-3 mt-2">
                      {/* Search & Category Tabs */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={diagnosisSearchQuery}
                            onChange={(e) => setDiagnosisSearchQuery(e.target.value)}
                            placeholder="Filter by condition, Telugu name, symptoms, or ICD code..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                          />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {[
                            'All',
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
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                selectedDiagnosisCategory === cat
                                  ? 'bg-teal-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* List of Filtered Diagnoses */}
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                        {filteredDiagnoses.map((diag) => {
                          const isSelected = selectedDiagnosisObj?.id === diag.id;
                          return (
                            <div
                              key={diag.id}
                              onClick={() => handleSelectDiagnosis(diag)}
                              className={`p-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-between ${
                                isSelected ? 'bg-teal-50 border border-teal-400' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{diag.name}</span>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold">
                                    {diag.icdCode}
                                  </span>
                                </div>
                                <div className="text-[11px] text-teal-800 mt-0.5">
                                  {diag.teluguName}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Category: {diag.category} • Symptoms: {diag.typicalSymptoms.slice(0, 3).join(', ')}
                                </div>
                              </div>

                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold text-[11px] hover:bg-teal-600 hover:text-white transition shrink-0 ml-2"
                              >
                                Select
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Fast Prescription Pad */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Pediatric Prescription &amp; Dosage Configurator</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tailored pediatric drug dosages with automatic bilingual English &amp; Telugu parent instructions
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openCustomMedicineConfigurator}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-teal-800 text-xs font-bold transition border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Custom Medicine</span>
                  </button>
                </div>

                {/* 1. RECOMMENDED MEDICINES FOR THE SELECTED DIAGNOSIS */}
                {selectedDiagnosisObj && selectedDiagnosisObj.recommendedMedicines.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white p-4 rounded-2xl border-2 border-teal-400/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Recommended Medicines for {selectedDiagnosisObj.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                        Click to configure dose
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDiagnosisObj.recommendedMedicines.map((med, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openMedicineConfigurator(med)}
                          className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-500 hover:shadow-sm text-left transition group"
                        >
                          <div className="font-bold text-slate-900 text-xs group-hover:text-teal-900 flex items-center justify-between">
                            <span>{med.medicineName}</span>
                            <span className="text-teal-600 font-extrabold text-xs">+ Configure</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                              {med.form}
                            </span>
                            <span>Dose: <strong>{med.defaultDosage}</strong></span>
                            <span>•</span>
                            <span>{med.frequency.replace(/_/g, ' ')}</span>
                          </div>
                          {med.instructionsHint && (
                            <div className="text-[10px] text-teal-800/80 mt-1 italic line-clamp-1">
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
                        placeholder="Search medicines..."
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

                {/* 3. PRESCRIBED ITEMS TABLE / LIST */}
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

                {/* Action Buttons: Mark Completed & Next Patient / Finalize & Print */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
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

                  <div className="flex items-center gap-2.5">
                    {/* Primary Button: Mark Completed & Call Next Patient (Seamless Flow, No Refresh) */}
                    <button
                      type="button"
                      disabled={finalizing || !diagnosis}
                      onClick={() => handleCompleteAndCallNext(false)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {finalizing ? (
                        <span>Updating Patient &amp; Calling Next...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Completed &amp; Call Next Patient</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Secondary Button: Finalize & Print Prescription */}
                    <button
                      type="button"
                      disabled={finalizing || !diagnosis}
                      onClick={() => handleCompleteAndCallNext(true)}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Finalize &amp; Print</span>
                    </button>
                  </div>
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

      {/* MODAL: INTERACTIVE PEDIATRIC DOSAGE & SCHEDULE CONFIGURATOR */}
      {configuringMedicine && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Pediatric Dosage Calculator
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">
                  {isCustomMedicine ? 'Prescribe Custom Medicine' : modalMedicineName}
                </h3>
                {modalGenericName && (
                  <div className="text-xs text-slate-500">Generic: {modalGenericName}</div>
                )}
              </div>
              <button
                onClick={() => {
                  setConfiguringMedicine(null);
                  setEditingItemIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            {/* Dosage Amount & Unit (e.g. 2.5 ml, 5 ml, 7.5 ml for syrups; drops; tablets) */}
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

            {/* Daily Frequency ("when he should use daily") */}
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
                    modalDurationDays
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
                    modalDurationDays
                  ).instructionTe
                }
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setConfiguringMedicine(null);
                  setEditingItemIndex(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfiguredMedicine}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingItemIndex !== null ? 'Save Changes' : 'Add to Prescription'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child EMR Full Modal */}
      {inspectChildId && (
        <ChildHealthDashboardModal
          childId={inspectChildId}
          onClose={() => setInspectChildId(null)}
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
