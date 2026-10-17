import express from 'express';
import { createServer } from 'http';
import { apiRouter } from '../server/routes.js';
import { db } from '../server/db.js';
import { schedulingService } from '../server/schedulingService.js';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  DOCTORMATE SAAS — PHASE 1 END-TO-END VERIFICATION  ');
  console.log('====================================================\n');

  // 1. Setup ephemeral test server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(4199, resolve));
  const baseUrl = 'http://localhost:4199/api';

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Hospital Self-Registration
    // ------------------------------------------------------------------------
    console.log('\n--- Step 1: Hospital Self-Registration & Directory Listing ---');
    const regRes = await fetch(`${baseUrl}/hospitals/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Apollo Apex Hospital',
        address: '77 Healthcare Boulevard',
        city: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        pincode: '530002',
        phone: '+91 891 223 4455',
        adminName: 'Dr. Vivek Sharma',
        adminEmail: `admin_${Date.now()}@apolloapex.com`,
        adminMobile: '9888877777',
        password: 'AdminPassword@123',
        hospitalType: 'Super Speciality Hospital',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.ok && regData.success && !!regData.hospital?.id, 'Hospital self-registration succeeds with admin token');
    const hospitalId = regData.hospital.id;
    const hospitalSlug = regData.hospital.slug;

    // Verify hospital exists in public directory
    const dirRes = await fetch(`${baseUrl}/hospitals`);
    const dirData = await dirRes.json();
    assert(
      Array.isArray(dirData) && dirData.some((h: any) => h.id === hospitalId),
      'Newly registered hospital appears in public hospitals directory'
    );

    // ------------------------------------------------------------------------
    // TEST 2: Doctor Registration with Custom Time Slots (5m vs 10m)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Custom Doctor Slot Allocations (5 min vs 10 min) ---');
    const onboardRes = await fetch(`${baseUrl}/hospitals/${hospitalId}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 3,
        doctors: [
          {
            name: 'Dr. Deepa Nair',
            specialty: 'Pediatric Quick OPD',
            slotDurationMinutes: 5, // 5-minute slots!
            consultationFee: 350,
            startTime: '09:00',
            endTime: '11:00',
            availableDays: [1, 2, 3, 4, 5, 6, 7],
          },
          {
            name: 'Dr. Rajesh Khanna',
            specialty: 'Cardiology Review',
            slotDurationMinutes: 10, // 10-minute slots!
            consultationFee: 700,
            startTime: '09:00',
            endTime: '11:00',
            availableDays: [1, 2, 3, 4, 5, 6, 7],
          },
        ],
        activate: true,
      }),
    });
    const onboardData = await onboardRes.json();
    assert(onboardRes.ok && onboardData.hospital?.status === 'ACTIVE', 'Hospital activated with custom doctors');

    // Retrieve doctors for this hospital
    const hospProfileRes = await fetch(`${baseUrl}/hospitals/${hospitalSlug}`);
    const hospProfile = await hospProfileRes.json();
    const doc5m = hospProfile.doctors.find((d: any) => d.name === 'Dr. Deepa Nair');
    const doc10m = hospProfile.doctors.find((d: any) => d.name === 'Dr. Rajesh Khanna');

    assert(doc5m && doc5m.slotDurationMinutes === 5, 'Doctor 1 configured with exact 5-minute slot duration');
    assert(doc10m && doc10m.slotDurationMinutes === 10, 'Doctor 2 configured with exact 10-minute slot duration');

    // Verify slot calculation intervals
    const branchId = hospProfile.branches[0]?.id || 'main';
    const testDate = db.getState().config.simulatedDate;

    const slots5m = schedulingService.getAvailableSlots(doc5m.id, branchId, testDate);
    const slots10m = schedulingService.getAvailableSlots(doc10m.id, branchId, testDate);

    assert(slots5m.length > 0, 'Available slots generated for 5-minute doctor');
    assert(slots10m.length > 0, 'Available slots generated for 10-minute doctor');

    // Check interval steps
    if (slots5m.length >= 2) {
      const t1 = slots5m[0].time;
      const t2 = slots5m[1].time;
      const [h1, m1] = t1.split(':').map(Number);
      const [h2, m2] = t2.split(':').map(Number);
      const diff5m = (h2 * 60 + m2) - (h1 * 60 + m1);
      assert(diff5m === 5, `5-minute doctor produces 5-minute slot intervals (${t1} -> ${t2})`);
    }

    if (slots10m.length >= 2) {
      const t1 = slots10m[0].time;
      const t2 = slots10m[1].time;
      const [h1, m1] = t1.split(':').map(Number);
      const [h2, m2] = t2.split(':').map(Number);
      const diff10m = (h2 * 60 + m2) - (h1 * 60 + m1);
      assert(diff10m === 10, `10-minute doctor produces 10-minute slot intervals (${t1} -> ${t2})`);
    }

    // ------------------------------------------------------------------------
    // TEST 3: Receptionist Telephone Booking & Duplicate Prevention
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Receptionist Telephone Booking & Structured Tokens ---');
    const targetSlot = slots5m[0]?.time || '09:00';
    const phoneBookRes = await fetch(`${baseUrl}/reception/phone-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        patientName: 'Kiran Verma',
        mobileNumber: '9123456789',
        patientAge: 29,
        guardianName: 'Sunita Verma',
        doctorId: doc5m.id,
        branchId,
        date: testDate,
        bookedTime: targetSlot,
        bookingSource: 'RECEPTION_PHONE',
      }),
    });
    const phoneBookData = await phoneBookRes.json();
    assert(phoneBookRes.ok && phoneBookData.success, 'Reception telephone booking succeeds');
    assert(
      phoneBookData.appointment?.appointmentNumber && phoneBookData.appointment.appointmentNumber.startsWith('DM-'),
      `Appointment token follows structured format: ${phoneBookData.appointment?.appointmentNumber}`
    );
    assert(
      phoneBookData.appointment?.hospitalId === hospitalId,
      'Appointment is correctly tagged with hospitalId'
    );
    assert(
      !!phoneBookData.trackerUrl,
      `Two-factor tracking link generated: ${phoneBookData.trackerUrl}`
    );

    // Test duplicate booking prevention on the exact same slot
    const dupRes = await fetch(`${baseUrl}/reception/phone-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        patientName: 'Another Patient',
        mobileNumber: '9888800000',
        doctorId: doc5m.id,
        branchId,
        date: testDate,
        bookedTime: targetSlot,
        bookingSource: 'RECEPTION_PHONE',
      }),
    });
    assert(dupRes.status === 409, 'Double booking is rejected with 409 Conflict error');

    // ------------------------------------------------------------------------
    // TEST 4: Online Patient Booking
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Public Online Patient Booking ---');
    const onlineSlot = slots5m[1]?.time || '09:05';
    const onlineBookRes = await fetch(`${baseUrl}/appointments/online-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        patientName: 'Aarav Patel',
        mobileNumber: '9988776655',
        patientAge: 6,
        guardianName: 'Meera Patel',
        doctorId: doc5m.id,
        branchId,
        date: testDate,
        bookedTime: onlineSlot,
      }),
    });
    const onlineBookData = await onlineBookRes.json();
    assert(onlineBookRes.ok && onlineBookData.success, 'Public online booking succeeds');
    assert(
      onlineBookData.appointment?.bookingSource === 'ONLINE',
      'Booking source is recorded as ONLINE'
    );

    // ------------------------------------------------------------------------
    // TEST 5: Multi-Tenant Data Isolation (Hospital A vs Hospital B)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Multi-Tenant Queue & Dashboard Isolation ---');
    // Hospital A (Apollo Apex)
    const dashResA = await fetch(`${baseUrl}/reception/dashboard?hospitalId=${hospitalId}&date=${testDate}`);
    const dashA = await dashResA.json();

    // Hospital B (Apex Multi-Specialty Hospital)
    const dashResB = await fetch(`${baseUrl}/reception/dashboard?hospitalId=hosp_sdch&date=${testDate}`);
    const dashB = await dashResB.json();

    const apptsA = dashA.appointments || [];
    const apptsB = dashB.appointments || [];

    const hasLeakedApptInB = apptsB.some((a: any) => a.hospitalId === hospitalId);
    const hasLeakedApptInA = apptsA.some((a: any) => a.hospitalId === 'hosp_sdch');

    assert(!hasLeakedApptInB, 'Hospital A appointments do NOT leak into Hospital B dashboard');
    assert(!hasLeakedApptInA, 'Hospital B appointments do NOT leak into Hospital A dashboard');
    assert(apptsA.length >= 2, `Hospital A reception sees its own appointments (found ${apptsA.length})`);

    // ------------------------------------------------------------------------
    // TEST 6: Doctor Delay & Train-ETA Queue Propagation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Dynamic Doctor Delay Propagation ---');
    const delayRes = await fetch(`${baseUrl}/reception/doctor-delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        doctorId: doc5m.id,
        branchId,
        date: testDate,
        delayMinutes: 20,
        explanation: 'Brief emergency round in ICU',
      }),
    });
    const delayData = await delayRes.json();
    assert(delayRes.ok && delayData.success, 'Doctor delay applied successfully');

    // Verify session updated for Hospital A
    const liveQueueA = await fetch(`${baseUrl}/queue/live?hospitalId=${hospitalId}&doctorId=${doc5m.id}&branchId=${branchId}&date=${testDate}`).then(r => r.json());
    assert(liveQueueA.session?.currentDelayMinutes === 20, 'Hospital A doctor session reflects 20-minute delay');

    // Verify Hospital B doctor session was unaffected
    const liveQueueB = await fetch(`${baseUrl}/queue/live?hospitalId=hosp_sdch&doctorId=dr-subba-rao&branchId=kakinada-main&date=${testDate}`).then(r => r.json());
    assert(liveQueueB.session?.currentDelayMinutes !== 20 || liveQueueB.session === undefined, 'Hospital B doctor queue unaffected by Hospital A delay');

    // ------------------------------------------------------------------------
    // TEST 7: Two-Factor Secure Tracking
    // ------------------------------------------------------------------------
    console.log('\n--- Step 7: Two-Factor Secure Appointment Tracking ---');
    const testApptNumber = phoneBookData.appointment.appointmentNumber;

    // A. Without mobile number (Anti-enumeration check)
    const trackNoMobile = await fetch(`${baseUrl}/appointments/secure-track?id=${testApptNumber}`);
    assert(trackNoMobile.status === 401, 'Tracking without mobile verification fails with 401');

    // B. With incorrect mobile number
    const trackWrongMobile = await fetch(`${baseUrl}/appointments/secure-track?id=${testApptNumber}&mobile=0000000000`);
    assert(trackWrongMobile.status === 401, 'Tracking with wrong mobile number fails with 401');

    // C. With correct mobile number (9123456789)
    const trackCorrect = await fetch(`${baseUrl}/appointments/secure-track?id=${testApptNumber}&mobile=9123456789`);
    const trackData = await trackCorrect.json();
    assert(trackCorrect.ok && trackData.success, 'Tracking with correct token + mobile succeeds');
    assert(trackData.patientName === 'Kiran Verma', 'Patient name verified');
    assert(typeof trackData.positionInQueue === 'number', 'Queue position calculated');
    assert(trackData.hospitalName === 'Apollo Apex Hospital', 'Correct hospital details returned in tracker');

  } catch (err) {
    console.error('Test execution failed with error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
