import React, { useState } from 'react';
import { BranchId, Parent } from '../types/index.js';
import {
  X,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  Baby,
  Syringe,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Building,
} from 'lucide-react';

interface RegisterVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (program: any) => void;
  parents: Parent[];
  currentBranchId: BranchId;
  simulatedDate: string;
}

export const RegisterVaccineModal: React.FC<RegisterVaccineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parents,
  currentBranchId,
  simulatedDate,
}) => {
  // Form State
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isNewChild, setIsNewChild] = useState<boolean>(false);
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildGender, setNewChildGender] = useState<'Boy' | 'Girl'>('Boy');

  // Payment Details
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentReceiptNo, setPaymentReceiptNo] = useState<string>(
    `REC-VAC-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(true);

  // First Vaccine Given Details (Anchor Date)
  const [firstVaccineDate, setFirstVaccineDate] = useState<string>(simulatedDate);
  const [firstMilestoneId, setFirstMilestoneId] = useState<string>('birth');
  const [administeredFirstDoseToday, setAdministeredFirstDoseToday] = useState<boolean>(true);
  const [batchNumber, setBatchNumber] = useState<string>('SRI-VAC-2026');
  const [branchId, setBranchId] = useState<BranchId>(currentBranchId);
  const [notes, setNotes] = useState<string>('Enrolled at reception desk after payment verification.');

  // UI state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentParent = parents.find((p) => p.id === selectedParentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedParentId) {
      setErrorMsg('Please select a parent.');
      return;
    }

    if (!paymentConfirmed) {
      setErrorMsg('Payment confirmation is required to register a child for the vaccine program.');
      return;
    }

    if (!isNewChild && !selectedChildId) {
      setErrorMsg('Please select a child or choose to add a new child.');
      return;
    }

    if (isNewChild && !newChildName.trim()) {
      setErrorMsg('Please enter the child name.');
      return;
    }

    if (!firstVaccineDate) {
      setErrorMsg('Please select the date of first vaccine given (anchor date).');
      return;
    }

    setSubmitting(true);

    try {
      let finalChildId = selectedChildId;
      let finalChildName = '';
      let finalChildGender = newChildGender;

      // If new child, create child under parent first
      if (isNewChild && currentParent) {
        const createChildRes = await fetch(`/api/parents/${currentParent.id}/children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newChildName.trim(),
            gender: newChildGender,
          }),
        });
        const createChildData = await createChildRes.json();
        if (createChildData.success && createChildData.child) {
          finalChildId = createChildData.child.id;
          finalChildName = createChildData.child.name;
        } else {
          throw new Error(createChildData.message || 'Failed to add child profile.');
        }
      } else if (currentParent) {
        const foundChild = currentParent.children.find((c) => c.id === selectedChildId);
        finalChildName = foundChild?.name || 'Child';
        finalChildGender = (foundChild?.gender as 'Boy' | 'Girl') || 'Boy';
      }

      // Register for Vaccination Program
      const payload = {
        childId: finalChildId,
        childName: finalChildName,
        childGender: finalChildGender,
        parentId: currentParent?.id,
        parentName: currentParent?.name,
        parentMobile: currentParent?.mobile,
        firstVaccineDate,
        firstMilestoneId,
        administeredFirstDoseToday,
        batchNumber,
        branchId,
        registeredBy: 'Reception Desk',
        paymentAmount,
        paymentReceiptNo,
        notes,
      };

      const res = await fetch('/api/vaccinations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to register vaccination program.');
      }

      onSuccess(data.program);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while registering.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Register Child for Vaccines
              </h2>
              <p className="text-xs text-slate-500">
                IAP 2018 Immunization Program • Hospital Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Section 1: Parent & Child */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-teal-600" />
              1. Parent & Child Details
            </h3>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Select Registered Parent *
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => {
                  setSelectedParentId(e.target.value);
                  const p = parents.find((item) => item.id === e.target.value);
                  if (p && p.children.length > 0) {
                    setSelectedChildId(p.children[0].id);
                    setIsNewChild(false);
                  } else {
                    setSelectedChildId('');
                    setIsNewChild(true);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Choose Parent --</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mobile}) • {p.children?.length || 0} child(ren)
                  </option>
                ))}
              </select>
            </div>

            {currentParent && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-semibold">Select Child *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewChild(!isNewChild)}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    {isNewChild ? 'Select Existing Child' : '+ Register New Child'}
                  </button>
                </div>

                {!isNewChild && currentParent.children && currentParent.children.length > 0 ? (
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {currentParent.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gender || 'Child'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <input
                        type="text"
                        placeholder="Child Full Name"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required={isNewChild}
                      />
                    </div>
                    <div>
                      <select
                        value={newChildGender}
                        onChange={(e) => setNewChildGender(e.target.value as 'Boy' | 'Girl')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Payment Confirmation */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <h3 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              2. Fee & Payment Confirmation
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="payment-confirmed-check"
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label
                htmlFor="payment-confirmed-check"
                className="font-bold text-slate-800 cursor-pointer"
              >
                Payment Received for Vaccination Program (Receipt Issued) *
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Registration Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Receipt / Invoice No.
                </label>
                <input
                  type="text"
                  value={paymentReceiptNo}
                  onChange={(e) => setPaymentReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: First Vaccine Given (Anchor Date) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-teal-900 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                3. Date of First Vaccine Given (Anchor Calculation)
              </h3>
            </div>

            <p className="text-[11px] text-teal-800 bg-white/70 p-2 rounded-xl border border-teal-200/50">
              💡 <strong>Hospital Clinical Rule:</strong> All subsequent vaccine milestone intervals (6w, 10w, 14w, 6m, etc.) are computed starting from this first vaccine date.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  First Vaccine Given Date *
                </label>
                <input
                  type="date"
                  value={firstVaccineDate}
                  onChange={(e) => setFirstVaccineDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Milestone Administered *
                </label>
                <select
                  value={firstMilestoneId}
                  onChange={(e) => setFirstMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="birth">At Birth (BCG, OPV 0, Hep B 1)</option>
                  <option value="6-weeks">6 Weeks (Pentavalent 1, IPV 1, Rota 1, PCV 1)</option>
                  <option value="10-weeks">10 Weeks (Pentavalent 2, IPV 2, Rota 2, PCV 2)</option>
                  <option value="14-weeks">14 Weeks (Pentavalent 3, IPV 3, Rota 3, PCV 3)</option>
                  <option value="6-months">6 Months (Typhoid Conjugate, Flu 1)</option>
                  <option value="9-months">9 Months (MR 1 / MMR 1, OPV 1)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="administered-today-check"
                checked={administeredFirstDoseToday}
                onChange={(e) => setAdministeredFirstDoseToday(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label
                htmlFor="administered-today-check"
                className="text-slate-700 font-medium cursor-pointer"
              >
                Mark this first dose as administered today at hospital
              </label>
            </div>

            {administeredFirstDoseToday && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Vaccine Batch Number
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Administering Branch
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value as BranchId)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kakinada">Kakinada Branch</option>
                    <option value="pithapuram">Pithapuram Branch</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Registering...' : 'Complete Vaccine Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
