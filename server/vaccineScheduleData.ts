import { VaccineMilestoneDef } from '../src/types/index.js';

export const IAP_2018_SCHEDULE_MASTER: VaccineMilestoneDef[] = [
  {
    id: 'birth',
    ageLabel: 'Birth',
    offsetDays: 0,
    vaccines: ['BCG', 'Hep B 1 (HB 1)', 'OPV 0'],
    description: 'Administered right after delivery before hospital discharge.',
    mandatory: true,
  },
  {
    id: '6-weeks',
    ageLabel: '6 Weeks',
    offsetDays: 42,
    vaccines: ['Hep B 2 (HB 2)', 'IPV 1', 'DTP 1', 'HiB 1', 'PCV 1', 'Rota 1'],
    description: 'Primary infant immunizations: Polio, DTP, Hepatitis B, Pneumococcal & Rotavirus.',
    mandatory: true,
  },
  {
    id: '10-weeks',
    ageLabel: '10 Weeks',
    offsetDays: 70,
    vaccines: ['Hep B 3 (HB 3)', 'IPV 2', 'DTP 2', 'HiB 2', 'PCV 2', 'Rota 2'],
    description: 'Second dose series of infant pentavalent / hexavalent protection.',
    mandatory: true,
  },
  {
    id: '14-weeks',
    ageLabel: '14 Weeks',
    offsetDays: 98,
    vaccines: ['Hep B 4 (HB 4)', 'IPV 3', 'DTP 3', 'HiB 3', 'PCV 3', 'Rota 3'],
    description: 'Third dose completing the essential infant primary series.',
    mandatory: true,
  },
  {
    id: '6-months',
    ageLabel: '6 Months',
    offsetDays: 180,
    vaccines: ['TCV# (Typhoid Conjugate)', 'Influenza (Yearly 1)'],
    description: 'Typhoid Vi conjugate single-dose protection and seasonal influenza vaccine.',
    mandatory: true,
  },
  {
    id: '9-months',
    ageLabel: '9 Months',
    offsetDays: 270,
    vaccines: ['MMR 1', 'MCV 1'],
    description: 'Measles, Mumps, Rubella first dose & Meningococcal Conjugate Vaccine.',
    mandatory: true,
  },
  {
    id: '12-months',
    ageLabel: '12 Months',
    offsetDays: 365,
    vaccines: ['Hep-A 1', 'MCV 2', 'JE 1', 'Cholera 1 & 2'],
    description: 'Hepatitis A first dose, Japanese Encephalitis & Oral Cholera.',
    mandatory: true,
  },
  {
    id: '13-months',
    ageLabel: '13 Months',
    offsetDays: 395,
    vaccines: ['JE 2'],
    description: 'Japanese Encephalitis second dose completion.',
    mandatory: false,
  },
  {
    id: '15-months',
    ageLabel: '15 Months',
    offsetDays: 455,
    vaccines: ['PCV B1 (Booster 1)', 'MMR 2', 'Varicella 1'],
    description: 'Pneumococcal booster, MMR second dose & Chickenpox (Varicella) protection.',
    mandatory: true,
  },
  {
    id: '16-18-months',
    ageLabel: '16–18 Months',
    offsetDays: 510,
    vaccines: ['IPV B1', 'DTP B1', 'HiB B1', 'Hep-A 2'],
    description: 'First booster for DTP-IPV-HiB and Hepatitis A second dose.',
    mandatory: true,
  },
  {
    id: '2-3-years',
    ageLabel: '2–3 Years',
    offsetDays: 730,
    vaccines: ['MCV Booster', 'Typhoid Booster'],
    description: 'Meningococcal & Typhoid booster maintenance.',
    mandatory: false,
  },
  {
    id: '4-6-years',
    ageLabel: '4–6 Years',
    offsetDays: 1460,
    vaccines: ['DTP B2', 'MMR 3 / MMRV', 'Varicella 2'],
    description: 'Pre-school boosters for DTP, MMR & Chickenpox.',
    mandatory: true,
  },
  {
    id: '9-14-years',
    ageLabel: '9–14 Years',
    offsetDays: 3285,
    vaccines: ['PCV Booster', 'Tdap', 'HPV 1 & 2 (Girls & Boys)'],
    description: 'Adolescent Tdap booster and Human Papillomavirus (HPV) 2-dose series.',
    mandatory: true,
  },
  {
    id: '15-18-years',
    ageLabel: '15–18 Years',
    offsetDays: 5475,
    vaccines: ['Td', 'HPV 1, 2, 3 (Catch-up)'],
    description: 'Tetanus-Diphtheria adult booster & catch-up doses.',
    mandatory: false,
  },
];

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysDiff(fromDateStr: string, targetDateStr: string): number {
  const from = new Date(fromDateStr);
  const target = new Date(targetDateStr);
  const diffMs = target.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
