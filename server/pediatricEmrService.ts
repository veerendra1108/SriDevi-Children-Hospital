import {
  Child,
  ChildAllergy,
  ChildCondition,
  PediatricGrowthRecord,
  PrescriptionItem,
  Prescription,
  Encounter,
  MedicineForm,
  DoseFrequency,
  MealTiming,
  ClinicalAuditLog,
} from '../src/types/index.js';
import { db } from './db.js';

// Deterministic Telugu and English translations for pediatric prescriptions
export const FREQUENCY_TRANSLATIONS: Record<
  DoseFrequency,
  { en: string; te: string; timeSlots: ('Morning' | 'Afternoon' | 'Night')[] }
> = {
  ONCE_DAILY: {
    en: 'Once daily',
    te: 'రోజుకు ఒకసారి',
    timeSlots: ['Morning'],
  },
  TWICE_DAILY: {
    en: 'Twice daily (Morning & Night)',
    te: 'రోజుకు రెండుసార్లు (ఉదయం మరియు రాత్రి)',
    timeSlots: ['Morning', 'Night'],
  },
  THRICE_DAILY: {
    en: 'Thrice daily (Morning, Afternoon & Night)',
    te: 'రోజుకు మూడుసార్లు (ఉదయం, మధ్యాహ్నం, రాత్రి)',
    timeSlots: ['Morning', 'Afternoon', 'Night'],
  },
  FOUR_TIMES_DAILY: {
    en: 'Four times daily (Every 6 hours)',
    te: 'రోజుకు నాలుగుసార్లు (ప్రతి 6 గంటలకు)',
    timeSlots: ['Morning', 'Afternoon', 'Night'],
  },
  SOS: {
    en: 'Only when needed (for fever or pain)',
    te: 'అవసరమైనప్పుడు మాత్రమే (జ్వరం లేదా నొప్పి ఉన్నప్పుడు)',
    timeSlots: [],
  },
};

export const TIMING_TRANSLATIONS: Record<MealTiming, { en: string; te: string }> = {
  AFTER_FOOD: {
    en: 'After food / milk',
    te: 'ఆహారం లేదా పాలు తాగిన తర్వాత',
  },
  BEFORE_FOOD: {
    en: 'Before food',
    te: 'ఆహారానికి ముందు',
  },
  WITH_FOOD: {
    en: 'With food',
    te: 'ఆహారంతో పాటు',
  },
  AT_BEDTIME: {
    en: 'At bedtime',
    te: 'పడుకునే ముందు రాత్రి',
  },
  EMPTY_STOMACH: {
    en: 'On empty stomach',
    te: 'ఖాళీ కడుపుతో',
  },
};

export const FORM_TRANSLATIONS: Record<MedicineForm, { en: string; te: string }> = {
  SYRUP: { en: 'Syrup', te: 'సిరప్' },
  DROPS: { en: 'Drops', te: 'చుక్కల మందు' },
  TABLET: { en: 'Tablet', te: 'మాత్ర' },
  INHALER: { en: 'Inhaler / Puffs', te: 'ఇన్హేలర్' },
  INJECTION: { en: 'Injection', te: 'ఇంజెక్షన్' },
  CREAM: { en: 'Ointment / Cream', te: 'పూత మందు' },
};

export interface GrowthStandards {
  bmi: { p5: number; p50: number; p85: number; p95: number };
  heightCm: { p3: number; p50: number; p97: number };
  weightKg: { p3: number; p50: number; p97: number };
}

