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

/**
 * Generates clear, human-readable bilingual instructions for parents
 */
export function buildInstructionTexts(item: {
  form: MedicineForm;
  dosage: string;
  frequency: DoseFrequency;
  timing: MealTiming;
  durationDays: number;
}): { instructionEn: string; instructionTe: string; timeSlots: ('Morning' | 'Afternoon' | 'Night')[] } {
  const freq = FREQUENCY_TRANSLATIONS[item.frequency] || FREQUENCY_TRANSLATIONS.TWICE_DAILY;
  const timing = TIMING_TRANSLATIONS[item.timing] || TIMING_TRANSLATIONS.AFTER_FOOD;
  const form = FORM_TRANSLATIONS[item.form] || { en: item.form, te: item.form };

  const durationStrEn = item.durationDays > 0 ? ` for ${item.durationDays} day${item.durationDays > 1 ? 's' : ''}` : '';
  const durationStrTe = item.durationDays > 0 ? ` ${item.durationDays} రోజుల పాటు` : '';

  const instructionEn = `Take ${item.dosage} (${form.en}) ${freq.en}, ${timing.en}${durationStrEn}.`;
  const instructionTe = `${item.dosage} (${form.te}) ${freq.te}, ${timing.te}${durationStrTe} వేయండి.`;

  return {
    instructionEn,
    instructionTe,
    timeSlots: freq.timeSlots,
  };
}

/**
 * Pediatric BMI and growth evaluation according to IAP / WHO standards.
 * Crucial: Must NEVER use adult BMI cutoffs (>25) for growing children.
 */
export function calculatePediatricGrowth(params: {
  childId: string;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  recordedByRole: 'DOCTOR' | 'RECEPTIONIST';
  recordedByName: string;
  notes?: string;
}): PediatricGrowthRecord {
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

  let growthStatus: 'HEALTHY' | 'BELOW_RANGE' | 'ABOVE_RANGE' | 'REVIEW_ADVISED' = 'HEALTHY';
  let interpretationText = '';

  const age = params.ageYears || 3;

  if (age < 2) {
    // Under 2 years
    if (params.weightKg < 7.5) {
      growthStatus = 'BELOW_RANGE';
      interpretationText = 'Weight is below expected average for age. Nutritional monitoring advised.';
    } else {
      growthStatus = 'HEALTHY';
      interpretationText = 'Weight and height parameters are within normal infant development range.';
    }
  } else if (age <= 5) {
    // 2 to 5 years (Preschooler: Healthy BMI is ~13.5 - 17.5)
    if (bmi < 13.5) {
      growthStatus = 'BELOW_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Under normal 13.5-17.5 range for age ${age}). Dietary supplementation recommended.`;
    } else if (bmi > 18.0) {
      growthStatus = 'ABOVE_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Above typical 13.5-17.5 preschooler range). Caloric review advised.`;
    } else {
      growthStatus = 'HEALTHY';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Optimal healthy pediatric range for age ${age}).`;
    }
  } else if (age <= 12) {
    // 6 to 12 years (School age: Healthy BMI is ~14.0 - 19.5)
    if (bmi < 14.0) {
      growthStatus = 'BELOW_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Below expected range for age ${age}).`;
    } else if (bmi > 20.5) {
      growthStatus = 'ABOVE_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Elevated for age ${age}). Active lifestyle review advised.`;
    } else {
      growthStatus = 'HEALTHY';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Within healthy percentile band for age ${age}).`;
    }
  } else {
    // 13 to 18 years
    if (bmi < 16.0) {
      growthStatus = 'BELOW_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Underweight percentile).`;
    } else if (bmi > 24.0) {
      growthStatus = 'ABOVE_RANGE';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Above 85th percentile).`;
    } else {
      growthStatus = 'HEALTHY';
      interpretationText = `Pediatric BMI is ${bmi} kg/m² (Healthy adolescent percentile).`;
    }
  }

  if (prev && weightDeltaKg !== undefined && heightDeltaCm !== undefined) {
    interpretationText += ` [Since ${prev.recordedDate}: Weight ${weightDeltaKg >= 0 ? '+' : ''}${weightDeltaKg} kg, Height ${heightDeltaCm >= 0 ? '+' : ''}${heightDeltaCm} cm]`;
  }

  const newRecord: PediatricGrowthRecord = {
    id: `pgr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    childId: params.childId,
    recordedDate: state.config.simulatedDate,
    ageYears: params.ageYears,
    ageMonths: Math.round(params.ageYears * 12),
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
