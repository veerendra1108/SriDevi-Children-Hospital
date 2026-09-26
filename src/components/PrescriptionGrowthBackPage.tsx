import React from 'react';
import { Award, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle2, Heart, Apple, Sparkles } from 'lucide-react';

interface PrescriptionGrowthBackPageProps {
  childName?: string;
  childAge?: number;
  childAgeMonths?: number;
  childGender?: string;
  heightCm?: number;
  weightKg?: number;
  pediatricBmi?: number;
  prescriptionNumber?: string;
  doctorName?: string;
  date?: string;
}

// WHO & IAP Standards for Infants (0 to 12 months)
export const INFANT_GROWTH_STANDARDS = [
  { ageLabel: 'Birth (0 Months)', ageMonths: 0, weightMin: 2.5, weightMax: 4.3, weightMed: 3.3, heightMin: 46.0, heightMax: 54.0, heightMed: 50.0, advice: 'Exclusive Breastfeeding on demand (8-12 times/day)' },
  { ageLabel: '1 Month', ageMonths: 1, weightMin: 3.4, weightMax: 5.7, weightMed: 4.5, heightMin: 51.0, heightMax: 58.0, heightMed: 54.7, advice: 'Exclusive Breastfeeding, Vitamin D drops 400 IU' },
  { ageLabel: '2 Months', ageMonths: 2, weightMin: 4.4, weightMax: 7.0, weightMed: 5.6, heightMin: 54.0, heightMax: 62.0, heightMed: 58.4, advice: 'Social smile, primary vaccinations due' },
  { ageLabel: '3 Months', ageMonths: 3, weightMin: 5.1, weightMax: 7.9, weightMed: 6.4, heightMin: 57.0, heightMax: 65.0, heightMed: 61.4, advice: 'Head holding steady, continuing exclusive breast milk' },
  { ageLabel: '4 Months', ageMonths: 4, weightMin: 5.6, weightMax: 8.6, weightMed: 7.0, heightMin: 60.0, heightMax: 68.0, heightMed: 63.9, advice: 'Tummy time, rolling over, visual tracking' },
  { ageLabel: '6 Months', ageMonths: 6, weightMin: 6.4, weightMax: 9.7, weightMed: 7.9, heightMin: 63.0, heightMax: 72.0, heightMed: 67.6, advice: 'Start complementary feeding: Ragi porridge, mashed dal/rice' },
  { ageLabel: '9 Months', ageMonths: 9, weightMin: 7.2, weightMax: 10.9, weightMed: 8.9, heightMin: 67.0, heightMax: 76.0, heightMed: 72.0, advice: 'Sitting without support, mashed fruits, 3 small meals/day' },
  { ageLabel: '12 Months (1 Year)', ageMonths: 12, weightMin: 7.8, weightMax: 11.8, weightMed: 9.6, heightMin: 71.0, heightMax: 81.0, heightMed: 75.7, advice: 'Standing, soft family food, 3 meals + 2 healthy snacks' },
];

