import React, { useState, useMemo } from 'react';
import { PediatricGrowthRecord } from '../types/index.js';
import { TrendingUp, Activity, Info, ShieldCheck, Scale } from 'lucide-react';

interface PediatricGrowthChartProps {
  growthRecords?: PediatricGrowthRecord[];
  currentHeight?: string | number;
  currentWeight?: string | number;
  childAgeYears?: number;
  childGender?: 'Boy' | 'Girl' | string;
  childName?: string;
}

// WHO / IAP Reference Medians and Percentiles for Ages 0 to 18
const WHO_PEDIATRIC_STANDARDS: Record<number, {
  bmi: { p5: number; p50: number; p85: number; p95: number };
  heightCm: { p3: number; p50: number; p97: number };
  weightKg: { p3: number; p50: number; p97: number };
}> = {
  0: { bmi: { p5: 12.2, p50: 13.4, p85: 14.8, p95: 15.8 }, heightCm: { p3: 47.0, p50: 50.0, p97: 53.0 }, weightKg: { p3: 2.5, p50: 3.3, p97: 4.2 } },
  1: { bmi: { p5: 14.8, p50: 16.5, p85: 18.2, p95: 19.4 }, heightCm: { p3: 71.0, p50: 75.7, p97: 80.5 }, weightKg: { p3: 7.7, p50: 9.6, p97: 12.0 } },
  2: { bmi: { p5: 14.3, p50: 15.9, p85: 17.5, p95: 18.6 }, heightCm: { p3: 81.0, p50: 86.8, p97: 92.5 }, weightKg: { p3: 9.7, p50: 12.2, p97: 15.3 } },
  3: { bmi: { p5: 14.0, p50: 15.4, p85: 17.0, p95: 18.2 }, heightCm: { p3: 88.0, p50: 95.2, p97: 102.5 }, weightKg: { p3: 11.3, p50: 14.3, p97: 18.3 } },
  4: { bmi: { p5: 13.8, p50: 15.2, p85: 16.8, p95: 18.0 }, heightCm: { p3: 95.0, p50: 102.3, p97: 110.0 }, weightKg: { p3: 12.7, p50: 16.3, p97: 21.5 } },
  5: { bmi: { p5: 13.6, p50: 15.1, p85: 16.9, p95: 18.3 }, heightCm: { p3: 101.0, p50: 109.2, p97: 117.5 }, weightKg: { p3: 14.1, p50: 18.3, p97: 24.9 } },
  6: { bmi: { p5: 13.5, p50: 15.2, p85: 17.3, p95: 19.0 }, heightCm: { p3: 106.0, p50: 115.5, p97: 124.5 }, weightKg: { p3: 15.9, p50: 20.5, p97: 28.5 } },
  7: { bmi: { p5: 13.5, p50: 15.5, p85: 17.8, p95: 20.0 }, heightCm: { p3: 112.0, p50: 121.7, p97: 131.0 }, weightKg: { p3: 17.7, p50: 22.9, p97: 32.5 } },
  8: { bmi: { p5: 13.6, p50: 15.8, p85: 18.5, p95: 21.0 }, heightCm: { p3: 117.0, p50: 127.3, p97: 137.5 }, weightKg: { p3: 19.5, p50: 25.4, p97: 37.0 } },
  9: { bmi: { p5: 13.8, p50: 16.2, p85: 19.2, p95: 22.2 }, heightCm: { p3: 122.0, p50: 132.6, p97: 143.5 }, weightKg: { p3: 21.5, p50: 28.1, p97: 42.0 } },
  10: { bmi: { p5: 14.0, p50: 16.6, p85: 20.0, p95: 23.5 }, heightCm: { p3: 126.0, p50: 137.8, p97: 149.5 }, weightKg: { p3: 23.5, p50: 31.2, p97: 47.5 } },
  11: { bmi: { p5: 14.3, p50: 17.1, p85: 20.8, p95: 24.6 }, heightCm: { p3: 131.0, p50: 143.5, p97: 155.0 }, weightKg: { p3: 26.0, p50: 35.5, p97: 53.0 } },
  12: { bmi: { p5: 14.7, p50: 17.7, p85: 21.7, p95: 25.8 }, heightCm: { p3: 136.0, p50: 149.0, p97: 161.0 }, weightKg: { p3: 29.0, p50: 40.0, p97: 59.0 } },
  13: { bmi: { p5: 15.2, p50: 18.4, p85: 22.7, p95: 27.0 }, heightCm: { p3: 142.0, p50: 155.0, p97: 167.0 }, weightKg: { p3: 33.0, p50: 45.5, p97: 66.0 } },
  14: { bmi: { p5: 15.8, p50: 19.1, p85: 23.6, p95: 28.0 }, heightCm: { p3: 148.0, p50: 161.0, p97: 173.0 }, weightKg: { p3: 38.0, p50: 51.0, p97: 72.0 } },
  15: { bmi: { p5: 16.4, p50: 19.8, p85: 24.4, p95: 28.8 }, heightCm: { p3: 153.0, p50: 166.0, p97: 178.0 }, weightKg: { p3: 43.0, p50: 56.5, p97: 77.0 } },
  16: { bmi: { p5: 17.0, p50: 20.5, p85: 25.2, p95: 29.5 }, heightCm: { p3: 156.0, p50: 170.0, p97: 181.0 }, weightKg: { p3: 47.0, p50: 61.0, p97: 82.0 } },
  17: { bmi: { p5: 17.5, p50: 21.0, p85: 25.8, p95: 30.0 }, heightCm: { p3: 158.0, p50: 172.0, p97: 183.0 }, weightKg: { p3: 50.0, p50: 64.5, p97: 86.0 } },
  18: { bmi: { p5: 18.0, p50: 21.5, p85: 26.3, p95: 30.5 }, heightCm: { p3: 159.0, p50: 174.0, p97: 185.0 }, weightKg: { p3: 52.0, p50: 67.0, p97: 88.0 } },
};

