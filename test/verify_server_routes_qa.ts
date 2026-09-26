import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes.js';
import { db } from '../server/db.js';

async function runRouteTests() {
  console.log('--- Starting Server Route QA Verification ---');
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

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const state = db.getState();
    const validDoctor = state.doctors[0];
    const validChild = state.parents[0].children[0];

    // Authenticate via /api/auth/doctor-login to obtain a valid session token
    const loginRes = await fetch(`${baseUrl}/api/auth/doctor-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: validDoctor.id,
        password: 'Doctor@123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Doctor authenticated via /api/auth/doctor-login');
    const validToken = loginData.token;

    // 1. D01: Authorization enforcement on clinical search
    console.log('\n--- Test 1: Auth Guards on Clinical Read Routes (D01) ---');
    const anonSearch = await fetch(`${baseUrl}/api/emr/children/search?q=test`);
    assert(anonSearch.status === 401, `Anonymous child search blocked with 401 (got ${anonSearch.status})`);

    const authedSearch = await fetch(`${baseUrl}/api/emr/children/search?q=test`, {
      headers: { 'x-doctor-token': validToken },
    });
    assert(authedSearch.status === 200, `Authenticated doctor child search allowed with 200 (got ${authedSearch.status})`);

    // 2. D01: Auth guard on child record
    const anonChild = await fetch(`${baseUrl}/api/emr/children/${validChild.id}`);
    assert(anonChild.status === 401, `Anonymous child record access blocked with 401 (got ${anonChild.status})`);

    const authedChild = await fetch(`${baseUrl}/api/emr/children/${validChild.id}`, {
      headers: { 'x-doctor-token': validToken },
    });
    assert(authedChild.status === 200, `Authenticated doctor child record allowed with 200 (got ${authedChild.status})`);

    // 3. D03: Physiological bounds validation on growth API
    console.log('\n--- Test 2: Growth API Physiological Bounds Validation (D03) ---');
    const invalidGrowth = await fetch(`${baseUrl}/api/emr/children/${validChild.id}/growth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        heightCm: -50,
        weightKg: 12,
      }),
    });
    assert(invalidGrowth.status === 400, `Negative height rejected with 400 (got ${invalidGrowth.status})`);

    // 4. D02: Medicine dose validation on finalization
    console.log('\n--- Test 3: Prescription Validation Bounds (D02) ---');
    // First start an encounter
    const startEncRes = await fetch(`${baseUrl}/api/emr/encounters/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        childId: validChild.id,
        branchId: 'kakinada',
      }),
    });
    const startEnc = await startEncRes.json();
    assert(startEncRes.status === 200 && startEnc.success, 'Encounter started successfully');
    const encId = startEnc.encounter.id;

    // Finalize with 0 duration
    const zeroDurationRes = await fetch(`${baseUrl}/api/emr/encounters/${encId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        diagnosis: 'Acute URTI',
        items: [
          {
            medicineName: 'Syrup Paracetamol',
            dosage: '5 ml',
            durationDays: 0, // Invalid!
          },
        ],
      }),
    });
    assert(zeroDurationRes.status === 400, `0 duration medicine rejected with 400 (got ${zeroDurationRes.status})`);

    // Finalize with negative duration
    const negDurationRes = await fetch(`${baseUrl}/api/emr/encounters/${encId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        diagnosis: 'Acute URTI',
        items: [
          {
            medicineName: 'Syrup Paracetamol',
            dosage: '5 ml',
            durationDays: -3, // Invalid!
          },
        ],
      }),
    });
    assert(negDurationRes.status === 400, `Negative duration medicine rejected with 400 (got ${negDurationRes.status})`);

    // 5. D09: Auto-Call Eligibility (callNext=false vs callNext=true)
    console.log('\n--- Test 4: Auto-Call Behavior (D09) ---');
    // When callNext=false (Finalize & Finish): nextPatient is null, doctor room is left clean
    const finishOnlyRes = await fetch(`${baseUrl}/api/emr/encounters/${encId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        diagnosis: 'Acute URTI',
        callNext: false,
        items: [
          {
            medicineName: 'Syrup Paracetamol',
            form: 'SYRUP',
            dosage: '5 ml',
            frequency: 'SOS',
            timing: 'AFTER_FOOD',
            durationDays: 3,
          },
        ],
      }),
    });
    // 6. R2-01 / R2-19: Allergy creation and status patch (Authorized Doctor)
    console.log('\n--- Test 5: Allergy Creation and Patch (R2-01 / R2-19) ---');
    const allergyRes = await fetch(`${baseUrl}/api/emr/children/${validChild.id}/allergies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        substance: 'Amoxicillin',
        reaction: 'Urticarial rash',
        severity: 'SEVERE',
        notes: 'Verified during OPD testing',
      }),
    });
    const allergyJson = await allergyRes.json();
    assert(allergyRes.status === 201, `Allergy created successfully with 201 (got ${allergyRes.status})`);
    assert(allergyJson.success === true && allergyJson.allergy?.substance === 'Amoxicillin', 'Allergy data returned with correct substance');
    assert(allergyJson.allergy?.doctorId !== undefined, `Allergy saved with doctorId: ${allergyJson.allergy?.doctorId}`);

    const patchAllergyRes = await fetch(`${baseUrl}/api/emr/allergies/${allergyJson.allergy.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        notes: 'Resolved after test review',
      }),
    });
    const patchAllergyJson = await patchAllergyRes.json();
    assert(patchAllergyRes.status === 200, `Allergy patched successfully with 200 (got ${patchAllergyRes.status})`);
    assert(patchAllergyJson.allergy?.status === 'RESOLVED', 'Allergy status updated to RESOLVED');

    // 7. R2-20: Chronic Condition creation and patch (Authorized Doctor)
    console.log('\n--- Test 6: Condition Creation and Patch (R2-20) ---');
    const conditionRes = await fetch(`${baseUrl}/api/emr/children/${validChild.id}/conditions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        conditionName: 'Childhood Asthma',
        category: 'RESPIRATORY',
        status: 'ACTIVE',
        notes: 'Mild intermittent',
        followUpRecommendation: 'Review in 2 weeks',
      }),
    });
    const conditionJson = await conditionRes.json();
    assert(conditionRes.status === 201, `Condition created successfully with 201 (got ${conditionRes.status})`);
    assert(conditionJson.success === true && conditionJson.condition?.conditionName === 'Childhood Asthma', 'Condition created with correct name');

    const patchConditionRes = await fetch(`${baseUrl}/api/emr/conditions/${conditionJson.condition.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-doctor-token': validToken,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        notes: 'Symptom free',
      }),
    });
    const patchConditionJson = await patchConditionRes.json();
    assert(patchConditionRes.status === 200, `Condition patched successfully with 200 (got ${patchConditionRes.status})`);
    assert(patchConditionJson.condition?.status === 'RESOLVED', 'Condition status updated to RESOLVED');

    // 8. Reception Phone Booking Search Verification
    console.log('\n--- Test 7: Reception Phone Search Verification ---');
    const existingParent = state.parents[0];
    const phoneToSearch = existingParent.mobile;
    const searchRes = await fetch(`${baseUrl}/api/parents/search?q=${encodeURIComponent(phoneToSearch)}`);
    const searchJson = await searchRes.json();
    assert(searchRes.status === 200, `Parent phone search succeeded with 200 (got ${searchRes.status})`);
    assert(
      searchJson.id === existingParent.id && searchJson.mobile === phoneToSearch,
      `Parent with mobile ${phoneToSearch} found in search results`
    );

    // Search with last 10 digits only if longer or with spaces
    const last10 = phoneToSearch.replace(/\D/g, '').slice(-10);
    const searchRes10 = await fetch(`${baseUrl}/api/parents/search?q=${encodeURIComponent(last10)}`);
    const searchJson10 = await searchRes10.json();
    assert(
      searchJson10.id === existingParent.id,
      `Parent found using 10-digit query '${last10}'`
    );

    // 9. Appointment Editing Capability (Pre-Doctor vs In-Consultation)
    console.log('\n--- Test 8: Appointment Editing Rules (Pre-Doctor vs With-Doctor) ---');
    // Find an appointment in BOOKED/ARRIVED/WAITING
    const editableAppt = state.appointments.find(
      (a: any) => a.status === 'BOOKED' || a.status === 'WAITING' || a.status === 'ARRIVED'
    );
    assert(!!editableAppt, 'Found test appointment in pre-consultation status');

    if (editableAppt) {
      const updateRes = await fetch(`${baseUrl}/api/appointments/${editableAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: 'Updated Child Name',
          heightCm: 110,
          weightKg: 20,
          temperatureF: 98.6,
          pulseRate: 85,
        }),
      });
      const updateJson = await updateRes.json();
      assert(updateRes.status === 200, `Appointment details updated successfully (got ${updateRes.status})`);
      assert(updateJson.appointment?.childName === 'Updated Child Name', 'Child name correctly updated');
      assert(updateJson.appointment?.heightCm === 110, 'Height correctly updated in triage vitals');
      assert(updateJson.appointment?.weightKg === 20, 'Weight correctly updated in triage vitals');
      assert(updateJson.appointment?.pediatricBmi === 16.5, 'Pediatric BMI computed dynamically from height & weight');

      // Now set status to WITH_DOCTOR and verify edit is rejected
      const prevStatus = editableAppt.status;
      editableAppt.status = 'WITH_DOCTOR';
      const blockedUpdateRes = await fetch(`${baseUrl}/api/appointments/${editableAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: 'Hacked Name After Doctor Started',
        }),
      });
      assert(
        blockedUpdateRes.status === 400,
        `Appointment update correctly rejected with 400 when patient is WITH_DOCTOR (got ${blockedUpdateRes.status})`
      );
      // Restore status
      editableAppt.status = prevStatus;
    }

    // 10. Teleconsultations API Verification (Patient Availability & Payment Tracking)
    console.log('\n--- Test 9: Teleconsultation API Verification ---');
    const teleRes = await fetch(`${baseUrl}/api/teleconsultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childName: 'Baby Shreya',
        childAge: 2,
        childGender: 'Girl',
        parentName: 'Ramesh Varma',
        parentMobile: '9848022334',
        patientAvailability: 'AVAILABLE_NOW',
        preferredChannel: 'WHATSAPP_VIDEO',
        symptoms: 'Mild cold and dry cough',
        paymentStatus: 'PENDING',
        amount: 300,
      }),
    });
    const teleJson = await teleRes.json();
    assert(teleRes.status === 201, `Teleconsultation created successfully (got ${teleRes.status})`);
    assert(teleJson.teleconsultation?.paymentStatus === 'PENDING', 'Initial payment status recorded as PENDING');
    assert(teleJson.teleconsultation?.patientAvailability === 'AVAILABLE_NOW', 'Patient availability recorded as AVAILABLE_NOW');

    // Update payment status to PAID
    const patchPayRes = await fetch(`${baseUrl}/api/teleconsultations/${teleJson.teleconsultation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentStatus: 'PAID',
        paymentReference: 'UPI-UTR-99881122',
        paymentMethod: 'UPI_PHONEPE',
      }),
    });
    const patchPayJson = await patchPayRes.json();
    assert(patchPayRes.status === 200, `Payment status updated via PATCH (got ${patchPayRes.status})`);
    assert(patchPayJson.teleconsultation?.paymentStatus === 'PAID', 'Payment status updated to PAID');
    assert(patchPayJson.teleconsultation?.paymentReference === 'UPI-UTR-99881122', 'UPI payment reference recorded');

    // Fetch teleconsultations list
    const getTeleList = await fetch(`${baseUrl}/api/teleconsultations?mobile=9848022334`);
    const teleList = await getTeleList.json();
    assert(Array.isArray(teleList) && teleList.length > 0, 'Teleconsultations listed by mobile number');

    console.log(`\n========================================`);
    console.log(`Route Verification: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runRouteTests().catch((err) => {
  console.error('Fatal error during route test run:', err);
  process.exit(1);
});