// WHO & IAP Standards for Children (2 to 10 years)
export const CHILD_GROWTH_STANDARDS = [
  { ageYears: 2, weightMin: 10.0, weightMax: 15.3, weightMed: 12.2, heightMin: 81.0, heightMax: 92.5, heightMed: 86.8, bmiMin: 14.3, bmiMax: 18.6, advice: 'Active toddler: 3 family meals, milk, boiled eggs/dal' },
  { ageYears: 3, weightMin: 11.3, weightMax: 18.3, weightMed: 14.3, heightMin: 88.0, heightMax: 102.5, heightMed: 95.2, bmiMin: 14.0, bmiMax: 18.2, advice: 'Outdoor active play, green leafy vegetables, curd/paneer' },
  { ageYears: 4, weightMin: 12.7, weightMax: 21.5, weightMed: 16.3, heightMin: 95.0, heightMax: 110.0, heightMed: 102.3, bmiMin: 13.8, bmiMax: 18.0, advice: 'Hand washing, healthy snacking: fruits, nuts, avoid candy' },
  { ageYears: 5, weightMin: 14.1, weightMax: 24.9, weightMed: 18.3, heightMin: 101.0, heightMax: 117.5, heightMed: 109.2, bmiMin: 13.6, bmiMax: 18.3, advice: 'School entry: Balanced diet, 2 glasses milk, morning sun' },
  { ageYears: 6, weightMin: 15.9, weightMax: 28.5, weightMed: 20.5, heightMin: 106.0, heightMax: 124.5, heightMed: 115.5, bmiMin: 13.5, bmiMax: 19.0, advice: 'Calcium & Protein: Ragi, eggs, sprouts, active playground running' },
  { ageYears: 7, weightMin: 17.7, weightMax: 32.5, weightMed: 22.9, heightMin: 112.0, heightMax: 131.0, heightMed: 121.7, bmiMin: 13.5, bmiMax: 20.0, advice: 'Bone density growth: Swimming/sports, adequate hydration' },
  { ageYears: 8, weightMin: 19.5, weightMax: 37.0, weightMed: 25.4, heightMin: 117.0, heightMax: 137.5, heightMed: 127.3, bmiMin: 13.6, bmiMax: 21.0, advice: 'Regular sports, strict limit on mobile/TV screen time' },
  { ageYears: 9, weightMin: 21.5, weightMax: 42.0, weightMed: 28.1, heightMin: 122.0, heightMax: 143.5, heightMed: 132.6, bmiMin: 13.8, bmiMax: 22.2, advice: 'Pre-pubertal spurt: Iron, calcium, home-cooked whole grains' },
  { ageYears: 10, weightMin: 23.5, weightMax: 47.5, weightMed: 31.2, heightMin: 126.0, heightMax: 149.5, heightMed: 137.8, bmiMin: 14.0, bmiMax: 23.5, advice: 'Pubertal development prep: Balanced nutrition, 9h sleep' },
];

