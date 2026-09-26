import { calculatePediatricGrowth, buildInstructionTexts, WHO_IAP_PEDIATRIC_STANDARDS } from '../server/pediatricEmrService.js';
import { db } from '../server/db.js';

async function runTests() {
  console.log('--- Starting Workspace QA Fixes Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Pediatric Growth Bounds Validation (D03)
  console.log('\n--- Test 1: Pediatric Growth Validation Bounds (D03) ---');
  try {
    calculatePediatricGrowth({
      childId: 'c1',
      ageYears: 3,
      heightCm: -10,
      weightKg: 15,
      recordedByRole: 'DOCTOR',
      recordedByName: 'Dr. Test',
    });
    assert(false, 'Expected negative height to be rejected');
  } catch (e: any) {
    assert(e.message.includes('Must be between 20 cm and 220 cm'), 'Negative height rejected with physiological error');
  }

  try {
    calculatePediatricGrowth({
      childId: 'c1',
      ageYears: 3,
      heightCm: 100,
      weightKg: -5,
      recordedByRole: 'DOCTOR',
      recordedByName: 'Dr. Test',
    });
    assert(false, 'Expected negative weight to be rejected');
  } catch (e: any) {
    assert(e.message.includes('Must be between 0.5 kg and 180 kg'), 'Negative weight rejected with physiological error');
  }

  try {
    calculatePediatricGrowth({
      childId: 'c1',
      ageYears: 3,
      heightCm: 350,
      weightKg: 15,
      recordedByRole: 'DOCTOR',
      recordedByName: 'Dr. Test',
    });
    assert(false, 'Expected extreme 350cm height to be rejected');
  } catch (e: any) {
    assert(e.message.includes('Must be between 20 cm and 220 cm'), 'Extreme height rejected');
  }

  // 2. Harmonized Growth Percentile Classification (D04)
  console.log('\n--- Test 2: Growth Classification Harmonization (D04) ---');
  // 3-year-old boy, 100 cm, 13.8 kg -> BMI = 13.8.
  // Standard p5 for 3yo BMI is 14.0. Therefore 13.8 < 14.0 is BELOW_RANGE (underweight)
  const growthUnderweight = calculatePediatricGrowth({
    childId: 'c1',
    ageYears: 3,
    heightCm: 100,
    weightKg: 13.8,
    recordedByRole: 'DOCTOR',
    recordedByName: 'Dr. Test',
  });
  assert(growthUnderweight.pediatricBmi === 13.8, `BMI calculated correctly as 13.8 (got ${growthUnderweight.pediatricBmi})`);
  assert(growthUnderweight.growthStatus === 'BELOW_RANGE', `BMI 13.8 (<p5) classified as BELOW_RANGE (got ${growthUnderweight.growthStatus})`);

  // 3-year-old boy, 100 cm, 15.0 kg -> BMI = 15.0.
  // Standard p5 is 14.0, p85 is 17.0. Therefore 15.0 is in HEALTHY range
  const growthHealthy = calculatePediatricGrowth({
    childId: 'c1',
    ageYears: 3,
    heightCm: 100,
    weightKg: 15.0,
    recordedByRole: 'DOCTOR',
    recordedByName: 'Dr. Test',
  });
  assert(growthHealthy.pediatricBmi === 15.0, `BMI calculated correctly as 15.0 (got ${growthHealthy.pediatricBmi})`);
  assert(growthHealthy.growthStatus === 'HEALTHY', `BMI 15.0 (p5-p85) classified as HEALTHY (got ${growthHealthy.growthStatus})`);

  // 3-year-old boy, 100 cm, 17.5 kg -> BMI = 17.5.
  // Standard p85 for 3yo BMI is 17.0. 17.5 > 17.0 -> ABOVE_RANGE (Overweight)
  const growthOverweight = calculatePediatricGrowth({
    childId: 'c1',
    ageYears: 3,
    heightCm: 100,
    weightKg: 17.5,
    recordedByRole: 'DOCTOR',
    recordedByName: 'Dr. Test',
  });
  assert(growthOverweight.pediatricBmi === 17.5, `BMI calculated correctly as 17.5 (got ${growthOverweight.pediatricBmi})`);
  assert(growthOverweight.growthStatus === 'ABOVE_RANGE', `BMI 17.5 (>p85) classified as ABOVE_RANGE (got ${growthOverweight.growthStatus})`);

  // 3. Nasal Drops Route Instructions (D11)
  console.log('\n--- Test 3: Route-Specific Bilingual Instructions (D11) ---');
  const nasalInstructions = buildInstructionTexts({
    form: 'DROPS',
    dosage: '2 drops',
    frequency: 'THRICE_DAILY',
    timing: 'AFTER_FOOD',
    durationDays: 5,
    route: 'Nasal',
    site: 'both nostrils',
    instructionsHint: 'Put drops before feeding',
  });
  assert(
    nasalInstructions.instructionEn.includes('in each nostril') || nasalInstructions.instructionEn.includes('nasal'),
    `English instructions include nasal site: "${nasalInstructions.instructionEn}"`
  );
  assert(
    nasalInstructions.instructionTe.includes('ముక్కు') || nasalInstructions.instructionTe.includes('నాసిక'),
    `Telugu instructions include Telugu word for nose/nostril: "${nasalInstructions.instructionTe}"`
  );

  // 4. Inhaler Route Instructions
  const inhalerInstructions = buildInstructionTexts({
    form: 'INHALER',
    dosage: '2 puff',
    frequency: 'TWICE_DAILY',
    timing: 'AFTER_FOOD',
    durationDays: 14,
    route: 'Inhalation',
    site: 'spacer',
    instructionsHint: 'Use pediatric spacer with mask',
  });
  assert(
    inhalerInstructions.instructionEn.includes('spacer') || inhalerInstructions.instructionEn.includes('inhaler'),
    `Inhaler instruction includes spacer/inhaler: "${inhalerInstructions.instructionEn}"`
  );
  assert(
    inhalerInstructions.instructionTe.includes('ఇన్హేలర్'),
    `Telugu inhaler instruction includes Telugu word for inhaler: "${inhalerInstructions.instructionTe}"`
  );

  // 5. Check WHO Standards coverage
  console.log('\n--- Test 4: WHO Standards Age Coverage (0-18y) ---');
  const standardKeys = Object.keys(WHO_IAP_PEDIATRIC_STANDARDS);
  assert(standardKeys.length >= 19, `WHO standards covers ages 0-18 (length: ${standardKeys.length})`);
  assert(WHO_IAP_PEDIATRIC_STANDARDS[0] !== undefined, 'Age 0 standard defined');
  assert(WHO_IAP_PEDIATRIC_STANDARDS[18] !== undefined, 'Age 18 standard defined');

  // 6. Unknown Age Growth Validation (R2-14 / D05)
  console.log('\n--- Test 5: Unknown Age Handling (R2-14 / D05) ---');
  const growthUnknownAge = calculatePediatricGrowth({
    childId: 'c-no-age',
    heightCm: 100,
    weightKg: 15,
    recordedByRole: 'DOCTOR',
    recordedByName: 'Dr. Test',
  });
  assert(growthUnknownAge.ageYears === undefined, 'ageYears is undefined when age not supplied');
  assert(growthUnknownAge.growthStatus === 'REVIEW_ADVISED', `growthStatus is REVIEW_ADVISED without age (got ${growthUnknownAge.growthStatus})`);
  assert(growthUnknownAge.interpretationText.includes('Child age or date of birth is not recorded'), 'Interpretation text clearly states age is not recorded');

  // 7. Numeric Age Zero (Infant) Handling
  console.log('\n--- Test 6: Numeric Age 0 (Infant) Handling ---');
  const growthAgeZero = calculatePediatricGrowth({
    childId: 'c-infant',
    ageYears: 0,
    heightCm: 50,
    weightKg: 3.3,
    recordedByRole: 'DOCTOR',
    recordedByName: 'Dr. Test',
  });
  assert(growthAgeZero.ageYears === 0, 'ageYears 0 preserved for infant');
  assert(growthAgeZero.growthStatus === 'HEALTHY', `Infant with 3.3kg / 50cm classified as HEALTHY (got ${growthAgeZero.growthStatus})`);

  console.log(`\n========================================`);
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
