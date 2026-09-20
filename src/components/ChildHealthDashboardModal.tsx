import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Heart,
  Activity,
  Calendar,
  User,
  Shield,
  FileText,
  Plus,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Printer,
  Scale,
  Smile,
  Info,
} from 'lucide-react';
import {
  Child,
  ChildAllergy,
  ChildCondition,
  PediatricGrowthRecord,
  Encounter,
  ClinicalCorrectionRequest,
  Doctor,
  DoctorAccount,
} from '../types/index.js';

interface ChildHealthDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  doctorUser?: { doctor: Doctor; account: DoctorAccount; token: string } | null;
  onRefresh?: () => void;
}

export const ChildHealthDashboardModal: React.FC<ChildHealthDashboardModalProps> = ({
  isOpen,
  onClose,
  childId,
  doctorUser,
  onRefresh,
}) => {
  const [data, setData] = useState<{
    child: any;
    parent: any;
    alerts: any[];
    allergies: ChildAllergy[];
    conditions: ChildCondition[];
    growthRecords: PediatricGrowthRecord[];
    encounters: Encounter[];
    correctionRequests: ClinicalCorrectionRequest[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'allergies' | 'encounters' | 'requests'>('overview');
  const [copiedId, setCopiedId] = useState(false);

  // Modals for adding clinical data
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [newSubstance, setNewSubstance] = useState('');
  const [newReaction, setNewReaction] = useState('');
  const [newSeverity, setNewSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'>('MODERATE');
  const [allergyNotes, setAllergyNotes] = useState('');

  const [showAddCondition, setShowAddCondition] = useState(false);
  const [newConditionName, setNewConditionName] = useState('');
  const [newCategory, setNewCategory] = useState<'RESPIRATORY' | 'CHRONIC' | 'DEVELOPMENTAL' | 'GASTROINTESTINAL' | 'ALLERGIC' | 'OTHER'>('RESPIRATORY');
  const [conditionNotes, setConditionNotes] = useState('');
  const [followUpRec, setFollowUpRec] = useState('');

  const [showAddGrowth, setShowAddGrowth] = useState(false);
  const [growthHeight, setGrowthHeight] = useState('');
  const [growthWeight, setGrowthWeight] = useState('');
  const [growthTemp, setGrowthTemp] = useState('');
  const [growthPulse, setGrowthPulse] = useState('');
  const [growthNotes, setGrowthNotes] = useState('');

  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && childId) {
      loadChildRecord();
    }
  }, [isOpen, childId]);

  const loadChildRecord = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emr/children/${childId}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error('Failed to load child medical record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch(`/api/emr/children/${childId}/allergies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser?.token || '',
        },
        body: JSON.stringify({
          substance: newSubstance,
          reaction: newReaction,
          severity: newSeverity,
          notes: allergyNotes,
          doctorId: doctorUser?.doctor.id || 'dr-subba-rao',
          doctorName: doctorUser?.doctor.name || 'Dr. K. Subba Rao',
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) throw new Error(resJson.message || 'Failed to add allergy');

      setShowAddAllergy(false);
      setNewSubstance('');
      setNewReaction('');
      setAllergyNotes('');
      loadChildRecord();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch(`/api/emr/children/${childId}/conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser?.token || '',
        },
        body: JSON.stringify({
          conditionName: newConditionName,
          category: newCategory,
          status: 'ACTIVE',
          notes: conditionNotes,
          followUpRecommendation: followUpRec,
          doctorId: doctorUser?.doctor.id || 'dr-subba-rao',
          doctorName: doctorUser?.doctor.name || 'Dr. K. Subba Rao',
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) throw new Error(resJson.message || 'Failed to add condition');

      setShowAddCondition(false);
      setNewConditionName('');
      setConditionNotes('');
      setFollowUpRec('');
      loadChildRecord();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddGrowthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch(`/api/emr/children/${childId}/growth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser?.token || '',
        },
        body: JSON.stringify({
          heightCm: Number(growthHeight),
          weightKg: Number(growthWeight),
          temperatureF: growthTemp ? Number(growthTemp) : undefined,
          pulseRate: growthPulse ? Number(growthPulse) : undefined,
          notes: growthNotes,
          recordedByRole: doctorUser ? 'DOCTOR' : 'RECEPTIONIST',
          recordedByName: doctorUser?.doctor.name || 'Medical Staff',
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) throw new Error(resJson.message || 'Failed to record growth');

      setShowAddGrowth(false);
      setGrowthHeight('');
      setGrowthWeight('');
      setGrowthTemp('');
      setGrowthPulse('');
      setGrowthNotes('');
      loadChildRecord();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleUpdateAllergyStatus = async (allergyId: string, status: 'RESOLVED' | 'ENTERED_IN_ERROR' | 'ACTIVE') => {
    try {
      await fetch(`/api/emr/allergies/${allergyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser?.token || '',
        },
        body: JSON.stringify({
          status,
          doctorId: doctorUser?.doctor.id || 'dr-subba-rao',
          doctorName: doctorUser?.doctor.name || 'Dr. K. Subba Rao',
        }),
      });
      loadChildRecord();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewCorrection = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const notes = prompt(`Please enter review notes for this correction (${status}):`, 'Verified by pediatrician during OPD consultation');
    if (notes === null) return;

    try {
      await fetch(`/api/emr/correction-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-doctor-token': doctorUser?.token || '',
        },
        body: JSON.stringify({
          status,
          doctorReviewNotes: notes,
          doctorId: doctorUser?.doctor.id || 'dr-subba-rao',
        }),
      });
      loadChildRecord();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const latestGrowth = data?.growthRecords?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Permanent Child ID banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white px-6 py-5 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-teal-200 text-2xl font-bold shadow-inner">
                {data?.child?.name?.[0] || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{data?.child?.name || 'Loading Patient...'}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 border border-teal-300/30 text-teal-100 text-xs font-semibold">
                    {data?.child?.gender || 'Child'}, {data?.child?.ageYears || 3} Yrs
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold">
                    Blood: {data?.child?.bloodGroup || 'B+'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-teal-100/90 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-teal-300 font-mono font-bold tracking-wider">
                      {data?.child?.permanentId || 'DM-SDCH-000101'}
                    </span>
                    <button
                      onClick={() => handleCopyId(data?.child?.permanentId || 'DM-SDCH-000101')}
                      className="text-teal-300 hover:text-white transition p-0.5"
                      title="Copy permanent Child ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span>•</span>
                  <span>Parent: <strong>{data?.parent?.name}</strong> ({data?.parent?.mobile})</span>
                  <span>•</span>
                  <span>DOB: {data?.child?.dateOfBirth || '2023-04-10'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Critical Medical Alerts Bar (Persistent Safety Layer) */}
          {data?.alerts && data.alerts.length > 0 ? (
            <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-100 shadow-sm animate-pulse-slow">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Critical Medical Alerts ({data.alerts.length})
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.alerts.map((al: any) => (
                    <span
                      key={al.id}
                      className="inline-flex items-center gap-1 text-xs bg-rose-900/90 text-white px-2.5 py-1 rounded-lg border border-rose-400/30"
                    >
                      <strong>{al.title}</strong> — {al.description}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 py-1.5 px-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>No documented drug allergies or chronic clinical contraindications on file.</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 flex items-center justify-between overflow-x-auto shrink-0">
          <div className="flex space-x-1 sm:space-x-4">
            {[
              { id: 'overview', label: 'Clinical Summary', icon: Activity },
              { id: 'growth', label: 'Growth & Vitals', icon: Scale },
              { id: 'allergies', label: `Allergies & Conditions (${(data?.allergies?.length || 0) + (data?.conditions?.length || 0)})`, icon: AlertTriangle },
              { id: 'encounters', label: `Encounters (${data?.encounters?.length || 0})`, icon: FileText },
              { id: 'requests', label: `Correction Requests (${data?.correctionRequests?.length || 0})`, icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-800 bg-white shadow-xs rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading Child Health Record...</span>
            </div>
          ) : (
            <>
              {actionError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Pediatric Growth Highlights Card */}
                  <div className="bg-gradient-to-br from-teal-50/70 via-sky-50/40 to-slate-50 border border-teal-100 rounded-3xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Pediatric Growth &amp; Development</h3>
                          <p className="text-xs text-slate-500">Evaluated against IAP / WHO pediatric percentiles</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddGrowth(true)}
                        className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-teal-50 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Update Vitals</span>
                      </button>
                    </div>

                    {latestGrowth ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Height</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {latestGrowth.heightCm} <span className="text-xs font-semibold text-slate-500">cm</span>
                          </div>
                          {latestGrowth.heightDeltaCm !== undefined && (
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                              <span>+{latestGrowth.heightDeltaCm} cm</span>
                              <span className="text-slate-400 font-normal">vs prev</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Weight</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {latestGrowth.weightKg} <span className="text-xs font-semibold text-slate-500">kg</span>
                          </div>
                          {latestGrowth.weightDeltaKg !== undefined && (
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                              <span>+{latestGrowth.weightDeltaKg} kg</span>
                              <span className="text-slate-400 font-normal">vs prev</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pediatric BMI</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {latestGrowth.pediatricBmi} <span className="text-xs font-semibold text-slate-500">kg/m²</span>
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              latestGrowth.growthStatus === 'HEALTHY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {latestGrowth.growthStatus}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Last Recorded</div>
                          <div className="text-sm font-bold text-slate-900 mt-1">{latestGrowth.recordedDate}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-1">
                            By {latestGrowth.recordedByName}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No growth or vitals recorded yet. Click &ldquo;Update Vitals&rdquo; to add first measurement.
                      </div>
                    )}

                    {latestGrowth?.interpretationText && (
                      <div className="mt-3 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-teal-100 flex items-start gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>{latestGrowth.interpretationText}</div>
                      </div>
                    )}
                  </div>

                  {/* Two Columns: Active Conditions & Latest Consultation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Active Conditions */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>Documented Conditions</span>
                        </h4>
                        <button
                          onClick={() => setShowAddCondition(true)}
                          className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>

                      {data?.conditions && data.conditions.length > 0 ? (
                        <div className="space-y-2.5">
                          {data.conditions.map((c) => (
                            <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{c.conditionName}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    c.status === 'ACTIVE'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <div className="text-slate-500 mt-1">
                                Category: {c.category} • Identified: {c.firstIdentifiedDate}
                              </div>
                              {c.notes && <div className="text-slate-700 mt-1 italic">&ldquo;{c.notes}&rdquo;</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs py-4 text-center">No chronic conditions recorded.</div>
                      )}
                    </div>

                    {/* Latest Consultation Notes */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span>Latest Consultation</span>
                        </h4>
                        {data?.encounters && data.encounters.length > 0 && (
                          <button
                            onClick={() => setActiveTab('encounters')}
                            className="text-xs text-teal-700 font-semibold hover:underline"
                          >
                            View All ({data.encounters.length})
                          </button>
                        )}
                      </div>

                      {data?.encounters && data.encounters.length > 0 ? (
                        <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-900 font-bold">
                            <span>{data.encounters[0].date}</span>
                            <span className="text-teal-700">{data.encounters[0].doctorName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Diagnosis: </span>
                            <strong className="text-slate-800">{data.encounters[0].diagnosis || 'Clinical evaluation'}</strong>
                          </div>
                          {data.encounters[0].prescription && (
                            <div className="text-[11px] bg-white p-2 rounded-xl border border-teal-200/60 mt-2">
                              <span className="font-semibold text-slate-700">Prescription #{data.encounters[0].prescription.prescriptionNumber}: </span>
                              <span>{data.encounters[0].prescription.items.length} items prescribed</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs py-4 text-center">No previous consultations logged.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GROWTH & VITALS */}
              {activeTab === 'growth' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Longitudinal Growth Trajectory</h3>
                      <p className="text-xs text-slate-500">Tracks height, weight, and BMI progression over pediatric age</p>
                    </div>
                    <button
                      onClick={() => setShowAddGrowth(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record New Vitals</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Age</th>
                          <th className="p-3.5">Height (cm)</th>
                          <th className="p-3.5">Weight (kg)</th>
                          <th className="p-3.5">Pediatric BMI</th>
                          <th className="p-3.5">Growth Status</th>
                          <th className="p-3.5">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.growthRecords && data.growthRecords.length > 0 ? (
                          data.growthRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3.5 font-bold text-slate-900">{rec.recordedDate}</td>
                              <td className="p-3.5 text-slate-600">{rec.ageYears} Yrs ({rec.ageMonths}m)</td>
                              <td className="p-3.5 font-semibold text-slate-800">
                                {rec.heightCm} cm
                                {rec.heightDeltaCm !== undefined && (
                                  <span className="text-[10px] text-emerald-600 ml-1 font-normal">(+{rec.heightDeltaCm})</span>
                                )}
                              </td>
                              <td className="p-3.5 font-semibold text-slate-800">
                                {rec.weightKg} kg
                                {rec.weightDeltaKg !== undefined && (
                                  <span className="text-[10px] text-emerald-600 ml-1 font-normal">(+{rec.weightDeltaKg})</span>
                                )}
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">{rec.pediatricBmi}</td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    rec.growthStatus === 'HEALTHY'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {rec.growthStatus}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500">{rec.recordedByName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No growth records on file.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ALLERGIES & CONDITIONS */}
              {activeTab === 'allergies' && (
                <div className="space-y-6">
                  {/* Allergies Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Documented Drug &amp; Food Allergies</span>
                        </h4>
                        <p className="text-xs text-slate-500">Contraindicated medications are actively flagged on prescription</p>
                      </div>
                      <button
                        onClick={() => setShowAddAllergy(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Allergy</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {data?.allergies && data.allergies.length > 0 ? (
                        data.allergies.map((al) => (
                          <div
                            key={al.id}
                            className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition ${
                              al.status === 'ACTIVE'
                                ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                                : 'bg-slate-50 border-slate-200 text-slate-600 opacity-75'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm">{al.substance}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded-md">
                                  {al.allergyType}
                                </span>
                                <span className="text-[10px] font-semibold bg-white border border-rose-300 text-rose-700 px-2 py-0.5 rounded-md">
                                  Severity: {al.severity}
                                </span>
                                <span className="text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                                  Status: {al.status}
                                </span>
                              </div>
                              <div className="text-xs mt-1.5 font-medium">
                                Reaction: <strong>{al.reaction}</strong>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                Identified on {al.identifiedDate} by {al.doctorName}
                                {al.notes && ` • "${al.notes}"`}
                              </div>
                            </div>

                            {al.status === 'ACTIVE' && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleUpdateAllergyStatus(al.id, 'RESOLVED')}
                                  className="text-[11px] font-medium text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition"
                                >
                                  Mark Resolved
                                </button>
                                <button
                                  onClick={() => handleUpdateAllergyStatus(al.id, 'ENTERED_IN_ERROR')}
                                  className="text-[11px] font-medium text-rose-700 bg-white border border-rose-200 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                                >
                                  Entered in Error
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-xs py-6 text-center bg-slate-50 rounded-2xl">
                          No allergies recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chronic Conditions Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-teal-600" />
                          <span>Chronic &amp; Recurring Conditions</span>
                        </h4>
                        <p className="text-xs text-slate-500">Long-term pediatric health conditions requiring follow-up</p>
                      </div>
                      <button
                        onClick={() => setShowAddCondition(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Condition</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {data?.conditions && data.conditions.length > 0 ? (
                        data.conditions.map((co) => (
                          <div
                            key={co.id}
                            className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{co.conditionName}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  {co.category}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                  {co.status}
                                </span>
                              </div>
                              <div className="text-slate-500 mt-1">
                                Identified: {co.firstIdentifiedDate} by {co.doctorName}
                              </div>
                              {co.followUpRecommendation && (
                                <div className="text-teal-700 font-medium mt-1">
                                  Follow-up: {co.followUpRecommendation}
                                </div>
                              )}
                              {co.notes && <div className="text-slate-600 mt-1 italic">&ldquo;{co.notes}&rdquo;</div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-xs py-6 text-center bg-slate-50 rounded-2xl">
                          No chronic conditions recorded.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ENCOUNTERS & PRESCRIPTION HISTORY */}
              {activeTab === 'encounters' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Encounter Timeline</h3>

                  <div className="space-y-3">
                    {data?.encounters && data.encounters.length > 0 ? (
                      data.encounters.map((enc) => (
                        <div
                          key={enc.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition shadow-2xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{enc.date}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs font-semibold text-teal-700">{enc.doctorName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-bold">
                                {enc.visitType}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {enc.status}
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-slate-700">
                            <strong>Diagnosis: </strong>
                            <span>{enc.diagnosis || 'Pediatric Clinical Review'}</span>
                          </div>

                          {enc.prescription && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                                <span>Digital Prescription #{enc.prescription.prescriptionNumber}</span>
                                <span className="text-slate-500 font-normal">
                                  {enc.prescription.items.length} Medicines Prescribed
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {enc.prescription.items.map((item, idx) => (
                                  <div key={idx} className="text-xs bg-white p-2 rounded-lg border border-slate-100">
                                    <div className="font-bold text-slate-900">{item.medicineName} ({item.dosage})</div>
                                    <div className="text-slate-600 text-[11px] mt-0.5">
                                      En: {item.instructionEn}
                                    </div>
                                    <div className="text-teal-800 text-[11px] font-medium mt-0.5">
                                      Te: {item.instructionTe}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-xs py-10 text-center">
                        No previous encounters logged for this child.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CORRECTION REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Parent Correction Requests</h3>
                      <p className="text-xs text-slate-500">Audit-logged corrections submitted by parents for clinical review</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {data?.correctionRequests && data.correctionRequests.length > 0 ? (
                      data.correctionRequests.map((req) => (
                        <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-white text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              Target: {req.entityType} ({req.createdAt.split('T')[0]})
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : req.status === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 italic">
                            &ldquo;{req.requestNote}&rdquo;
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Requested by parent: {req.parentName} ({req.parentMobile})
                          </div>

                          {req.doctorReviewNotes && (
                            <div className="p-2 rounded-lg bg-teal-50 text-teal-900 text-[11px] border border-teal-100">
                              <strong>Doctor Note: </strong>{req.doctorReviewNotes}
                            </div>
                          )}

                          {req.status === 'PENDING' && (
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleReviewCorrection(req.id, 'ACCEPTED')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                              >
                                Accept Correction
                              </button>
                              <button
                                onClick={() => handleReviewCorrection(req.id, 'REJECTED')}
                                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl">
                        No pending or past correction requests.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL: ADD ALLERGY */}
        {showAddAllergy && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Document Drug Allergy</span>
                </h3>
                <button onClick={() => setShowAddAllergy(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAllergySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medication / Substance Name</label>
                  <input
                    type="text"
                    required
                    value={newSubstance}
                    onChange={(e) => setNewSubstance(e.target.value)}
                    placeholder="e.g. Amoxicillin, Ceftriaxone, Ibuprofen"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observed Reaction</label>
                  <input
                    type="text"
                    required
                    value={newReaction}
                    onChange={(e) => setNewReaction(e.target.value)}
                    placeholder="e.g. Facial hives, difficulty breathing, rash"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="MILD">Mild (Local itch/erythema)</option>
                    <option value="MODERATE">Moderate (Widespread rash/urticaria)</option>
                    <option value="SEVERE">Severe (Facial edema/wheezing)</option>
                    <option value="LIFE_THREATENING">Life-Threatening (Anaphylaxis)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Notes</label>
                  <textarea
                    rows={2}
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    placeholder="Context, past exposure, emergency action taken"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAllergy(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                  >
                    Save Allergy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD CONDITION */}
        {showAddCondition && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-600" />
                  <span>Document Chronic Condition</span>
                </h3>
                <button onClick={() => setShowAddCondition(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddConditionSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condition Name</label>
                  <input
                    type="text"
                    required
                    value={newConditionName}
                    onChange={(e) => setNewConditionName(e.target.value)}
                    placeholder="e.g. Childhood Asthma, Febrile Seizures, Sinusitis"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="RESPIRATORY">Respiratory</option>
                    <option value="ALLERGIC">Allergic</option>
                    <option value="CHRONIC">Chronic</option>
                    <option value="DEVELOPMENTAL">Developmental</option>
                    <option value="GASTROINTESTINAL">Gastrointestinal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Follow-up Recommendation</label>
                  <input
                    type="text"
                    value={followUpRec}
                    onChange={(e) => setFollowUpRec(e.target.value)}
                    placeholder="e.g. Review every 3 months or upon exacerbation"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Notes</label>
                  <textarea
                    rows={2}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    placeholder="Clinical findings, baseline medication"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCondition(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                  >
                    Save Condition
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD GROWTH */}
        {showAddGrowth && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-600" />
                  <span>Record Vitals &amp; Growth</span>
                </h3>
                <button onClick={() => setShowAddGrowth(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddGrowthSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Height (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={growthHeight}
                      onChange={(e) => setGrowthHeight(e.target.value)}
                      placeholder="e.g. 96.5"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={growthWeight}
                      onChange={(e) => setGrowthWeight(e.target.value)}
                      placeholder="e.g. 14.5"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={growthTemp}
                      onChange={(e) => setGrowthTemp(e.target.value)}
                      placeholder="e.g. 98.6"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={growthPulse}
                      onChange={(e) => setGrowthPulse(e.target.value)}
                      placeholder="e.g. 102"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Observation Notes</label>
                  <textarea
                    rows={2}
                    value={growthNotes}
                    onChange={(e) => setGrowthNotes(e.target.value)}
                    placeholder="e.g. Child cooperative, appetite normal"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGrowth(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                  >
                    Calculate &amp; Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