export const PrescriptionGrowthBackPage: React.FC<PrescriptionGrowthBackPageProps> = ({
  childName = 'Patient',
  childAge,
  childAgeMonths,
  childGender = 'Child',
  heightCm,
  weightKg,
  pediatricBmi,
  prescriptionNumber = 'RX-SDCH',
  doctorName = 'Pediatrician',
  date,
}) => {
  // Determine benchmark targets for the child based on their exact age
  const ageInYears = childAge !== undefined && childAge !== null ? Number(childAge) : undefined;
  const isInfant = ageInYears === 0 || (ageInYears === undefined && childAgeMonths !== undefined);

  let targetWeightMin = 10.0;
  let targetWeightMax = 16.0;
  let targetHeightMin = 85.0;
  let targetHeightMax = 100.0;
  let targetBmiMin = 14.0;
  let targetBmiMax = 18.0;

  if (isInfant) {
    const mo = childAgeMonths || 6;
    // Find closest infant benchmark
    const matchedInfant =
      INFANT_GROWTH_STANDARDS.find((s) => s.ageMonths >= mo) ||
      INFANT_GROWTH_STANDARDS[INFANT_GROWTH_STANDARDS.length - 1];
    targetWeightMin = matchedInfant.weightMin;
    targetWeightMax = matchedInfant.weightMax;
    targetHeightMin = matchedInfant.heightMin;
    targetHeightMax = matchedInfant.heightMax;
    targetBmiMin = 13.0;
    targetBmiMax = 17.5;
  } else if (ageInYears !== undefined) {
    const matchedChild =
      CHILD_GROWTH_STANDARDS.find((s) => s.ageYears === ageInYears) ||
      CHILD_GROWTH_STANDARDS.find((s) => s.ageYears === Math.min(10, Math.max(2, ageInYears))) ||
      CHILD_GROWTH_STANDARDS[1]; // default 3y
    targetWeightMin = matchedChild.weightMin;
    targetWeightMax = matchedChild.weightMax;
    targetHeightMin = matchedChild.heightMin;
    targetHeightMax = matchedChild.heightMax;
    targetBmiMin = matchedChild.bmiMin;
    targetBmiMax = matchedChild.bmiMax;
  }

  // Current values
  const currentW = weightKg ? Number(weightKg) : null;
  const currentH = heightCm ? Number(heightCm) : null;
  const currentB = pediatricBmi
    ? Number(pediatricBmi)
    : currentH && currentW
    ? Number((currentW / Math.pow(currentH / 100, 2)).toFixed(1))
    : null;

  // Status & Telugu Interpretations
  const getWeightStatus = () => {
    if (!currentW) return { status: 'Not Recorded', statusTe: 'నమోదు కాలేదు', type: 'neutral', improve: false };
    if (currentW < targetWeightMin) {
      return {
        status: 'Weight is less (Underweight)',
        statusTe: 'బరువు తక్కువగా ఉంది',
        type: 'warning',
        improve: true,
        gap: `Needs +${(targetWeightMin - currentW).toFixed(1)} kg gain`,
      };
    }
    if (currentW > targetWeightMax) {
      return {
        status: 'Weight is above range (Overweight)',
        statusTe: 'అధిక బరువుగా ఉంది',
        type: 'warning',
        improve: true,
        gap: `Above recommended range`,
      };
    }
    return {
      status: 'Weight is normal',
      statusTe: 'బరువు సరైనదిగా ఉంది',
      type: 'success',
      improve: false,
      gap: 'Normal range',
    };
  };

  const getHeightStatus = () => {
    if (!currentH) return { status: 'Not Recorded', statusTe: 'నమోదు కాలేదు', type: 'neutral', improve: false };
    if (currentH < targetHeightMin) {
      return {
        status: 'Height is less',
        statusTe: 'ఎత్తు తక్కువగా ఉంది',
        type: 'warning',
        improve: true,
        gap: `Needs +${(targetHeightMin - currentH).toFixed(1)} cm growth`,
      };
    }
    if (currentH > targetHeightMax) {
      return {
        status: 'Tall for age',
        statusTe: 'వయస్సుకు మించిన ఎత్తు',
        type: 'success',
        improve: false,
        gap: 'Above average height',
      };
    }
    return {
      status: 'Height is normal',
      statusTe: 'ఎత్తు సరిగ్గా ఉంది',
      type: 'success',
      improve: false,
      gap: 'Normal range',
    };
  };

  const getBmiStatus = () => {
    if (!currentB) return { status: 'Not Recorded', statusTe: 'నమోదు కాలేదు', type: 'neutral', improve: false };
    if (currentB < targetBmiMin) {
      return {
        status: 'BMI is low (Under-nourished)',
        statusTe: 'పోషకాహారం అవసరం',
        type: 'warning',
        improve: true,
      };
    }
    if (currentB > targetBmiMax) {
      return {
        status: 'BMI is high',
        statusTe: 'అధిక శరీర ద్రవ్యరాశి',
        type: 'warning',
        improve: true,
      };
    }
    return {
      status: 'BMI is healthy',
      statusTe: 'శరీర బరువు సమతుల్యంగా ఉంది',
      type: 'success',
      improve: false,
    };
  };

  const weightEval = getWeightStatus();
  const heightEval = getHeightStatus();
  const bmiEval = getBmiStatus();

  return (
    <div className="prescription-back-page bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-800 font-sans">
      {/* Header for Back Page */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-teal-600 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-base leading-tight">
              Sri Devi Children Hospital • Pediatric Growth &amp; Nutrition Guide
            </h2>
            <div className="text-xs text-teal-800 font-medium">
              పిల్లల శారీరక ఎదుగుదల &amp; పోషకాహార మార్గదర్శిని (Back of Prescription)
            </div>
          </div>
        </div>
        <div className="text-right text-[11px]">
          <div className="font-bold text-slate-700">Prescription #{prescriptionNumber}</div>
          <div className="text-slate-500">
            {childName} ({ageInYears !== undefined ? `${ageInYears}y` : isInfant ? `${childAgeMonths || 0}m` : 'Age pending'} • {childGender})
          </div>
        </div>
      </div>

      {/* SECTION 1: CHILD'S SPECIFIC GROWTH EVALUATION TABLE (Matching User Diagram) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Child&apos;s Growth Assessment / ప్రస్తుత ఎదుగుదల విశ్లేషణ</span>
          </h3>
          <span className="text-[11px] text-slate-500 italic">
            Calculated for Age: {ageInYears !== undefined ? `${ageInYears} Years` : isInfant ? `${childAgeMonths || 0} Months` : 'Child'}
          </span>
        </div>

        <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-teal-50 border-b-2 border-slate-300 text-slate-800">
                <th className="p-2.5 font-bold border-r border-slate-300 w-1/4">
                  Growth Metric<br />
                  <span className="text-[10px] font-medium text-slate-500">ఎదుగుదల సూచిక</span>
                </th>
                <th className="p-2.5 font-bold border-r border-slate-300 w-1/4 bg-sky-50/70">
                  Current / prastutam unnadi<br />
                  <span className="text-[10px] font-semibold text-sky-800">ప్రస్తుతము ఉన్నది</span>
                </th>
                <th className="p-2.5 font-bold border-r border-slate-300 w-1/4 bg-amber-50/70">
                  Estimate / undavalsindi<br />
                  <span className="text-[10px] font-semibold text-amber-800">ఉండవలసిన పరిధి (WHO)</span>
                </th>
                <th className="p-2.5 font-bold w-1/4">
                  Status &amp; Guidance<br />
                  <span className="text-[10px] font-medium text-slate-500">పరిస్థితి &amp; పరిశీలన</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Weight */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                  Weight (బరువు)
                </td>
                <td className="p-2.5 font-black text-slate-900 text-sm border-r border-slate-200 bg-sky-50/30">
                  {currentW ? `${currentW} kg` : '—'}
                </td>
                <td className="p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-amber-50/30">
                  {targetWeightMin.toFixed(1)} kg – {targetWeightMax.toFixed(1)} kg
                </td>
                <td className="p-2.5">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-xs ${
                      weightEval.type === 'warning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : weightEval.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {weightEval.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : weightEval.type === 'warning' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    ) : null}
                    <span>{weightEval.status}</span>
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{weightEval.statusTe}</div>
                </td>
              </tr>

              {/* Row 2: Height */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                  Height (ఎత్తు / పొడవు)
                </td>
                <td className="p-2.5 font-black text-slate-900 text-sm border-r border-slate-200 bg-sky-50/30">
                  {currentH ? `${currentH} cm` : '—'}
                </td>
                <td className="p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-amber-50/30">
                  {targetHeightMin.toFixed(1)} cm – {targetHeightMax.toFixed(1)} cm
                </td>
                <td className="p-2.5">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-xs ${
                      heightEval.type === 'warning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : heightEval.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {heightEval.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : heightEval.type === 'warning' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    ) : null}
                    <span>{heightEval.status}</span>
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{heightEval.statusTe}</div>
                </td>
              </tr>

              {/* Row 3: BMI */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                  BMI (ద్రవ్యరాశి సూచిక)
                </td>
                <td className="p-2.5 font-black text-slate-900 text-sm border-r border-slate-200 bg-sky-50/30">
                  {currentB ? `${currentB} kg/m²` : '—'}
                </td>
                <td className="p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-amber-50/30">
                  {targetBmiMin.toFixed(1)} – {targetBmiMax.toFixed(1)}
                </td>
                <td className="p-2.5">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-xs ${
                      bmiEval.type === 'warning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : bmiEval.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {bmiEval.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : bmiEval.type === 'warning' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    ) : null}
                    <span>{bmiEval.status}</span>
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{bmiEval.statusTe}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: WHERE YOUR KID MUST IMPROVE (Actionable Pediatric Advice) */}
      <div className="mb-5 p-3.5 bg-gradient-to-r from-teal-50/90 to-sky-50/90 border-2 border-teal-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-teal-700 shrink-0" />
          <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
            Where Your Kid Must Improve / మీ పాపాయి మెరుగుపడవలసిన అంశాలు &amp; వైద్య సలహా:
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-700">
          {/* Height improvement guidance */}
          <div className={`p-2.5 rounded-xl border ${heightEval.improve ? 'bg-amber-50/80 border-amber-300 text-amber-950' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-bold flex items-center justify-between mb-1">
              <span>📏 Height Improvement (ఎత్తు పెరగడానికి):</span>
              {heightEval.improve && <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">NEEDS ATTENTION</span>}
            </div>
            <ul className="space-y-0.5 pl-3 list-disc text-[10.5px]">
              <li><strong>Calcium &amp; Milk:</strong> 2 glasses (400-500 ml) of boiled milk, curd, or paneer daily.</li>
              <li><strong>Morning Sunshine (ఎండ):</strong> 20–30 minutes outdoor play before 9 AM for natural Vitamin D3.</li>
              <li><strong>Active Stretching:</strong> Hanging from monkey bar, skipping rope, swimming, or outdoor sports.</li>
              <li><strong>Protein Diet:</strong> Boiled egg white, sprouted green gram (పెసలు), dal, ragi porridge.</li>
            </ul>
          </div>

          {/* Weight & Nutrition guidance */}
          <div className={`p-2.5 rounded-xl border ${weightEval.improve ? 'bg-amber-50/80 border-amber-300 text-amber-950' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-bold flex items-center justify-between mb-1">
              <span>⚖️ Weight &amp; Energy (బరువు &amp; పోషకాహారం):</span>
              {weightEval.improve && <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">NEEDS ATTENTION</span>}
            </div>
            <ul className="space-y-0.5 pl-3 list-disc text-[10.5px]">
              {weightEval.status.includes('less') ? (
                <>
                  <li><strong>Healthy Weight Gain:</strong> Add 1 spoon pure cow ghee to warm rice/dal, ragi malt with milk.</li>
                  <li><strong>Nutritious Energy:</strong> Mashed bananas, boiled potatoes, peanut chikki, powdered nuts in porridge.</li>
                  <li><strong>Frequent Meals:</strong> 3 core meals + 2 healthy mid-meal snacks (avoid fluids 30m before eating).</li>
                </>
              ) : weightEval.status.includes('above') ? (
                <>
                  <li><strong>Avoid Junk:</strong> Strictly stop packaged chips, biscuits, sodas, chocolates, and bakery items.</li>
                  <li><strong>Active Daily Play:</strong> Minimum 60 minutes running, cycling, or football. Screen time &lt; 1 hour.</li>
                  <li><strong>Whole Foods:</strong> Fresh whole fruits instead of bottled juices; plenty of water and green veggies.</li>
                </>
              ) : (
                <>
                  <li><strong>Balanced Plate:</strong> 50% vegetables/fruits, 25% whole grains, 25% proteins (dal/eggs).</li>
                  <li><strong>Immunity &amp; Sleep:</strong> Ensure 9–10 hours restful night sleep and timely hydration.</li>
                  <li><strong>Growth Monitoring:</strong> Re-check height and weight every 3 to 6 months at pediatric OPD.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: STANDARD REFERENCE TABLES (0-12 Months and 2-10 Years) */}
      <div className="space-y-4">
        {/* Table A: 0 to 12 Months */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>A. Infant Growth Reference (0 – 12 Months) / శిశువుల ఎదుగుదల కొలతలు</span>
            </h4>
            <span className="text-[10px] text-slate-500">WHO &amp; Indian Academy of Pediatrics Standards</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-[10.5px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px]">
                  <th className="p-1.5 pl-2.5">Age (వయస్సు)</th>
                  <th className="p-1.5">Required Weight Range</th>
                  <th className="p-1.5">Required Length Range</th>
                  <th className="p-1.5">Key Feeding &amp; Development Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {INFANT_GROWTH_STANDARDS.map((s) => {
                  const isCurrentRow =
                    isInfant &&
                    (childAgeMonths === s.ageMonths ||
                      (childAgeMonths === undefined && s.ageMonths === 0 && ageInYears === 0));
                  return (
                    <tr
                      key={s.ageMonths}
                      className={isCurrentRow ? 'bg-amber-100/80 font-bold text-teal-950' : 'hover:bg-slate-50'}
                    >
                      <td className="p-1.5 pl-2.5 font-bold flex items-center gap-1">
                        {isCurrentRow && (
                          <span className="px-1 py-0.2 bg-teal-700 text-white rounded text-[8px] font-black uppercase">
                            Child
                          </span>
                        )}
                        <span>{s.ageLabel}</span>
                      </td>
                      <td className="p-1.5">
                        {s.weightMin} – {s.weightMax} kg <span className="text-[9px] text-slate-500 font-normal">(Med: {s.weightMed})</span>
                      </td>
                      <td className="p-1.5">
                        {s.heightMin} – {s.heightMax} cm <span className="text-[9px] text-slate-500 font-normal">(Med: {s.heightMed})</span>
                      </td>
                      <td className="p-1.5 text-slate-600 text-[10px]">{s.advice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table B: 2 to 10 Years */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>B. Child Growth Reference (2 – 10 Years) / పిల్లల శారీరక ఎదుగుదల ప్రమాణాలు</span>
            </h4>
            <span className="text-[10px] text-slate-500">WHO &amp; Indian Academy of Pediatrics Standards</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-[10.5px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px]">
                  <th className="p-1.5 pl-2.5">Age (వయస్సు)</th>
                  <th className="p-1.5">Required Weight Range</th>
                  <th className="p-1.5">Required Height Range</th>
                  <th className="p-1.5">Target BMI</th>
                  <th className="p-1.5">Nutritional &amp; Activity Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {CHILD_GROWTH_STANDARDS.map((s) => {
                  const isCurrentRow = ageInYears === s.ageYears;
                  return (
                    <tr
                      key={s.ageYears}
                      className={isCurrentRow ? 'bg-amber-100/80 font-bold text-teal-950' : 'hover:bg-slate-50'}
                    >
                      <td className="p-1.5 pl-2.5 font-bold flex items-center gap-1">
                        {isCurrentRow && (
                          <span className="px-1 py-0.2 bg-teal-700 text-white rounded text-[8px] font-black uppercase">
                            Child
                          </span>
                        )}
                        <span>{s.ageYears} Years</span>
                      </td>
                      <td className="p-1.5">
                        {s.weightMin} – {s.weightMax} kg <span className="text-[9px] text-slate-500 font-normal">({s.weightMed}kg)</span>
                      </td>
                      <td className="p-1.5">
                        {s.heightMin} – {s.heightMax} cm <span className="text-[9px] text-slate-500 font-normal">({s.heightMed}cm)</span>
                      </td>
                      <td className="p-1.5">
                        {s.bmiMin} – {s.bmiMax}
                      </td>
                      <td className="p-1.5 text-slate-600 text-[10px]">{s.advice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <div>
          Sri Devi Children Hospital • Dr. M. Subba Rao, M.D. (Pedi) • APMC Registered Pediatrician
        </div>
        <div>
          Consultation Helpline: <strong>+91 944 011 2233</strong> • Routine Growth Check-ups Every 6 Months
        </div>
      </div>
    </div>
  );
};