export const WHO_IAP_PEDIATRIC_STANDARDS: Record<number, GrowthStandards> = {
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

/**
 * Generates clear, human-readable bilingual instructions for parents
 */
export function buildInstructionTexts(item: {
  form: MedicineForm;
  dosage: string;
  frequency: DoseFrequency;
  timing: MealTiming;
  durationDays: number;
  route?: string;
  site?: string;
  instructionsHint?: string;
}): { instructionEn: string; instructionTe: string; timeSlots: ('Morning' | 'Afternoon' | 'Night')[] } {
  const freq = FREQUENCY_TRANSLATIONS[item.frequency] || FREQUENCY_TRANSLATIONS.TWICE_DAILY;
  const timing = TIMING_TRANSLATIONS[item.timing] || TIMING_TRANSLATIONS.AFTER_FOOD;
  const form = FORM_TRANSLATIONS[item.form] || { en: item.form, te: item.form };

  const durationStrEn = item.durationDays > 0 ? ` for ${item.durationDays} day${item.durationDays > 1 ? 's' : ''}` : '';
  const durationStrTe = item.durationDays > 0 ? ` ${item.durationDays} రోజుల పాటు` : '';

  let routeEn = '';
  let routeTe = '';

  const r = (item.route || '').toLowerCase();
  const s = (item.site || '').toLowerCase();
  const hint = (item.instructionsHint || '').toLowerCase();

  if (r.includes('nasal') || s.includes('nostril') || hint.includes('nostril')) {
    routeEn = ' in each nostril';
    routeTe = ' రెండు ముక్కు రంధ్రాలలో';
  } else if (r.includes('ear') || s.includes('ear')) {
    routeEn = ' in affected ear';
    routeTe = ' చెవిలో';
  } else if (r.includes('eye') || s.includes('eye')) {
    routeEn = ' in affected eye';
    routeTe = ' కంటిలో';
  } else if (r.includes('topical') || item.form === 'CREAM') {
    routeEn = ' gently on affected area';
    routeTe = ' ప్రభావిత భాగంపై సున్నితంగా';
  } else if (r.includes('inhal') || item.form === 'INHALER') {
    routeEn = ' via spacer / inhaler';
    routeTe = ' ఇన్హేలర్ ద్వారా';
  }

  const verbEn = (item.form === 'CREAM' || r.includes('topical')) ? 'Apply' : (item.form === 'DROPS' ? 'Instill' : 'Take');
  const verbTe = (item.form === 'CREAM' || r.includes('topical')) ? 'రాయండి' : 'వేయండి';

  const instructionEn = `${verbEn} ${item.dosage} (${form.en})${routeEn} ${freq.en}, ${timing.en}${durationStrEn}.${item.instructionsHint ? ` Note: ${item.instructionsHint}` : ''}`;
  const instructionTe = `${item.dosage} (${form.te})${routeTe} ${freq.te}, ${timing.te}${durationStrTe} ${verbTe}.`;

  return {
    instructionEn,
    instructionTe,
    timeSlots: freq.timeSlots,
  };
}

/**
 * Pediatric BMI and growth evaluation according to validated IAP / WHO standards.
 * Crucial: Must NEVER use adult BMI cutoffs (>25) for growing children.
 * Bounds: Rejects non-positive or unphysiological measurements.
 */
export function calculatePediatricGrowth(params: {
  childId: string;
  ageYears?: number;
  heightCm: number;
  weightKg: number;
  recordedByRole: 'DOCTOR' | 'RECEPTIONIST';
  recordedByName: string;
  notes?: string;
}): PediatricGrowthRecord {
  if (!Number.isFinite(params.heightCm) || params.heightCm < 20 || params.heightCm > 220) {
    throw new Error(`Invalid height: ${params.heightCm} cm. Must be between 20 cm and 220 cm.`);
  }
  if (!Number.isFinite(params.weightKg) || params.weightKg < 0.5 || params.weightKg > 180) {
    throw new Error(`Invalid weight: ${params.weightKg} kg. Must be between 0.5 kg and 180 kg.`);
  }

  const state = db.getState();
  const heightM = params.heightCm / 100;
  const bmi = Number((params.weightKg / (heightM * heightM)).toFixed(1));

  // Find previous growth record for this child to determine growth trajectory
  const previousRecords = state.growthRecords
    .filter((g) => g.childId === params.childId)
    .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));

  const prev = previousRecords[0];
  const heightDeltaCm = prev ? Number((params.heightCm - prev.heightCm).toFixed(1)) : undefined;
  const weightDeltaKg = prev ? Number((params.weightKg - prev.weightKg).toFixed(1)) : undefined;

  const hasKnownAge = typeof params.ageYears === 'number' && !isNaN(params.ageYears) && params.ageYears >= 0;

  let growthStatus: 'HEALTHY' | 'BELOW_RANGE' | 'ABOVE_RANGE' | 'REVIEW_ADVISED' = 'REVIEW_ADVISED';
  let interpretationText = '';

  if (!hasKnownAge) {
    growthStatus = 'REVIEW_ADVISED';
    interpretationText = `Pediatric BMI is ${bmi} kg/m². Child age or date of birth is not recorded; age-dependent WHO/IAP percentile category cannot be determined without valid age.`;
  } else {
    const rawAge = params.ageYears!;
    const bracketAge = Math.min(Math.max(Math.round(rawAge), 0), 18);
    const standards = WHO_IAP_PEDIATRIC_STANDARDS[bracketAge] || WHO_IAP_PEDIATRIC_STANDARDS[0];

    if (bmi < standards.bmi.p5) {
      growthStatus = 'BELOW_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Under 5th percentile ${standards.bmi.p5} for age ${bracketAge}y - Underweight). Nutritional monitoring advised.`;
    } else if (bmi > standards.bmi.p95) {
      growthStatus = 'ABOVE_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Above 95th percentile ${standards.bmi.p95} for age ${bracketAge}y - Clinically Elevated). Caloric & lifestyle review advised.`;
    } else if (bmi > standards.bmi.p85) {
      growthStatus = 'ABOVE_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Above 85th percentile ${standards.bmi.p85} for age ${bracketAge}y - Overweight band). Healthy activity review advised.`;
    } else {
      growthStatus = 'HEALTHY';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Optimal healthy pediatric range ${standards.bmi.p5}-${standards.bmi.p85} kg/m² for age ${bracketAge}y).`;
    }
  }

  if (prev && weightDeltaKg !== undefined && heightDeltaCm !== undefined) {
    interpretationText += ` [Since ${prev.recordedDate}: Weight ${weightDeltaKg >= 0 ? '+' : ''}${weightDeltaKg} kg, Height ${heightDeltaCm >= 0 ? '+' : ''}${heightDeltaCm} cm]`;
  }

  const newRecord: PediatricGrowthRecord = {
    id: `pgr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    childId: params.childId,
    recordedDate: state.config.simulatedDate,
    ageYears: hasKnownAge ? params.ageYears : undefined,
    ageMonths: hasKnownAge ? Math.round(params.ageYears! * 12) : undefined,
    heightCm: params.heightCm,
    weightKg: params.weightKg,
    pediatricBmi: bmi,
    heightDeltaCm,
    weightDeltaKg,
    growthStatus,
    interpretationText,
    doctorConfirmed: params.recordedByRole === 'DOCTOR',
    recordedByRole: params.recordedByRole,
    recordedByName: params.recordedByName,
    notes: params.notes,
  };

  return newRecord;
}

