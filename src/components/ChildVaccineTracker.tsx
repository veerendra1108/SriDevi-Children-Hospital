import React, { useState } from 'react';
import {
  ChildVaccinationProgram,
  VaccinationDose,
} from '../types/index.js';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Info,
  CalendarCheck,
  Award,
  Baby,
  Syringe,
} from 'lucide-react';

interface ChildVaccineTrackerProps {
  program: ChildVaccinationProgram;
  onRefresh?: () => void;
  onBookAppointment?: (milestoneLabel: string) => void;
}

export const ChildVaccineTracker: React.FC<ChildVaccineTrackerProps> = ({
  program,
  onRefresh,
  onBookAppointment,
}) => {
  const [expandedDoseId, setExpandedDoseId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Completed & Next dose calculations
  const totalDoses = program.doses.length;
  const completedDoses = program.doses.filter((d) => d.status === 'GIVEN').length;
  const completionPercentage = Math.round((completedDoses / totalDoses) * 100);

  // Find the next upcoming/due dose
  const nextDose = program.doses.find(
    (d) => d.status === 'PENDING' || d.status === 'DUE_SOON' || d.status === 'OVERDUE'
  );

  const calculateDaysRemaining = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextDoseDays = nextDose ? calculateDaysRemaining(nextDose.dueDate) : null;

  const filteredDoses = program.doses.filter((dose) => {
    if (filterMode === 'COMPLETED') return dose.status === 'GIVEN';
    if (filterMode === 'PENDING') return dose.status !== 'GIVEN';
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Strip */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shadow-xs">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{program.childName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                  {program.childGender}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Registered for Vaccines
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  First Vaccine Given On:{' '}
                  <strong className="text-slate-700">{program.firstVaccineDate}</strong>
                </span>
                <span>•</span>
                <span>
                  Parent:{' '}
                  <strong className="text-slate-700">{program.parentName}</strong> ({program.parentMobile})
                </span>
                <span>•</span>
                <span>
                  Branch:{' '}
                  <strong className="text-slate-700 capitalize">{program.registeredByBranchId}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print Digital Immunization Card"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Card</span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Calculation Rule Explanation Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>IAP 2018 Immunization Protocol:</strong> All milestone intervals (6w, 10w, 14w, 6m, 9m, etc.) are dynamically calculated from the <strong>Date of First Vaccine Given ({program.firstVaccineDate})</strong>, ensuring exact clinical timing without requiring birth certificate records.
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1.5">
            <span>
              Immunization Progress: <strong className="text-slate-900">{completedDoses} of {totalDoses}</strong> milestones completed
            </span>
            <span className="font-bold text-teal-700">{completionPercentage}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hero: Next Due Vaccine Card */}
      {nextDose ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white p-6 sm:p-7 shadow-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Next Due Vaccine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/15">
                IAP 2018 Milestone
              </span>
            </div>

            {nextDoseDays !== null && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  nextDoseDays < 0
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 animate-pulse'
                    : nextDoseDays === 0
                    ? 'bg-amber-400/30 text-amber-200 border border-amber-300/40 animate-pulse'
                    : nextDoseDays <= 7
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                    : 'bg-teal-400/20 text-teal-200 border border-teal-300/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {nextDoseDays < 0
                  ? `Overdue by ${Math.abs(nextDoseDays)} days`
                  : nextDoseDays === 0
                  ? 'Due Today!'
                  : `Due in ${nextDoseDays} days`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-xs text-teal-200 uppercase tracking-wider font-semibold">Milestone Age</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  {nextDose.ageLabel}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-sm text-teal-100">
                <Calendar className="w-4 h-4 text-teal-300" />
                <span>
                  Scheduled Due Date:{' '}
                  <strong className="text-white font-semibold text-base">{nextDose.dueDate}</strong>
                </span>
              </div>

              {/* Vaccines Included in this dose */}
              <div>
                <p className="text-xs text-teal-200 uppercase tracking-wider font-semibold mb-2">
                  Vaccines to be administered:
                </p>
                <div className="flex flex-wrap gap-2">
                  {nextDose.vaccines.map((v, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/15 text-white border border-white/20 shadow-xs flex items-center gap-1.5"
                    >
                      <Syringe className="w-3 h-3 text-teal-300" />
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-semibold text-teal-200">Doctor's Clinical Note</p>
                <p className="text-xs text-slate-200 mt-1">
                  Vaccines should be given on or near the due date for optimal antibody development. Walk-in or book a pediatrician slot.
                </p>
              </div>

              {onBookAppointment && (
                <button
                  onClick={() => onBookAppointment(nextDose.ageLabel)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4 text-teal-700" />
                  <span>Book Consultation for Vaccine</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 text-center text-emerald-900">
          <Award className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-lg font-bold">All 14 IAP 2018 Vaccines Completed!</h3>
          <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
            Hearty congratulations! {program.childName} has received all milestone vaccines according to the Indian Academy of Pediatrics 2018 immunization table.
          </p>
        </div>
      )}

      {/* Complete IAP 2018 Vaccine Schedule Timeline */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Full IAP 2018 Immunization Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Standard 14 clinical milestones approved by Indian Academy of Pediatrics (IAP)
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalDoses})
            </button>
            <button
              onClick={() => setFilterMode('PENDING')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === 'PENDING'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({totalDoses - completedDoses})
            </button>
            <button
              onClick={() => setFilterMode('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === 'COMPLETED'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedDoses})
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-3.5">
          {filteredDoses.map((dose, idx) => {
            const isGiven = dose.status === 'GIVEN';
            const isNext = nextDose?.id === dose.id;
            const isExpanded = expandedDoseId === dose.id;
            const daysLeft = calculateDaysRemaining(dose.dueDate);

            return (
              <div
                key={dose.id}
                className={`rounded-2xl border transition-all duration-200 ${
                  isNext
                    ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                    : isGiven
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-slate-200/70 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  onClick={() => setExpandedDoseId(isExpanded ? null : dose.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Status Icon Indicator */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isGiven
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNext
                          ? 'bg-teal-600 text-white shadow-xs animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isGiven ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isNext ? (
                        <Syringe className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {dose.ageLabel}
                        </h4>

                        {isNext && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-600 text-white">
                            Next Due
                          </span>
                        )}

                        {isGiven ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Given on {dose.givenDate}
                          </span>
                        ) : daysLeft < 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Due on {dose.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Vaccine List preview */}
                      <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Vaccines:</span>
                        {dose.vaccines.join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs text-slate-400">
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Card */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-100/80 bg-slate-50/50 rounded-b-2xl text-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                        <span className="text-slate-400 block mb-1">Scheduled Due Date</span>
                        <strong className="text-slate-800 text-sm">{dose.dueDate}</strong>
                      </div>

                      {isGiven ? (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                            <span className="text-slate-400 block mb-1">Administered By</span>
                            <strong className="text-slate-800 text-sm">
                              {dose.administeredBy || 'Hospital Pediatrician'}
                            </strong>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                            <span className="text-slate-400 block mb-1">Batch Number</span>
                            <strong className="text-slate-800 text-sm font-mono">
                              {dose.batchNumber || 'SRI-VAC-2026'}
                            </strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                            <span className="text-slate-400 block mb-1">Timing Status</span>
                            <strong className="text-slate-800 text-sm">
                              {daysLeft < 0
                                ? `Overdue by ${Math.abs(daysLeft)} days`
                                : daysLeft === 0
                                ? 'Due Today'
                                : `Due in ${daysLeft} days`}
                            </strong>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                            <span className="text-slate-400 block mb-1">Hospital Recommendation</span>
                            <strong className="text-slate-800 text-sm">
                              Administer without skipping intervals
                            </strong>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Vaccines Detailed Breakdown */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 font-semibold block mb-2">
                        Vaccines Included In This Milestone ({dose.vaccines.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dose.vaccines.map((vacName, vIndex) => (
                          <div
                            key={vIndex}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/50"
                          >
                            <Syringe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="font-semibold text-slate-800">{vacName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {dose.notes && (
                      <p className="text-slate-500 italic">
                        <strong>Notes:</strong> {dose.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