export const PediatricGrowthChart: React.FC<PediatricGrowthChartProps> = ({
  growthRecords = [],
  currentHeight,
  currentWeight,
  childAgeYears,
  childGender = 'Boy',
  childName = 'Child',
}) => {
  const [activeMetric, setActiveMetric] = useState<'bmi' | 'height' | 'weight'>('bmi');

  // Compute current live BMI from doctor's active consultation inputs
  const currentHeightNum = Number(currentHeight) || 0;
  const currentWeightNum = Number(currentWeight) || 0;

  const currentBmi = useMemo(() => {
    if (currentHeightNum > 0 && currentWeightNum > 0) {
      const hM = currentHeightNum / 100;
      return Number((currentWeightNum / (hM * hM)).toFixed(1));
    }
    return null;
  }, [currentHeightNum, currentWeightNum]);

  const hasValidAge = typeof childAgeYears === 'number' && !isNaN(childAgeYears) && childAgeYears >= 0;

  // Determine age reference bracket (supported WHO / IAP ages 0 to 18)
  const ageRefBracket = hasValidAge ? Math.min(Math.max(Math.round(childAgeYears), 0), 18) : 3;
  const standards = WHO_PEDIATRIC_STANDARDS[ageRefBracket] || WHO_PEDIATRIC_STANDARDS[3];

  // Clinical category classification based on WHO / IAP guidelines
  const clinicalCategory = useMemo(() => {
    const val = currentBmi || (growthRecords.length > 0 ? growthRecords[0].pediatricBmi : null);
    if (!val) return { label: 'Awaiting Vitals', color: 'bg-slate-100 text-slate-600 border-slate-300', note: 'Enter height and weight to calculate pediatric growth status' };

    if (!hasValidAge) {
      return {
        label: 'Age Not Recorded',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        note: 'Child age or date of birth is required to calculate growth percentile and clinical category.',
      };
    }
    
    if (val < standards.bmi.p5) {
      return {
        label: 'Underweight (< 5th percentile)',
        color: 'bg-amber-50 text-amber-800 border-amber-300',
        note: 'Weight is below expected percentile. Assess calorie intake and developmental milestones.',
      };
    }
    if (val <= standards.bmi.p85) {
      return {
        label: 'Healthy Normal (5th - 85th percentile)',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        note: 'Growth trajectory aligns with WHO healthy pediatric development standards.',
      };
    }
    if (val <= standards.bmi.p95) {
      return {
        label: 'Overweight (85th - 95th percentile)',
        color: 'bg-amber-100 text-amber-900 border-amber-400',
        note: 'Above 85th percentile. Recommend physical play and balanced pediatric nutrition.',
      };
    }
    return {
      label: 'Obese (≥ 95th percentile)',
      color: 'bg-rose-50 text-rose-800 border-rose-300',
      note: 'High BMI percentile. Monitor endocrine factors and family lifestyle habits.',
    };
  }, [currentBmi, growthRecords, standards, hasValidAge]);

  // SVG Chart Dimensions
  const svgWidth = 380;
  const svgHeight = 160;
  const padLeft = 42;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 26;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Metric range setups
  const metricConfig = useMemo(() => {
    if (activeMetric === 'bmi') {
      const minVal = 12;
      const maxVal = 24;
      return {
        unit: 'kg/m²',
        minVal,
        maxVal,
        label: 'BMI (kg/m²)',
        p5: standards.bmi.p5,
        p50: standards.bmi.p50,
        p85: standards.bmi.p85,
        p95: standards.bmi.p95,
        getY: (v: number) => padTop + chartH - ((Math.min(Math.max(v, minVal), maxVal) - minVal) / (maxVal - minVal)) * chartH,
      };
    } else if (activeMetric === 'height') {
      const minVal = standards.heightCm.p3 - 10;
      const maxVal = standards.heightCm.p97 + 10;
      return {
        unit: 'cm',
        minVal,
        maxVal,
        label: 'Height (cm)',
        p5: standards.heightCm.p3,
        p50: standards.heightCm.p50,
        p85: standards.heightCm.p97,
        p95: standards.heightCm.p97 + 5,
        getY: (v: number) => padTop + chartH - ((Math.min(Math.max(v, minVal), maxVal) - minVal) / (maxVal - minVal)) * chartH,
      };
    } else {
      const minVal = Math.max(standards.weightKg.p3 - 3, 4);
      const maxVal = standards.weightKg.p97 + 6;
      return {
        unit: 'kg',
        minVal,
        maxVal,
        label: 'Weight (kg)',
        p5: standards.weightKg.p3,
        p50: standards.weightKg.p50,
        p85: standards.weightKg.p97,
        p95: standards.weightKg.p97 + 4,
        getY: (v: number) => padTop + chartH - ((Math.min(Math.max(v, minVal), maxVal) - minVal) / (maxVal - minVal)) * chartH,
      };
    }
  }, [activeMetric, standards, chartH]);

  // Merge historical points with current live consultation vitals
  const plotPoints = useMemo(() => {
    const pts: { label: string; value: number; isCurrent?: boolean }[] = [];

    // Historical records (up to 4 past records in chronological order)
    const reversed = [...growthRecords].reverse().slice(-4);
    reversed.forEach((r, idx) => {
      let v = r.pediatricBmi;
      if (activeMetric === 'height') v = r.heightCm;
      if (activeMetric === 'weight') v = r.weightKg;
      pts.push({
        label: r.recordedDate.slice(5), // MM-DD
        value: v,
        isCurrent: false,
      });
    });

    // If currently entered vitals exist, append as latest point
    let liveVal: number | null = null;
    if (activeMetric === 'bmi' && currentBmi) liveVal = currentBmi;
    if (activeMetric === 'height' && currentHeightNum > 0) liveVal = currentHeightNum;
    if (activeMetric === 'weight' && currentWeightNum > 0) liveVal = currentWeightNum;

    if (liveVal !== null) {
      pts.push({
        label: 'Today',
        value: liveVal,
        isCurrent: true,
      });
    }

    return pts;
  }, [growthRecords, currentBmi, currentHeightNum, currentWeightNum, activeMetric]);

  // Calculate coordinates
  const calculatedPoints = useMemo(() => {
    if (plotPoints.length === 0) return [];
    const count = Math.max(plotPoints.length, 2);
    return plotPoints.map((pt, idx) => {
      const x = padLeft + (idx / (count - 1)) * chartW;
      const y = metricConfig.getY(pt.value);
      return { ...pt, x, y };
    });
  }, [plotPoints, chartW, metricConfig]);

  // Construct SVG Polyline path string
  const linePath = useMemo(() => {
    if (calculatedPoints.length < 2) return '';
    return calculatedPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
  }, [calculatedPoints]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-3">
      {/* Header & Metric Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <span>Pediatric Growth Trajectory</span>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-bold border border-teal-200">
                WHO / IAP
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Age: {hasValidAge ? `${childAgeYears}y` : 'Not recorded'} ({childGender}) • Standard Percentile Bands
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveMetric('bmi')}
            className={`px-2 py-1 rounded-md transition ${
              activeMetric === 'bmi'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BMI
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('height')}
            className={`px-2 py-1 rounded-md transition ${
              activeMetric === 'height'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Height
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('weight')}
            className={`px-2 py-1 rounded-md transition ${
              activeMetric === 'weight'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weight
          </button>
        </div>
      </div>

      {/* Real-time Status Banner */}
      <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${clinicalCategory.color}`}>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">{clinicalCategory.label}</span>
        </div>
        {currentBmi && (
          <span className="font-mono font-black text-xs">
            {currentBmi} kg/m²
          </span>
        )}
      </div>

      {/* SVG Chart Graphic */}
      <div className="relative bg-slate-50/70 rounded-xl p-1 border border-slate-100 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-36 select-none"
        >
          {/* Shaded WHO Percentile Zones */}
          {activeMetric === 'bmi' && (
            <>
              {/* Healthy Normal Green Zone (P5 to P85) */}
              <rect
                x={padLeft}
                y={metricConfig.getY(standards.bmi.p85)}
                width={chartW}
                height={metricConfig.getY(standards.bmi.p5) - metricConfig.getY(standards.bmi.p85)}
                fill="#10b981"
                fillOpacity="0.12"
              />
              {/* Overweight Zone (P85 to P95) */}
              <rect
                x={padLeft}
                y={metricConfig.getY(standards.bmi.p95)}
                width={chartW}
                height={metricConfig.getY(standards.bmi.p85) - metricConfig.getY(standards.bmi.p95)}
                fill="#f59e0b"
                fillOpacity="0.10"
              />
              {/* Obese Zone (> P95) */}
              <rect
                x={padLeft}
                y={padTop}
                width={chartW}
                height={metricConfig.getY(standards.bmi.p95) - padTop}
                fill="#f43f5e"
                fillOpacity="0.08"
              />
            </>
          )}

          {/* Reference Lines */}
          <line
            x1={padLeft}
            y1={metricConfig.getY(metricConfig.p50)}
            x2={svgWidth - padRight}
            y2={metricConfig.getY(metricConfig.p50)}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={svgWidth - padRight - 2}
            y={metricConfig.getY(metricConfig.p50) - 3}
            textAnchor="end"
            fontSize="9"
            fontWeight="bold"
            fill="#059669"
          >
            WHO 50th %ile ({metricConfig.p50} {metricConfig.unit})
          </text>

          {/* Grid lines and Y-axis scale */}
          {[metricConfig.minVal, metricConfig.p50, metricConfig.maxVal].map((val, i) => {
            const y = metricConfig.getY(val);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Patient Historical Trajectory Line */}
          {linePath && (
            <polyline
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePath}
            />
          )}

          {/* Plotted Points */}
          {calculatedPoints.map((pt, idx) => (
            <g key={idx}>
              {pt.isCurrent ? (
                <>
                  {/* Pulsing ring for today's active measurement */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="#0d9488"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#0f766e"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill="#0f766e"
                  >
                    {pt.value}
                  </text>
                </>
              ) : (
                <>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 6}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#475569"
                    fontWeight="600"
                  >
                    {pt.value}
                  </text>
                </>
              )}

              {/* X Axis Date Labels */}
              <text
                x={pt.x}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="9"
                fill={pt.isCurrent ? '#0f766e' : '#64748b'}
                fontWeight={pt.isCurrent ? '800' : '500'}
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Clinical Guidance Footnote */}
      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span>{clinicalCategory.note}</span>
        </div>
      </div>
    </div>
  );
};