/**
 * Checks for drug allergy conflicts between child allergies and prescribed items.
 */
export function checkAllergyConflict(
  childId: string,
  medicineName: string,
  genericName?: string
): { hasConflict: boolean; allergy?: ChildAllergy; message?: string } {
  const state = db.getState();
  const allergies = state.allergies.filter((a) => a.childId === childId && a.status === 'ACTIVE');

  const medSearch = (medicineName + ' ' + (genericName || '')).toLowerCase();

  for (const allergy of allergies) {
    const sub = allergy.substance.toLowerCase();
    if (medSearch.includes(sub) || (sub.includes('amox') && medSearch.includes('augm')) || (sub.includes('penicillin') && (medSearch.includes('amox') || medSearch.includes('ampi')))) {
      return {
        hasConflict: true,
        allergy,
        message: `CRITICAL ALLERGY ALERT: Patient has documented allergy to ${allergy.substance} (Reaction: ${allergy.reaction}, Severity: ${allergy.severity}). Prescribing ${medicineName} is strongly contraindicated.`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Adds an audit log entry for any clinical modification
 */
export function logClinicalAudit(params: {
  actorId: string;
  actorRole: 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  actorName: string;
  action: 'CREATE' | 'UPDATE' | 'RESOLVE' | 'ENTER_ERROR' | 'FINALIZE_PRESCRIPTION';
  entityType: 'ALLERGY' | 'CONDITION' | 'ENCOUNTER' | 'PRESCRIPTION' | 'GROWTH';
  entityId: string;
  childId: string;
  details: string;
}): ClinicalAuditLog {
  const log: ClinicalAuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    childId: params.childId,
    details: params.details,
    timestamp: new Date().toISOString(),
  };

  db.updateState((state) => {
    state.auditLogs.unshift(log);
  });

  return log;
}
