import { db } from '../server/db.js';
import { schedulingService } from '../server/schedulingService.js';
import assert from 'node:assert';

console.log('=== RUNNING TIMING AND QUEUE RECOVERY VERIFICATION ===\n');

const state = db.getState();
const TEST_DATE = '2026-10-05';
state.config.simulatedDate = TEST_DATE;
state.config.simulatedTime = '10:00';
state.config.slotDurationMinutes = 15;

// Clean up test appointments
state.appointments = state.appointments.filter(a => a.date !== TEST_DATE);
state.sessions = state.sessions.filter(s => s.date !== TEST_DATE);

const session = schedulingService.ensureDoctorSession('dr-subba-rao', 'kakinada', TEST_DATE);
session.currentDelayMinutes = 0;
session.actualStart = '10:00';

// Setup 10 test appointments
const appts = [];
const times = ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15'];
for (let i = 0; i < 10; i++) {
  const appt = {
    id: `test-appt-${i + 1}`,
    appointmentNumber: `SD-K-TEST-${i + 1}`,
    childId: `child-${i + 1}`,
    childName: `QA Child ${i + 1}`,
    parentId: `parent-${i + 1}`,
    parentName: `Parent ${i + 1}`,
    parentMobile: `900009100${i}`,
    doctorId: 'dr-subba-rao',
    doctorName: 'Dr. Subba Rao',
    branchId: 'kakinada',
    branchName: 'Main Branch - Kakinada',
    date: TEST_DATE,
    bookedTime: times[i],
    expectedConsultationTime: times[i],
    recommendedArrivalTime: times[i],
    status: 'WAITING',
    paymentStatus: 'PAID',
    bookingSource: 'ONLINE',
    advanceNoticePreferenceMinutes: 30,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.appointments.push(appt as any);
  appts.push(appt);
}

schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', TEST_DATE);

// ----------------------------------------------------
// TEST 1: QT-D04 - Waiting-patient estimates can never remain in the past
// ----------------------------------------------------
console.log('--- TEST 1: QT-D04: Waiting estimates cannot be in the past ---');
state.config.simulatedTime = '11:00';
schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', TEST_DATE);

const child1 = state.appointments.find(a => a.id === 'test-appt-1')!;
const child2 = state.appointments.find(a => a.id === 'test-appt-2')!;

console.log(`At simulated time 11:00, child 1 (booked 10:00) expected: ${child1.expectedConsultationTime}`);
console.log(`At simulated time 11:00, child 2 (booked 10:15) expected: ${child2.expectedConsultationTime}`);

assert(child1.expectedConsultationTime >= '11:00', `Child 1 ETA ${child1.expectedConsultationTime} must be >= 11:00`);
assert(child2.expectedConsultationTime >= '11:15', `Child 2 ETA ${child2.expectedConsultationTime} must be >= 11:15`);
console.log('PASS: QT-D04 resolved (no waiting patient has past ETA).\n');

// ----------------------------------------------------
// TEST 2: QT-D01 - Consultation start time remains stable during polling
// ----------------------------------------------------
console.log('--- TEST 2: QT-D01: Consultation start time stability under polling ---');
state.config.simulatedTime = '10:00';
// Send child 1 to doctor at 10:00
schedulingService.sendToDoctor('test-appt-1');
assert.strictEqual(child1.consultationStartTime, '10:00', 'Start time should be 10:00 initially');

// Advance clock to 10:45 and simulate repeated doctor polling
state.config.simulatedTime = '10:45';
schedulingService.sendToDoctor('test-appt-1'); // Simulated polling call
assert.strictEqual(child1.consultationStartTime, '10:00', 'Start time must remain 10:00 after 10:45 poll');

// Advance clock to 10:50 and simulate repeated doctor polling
state.config.simulatedTime = '10:50';
schedulingService.sendToDoctor('test-appt-1'); // Another simulated poll
assert.strictEqual(child1.consultationStartTime, '10:00', 'Start time must remain 10:00 after 10:50 poll');

// Complete consultation at 10:50
schedulingService.completeConsultation('test-appt-1');
console.log(`Consultation completed: start=${child1.consultationStartTime}, end=${child1.consultationEndTime}, duration=${child1.consultationDurationMinutes}`);
assert.strictEqual(child1.consultationDurationMinutes, 50, 'Duration should reflect full 50 minutes (10:00 to 10:50)');
console.log('PASS: QT-D01 resolved (start time not overwritten, duration = 50 min).\n');

// ----------------------------------------------------
// TEST 3: Overrun formula (+5 inflation fix)
// ----------------------------------------------------
console.log('--- TEST 3: Overrun calculation does not artificially inflate by 5m ---');
session.currentDelayMinutes = 0; // Reset delay to test standalone 45m overrun
state.config.simulatedTime = '10:50';
schedulingService.sendToDoctor('test-appt-2'); // Starts at 10:50
state.config.simulatedTime = '11:35'; // 45 minutes elapsed on a 15m slot
schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', TEST_DATE);
// Overrun should be 45 - 15 = 30 minutes, not 35
console.log(`45 min consultation on 15m slot -> session.currentDelayMinutes = ${session.currentDelayMinutes}`);
assert.strictEqual(session.currentDelayMinutes, 30, 'Overrun should be exactly 30 minutes (not 35)');
console.log('PASS: Overrun formula correctly produces 30 minutes.\n');

// ----------------------------------------------------
// TEST 4: QT-D02 - Shorter consultations recover delay
// ----------------------------------------------------
console.log('--- TEST 4: QT-D02: Shorter consultations recover delay ---');
// Complete child 2 (at 11:35)
schedulingService.completeConsultation('test-appt-2');
session.currentDelayMinutes = 35; // Set starting delay to 35m as in test scenario

// Start child 3 at 11:35, complete in 10 minutes at 11:45 (saving 5 minutes vs 15m slot)
state.config.simulatedTime = '11:35';
schedulingService.sendToDoctor('test-appt-3');
state.config.simulatedTime = '11:45';
schedulingService.completeConsultation('test-appt-3');
console.log(`After 10m consultation (saved 5m): session.currentDelayMinutes = ${session.currentDelayMinutes}`);
assert.strictEqual(session.currentDelayMinutes, 30, 'Delay should have reduced from 35 to 30');

// Start child 4 at 11:45, complete in 10 minutes at 11:55 (saving 5 minutes vs 15m slot)
schedulingService.sendToDoctor('test-appt-4');
state.config.simulatedTime = '11:55';
schedulingService.completeConsultation('test-appt-4');
console.log(`After another 10m consultation (saved 5m): session.currentDelayMinutes = ${session.currentDelayMinutes}`);
assert.strictEqual(session.currentDelayMinutes, 25, 'Delay should have reduced from 30 to 25');
console.log('PASS: QT-D02 delay recovery works (35 -> 30 -> 25).\n');

// ----------------------------------------------------
// TEST 5: Free doctor at 11:30 gives next 11:30 patient immediate ETA
// ----------------------------------------------------
console.log('--- TEST 5: Free doctor availability for ready patient ---');
// Complete child 5 and child 6 so doctor is free at 11:30 for child 7 (booked 11:30)
state.appointments.find(a => a.id === 'test-appt-5')!.status = 'COMPLETED';
state.appointments.find(a => a.id === 'test-appt-6')!.status = 'COMPLETED';
state.config.simulatedTime = '11:30';
const child7 = state.appointments.find(a => a.id === 'test-appt-7')!; // booked 11:30
schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', TEST_DATE);
console.log(`Doctor free at 11:30. Child 7 (booked 11:30) expected consultation time: ${child7.expectedConsultationTime}`);
assert.strictEqual(child7.expectedConsultationTime, '11:30', 'Child 7 ETA must be 11:30 when doctor is free at 11:30');
console.log('PASS: Doctor free availability gives on-time ETA (11:30).\n');

// ----------------------------------------------------
// TEST 6: Next in queue flag
// ----------------------------------------------------
console.log('--- TEST 6: isNextInQueue flag ---');
const waitingAppts = state.appointments
  .filter(a => a.date === TEST_DATE && ['WAITING', 'ARRIVED', 'BOOKED', 'APPROACHING'].includes(a.status))
  .sort((a, b) => (a.positionInQueue || 0) - (b.positionInQueue || 0));

console.log(`First waiting patient: ${waitingAppts[0].childName}, positionInQueue=${waitingAppts[0].positionInQueue}, isNextInQueue=${waitingAppts[0].isNextInQueue}`);
assert.strictEqual(waitingAppts[0].isNextInQueue, true, 'First waiting patient must have isNextInQueue = true');
if (waitingAppts.length > 1) {
  console.log(`Second waiting patient: ${waitingAppts[1].childName}, positionInQueue=${waitingAppts[1].positionInQueue}, isNextInQueue=${waitingAppts[1].isNextInQueue}`);
  assert.strictEqual(waitingAppts[1].isNextInQueue, false, 'Subsequent patients must have isNextInQueue = false');
}
console.log('PASS: isNextInQueue flag correctly assigned.\n');

// ----------------------------------------------------
// TEST 7: RT-D01 - Manual doctor delay retained on fresh session
// ----------------------------------------------------
console.log('--- TEST 7: RT-D01: Manual doctor delay retained on fresh session ---');
const MANUAL_DELAY_DATE = '2026-10-06';
state.config.simulatedDate = MANUAL_DELAY_DATE;
state.config.simulatedTime = '10:00';
state.appointments = state.appointments.filter(a => a.date !== MANUAL_DELAY_DATE);
state.sessions = state.sessions.filter(s => s.date !== MANUAL_DELAY_DATE);

const freshSession = schedulingService.ensureDoctorSession('dr-subba-rao', 'kakinada', MANUAL_DELAY_DATE);
freshSession.currentDelayMinutes = 30; // 30 min delay applied via POST /api/simulation/doctor-delay

// Create 3 appointments on this fresh session
['10:00', '10:15', '10:30'].forEach((t, idx) => {
  state.appointments.push({
    id: `md-appt-${idx + 1}`,
    appointmentNumber: `SD-MD-${idx + 1}`,
    childId: `md-child-${idx + 1}`,
    childName: `MD Child ${idx + 1}`,
    parentId: `p-${idx + 1}`,
    parentName: `Parent ${idx + 1}`,
    parentMobile: `900009200${idx}`,
    doctorId: 'dr-subba-rao',
    doctorName: 'Dr. Subba Rao',
    branchId: 'kakinada',
    branchName: 'Main Branch - Kakinada',
    date: MANUAL_DELAY_DATE,
    bookedTime: t,
    expectedConsultationTime: t,
    recommendedArrivalTime: t,
    status: 'WAITING',
    paymentStatus: 'PAID',
    bookingSource: 'ONLINE',
    advanceNoticePreferenceMinutes: 30,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
});

schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', MANUAL_DELAY_DATE);
console.log(`Fresh session currentDelayMinutes after recalculation: ${freshSession.currentDelayMinutes}`);
assert.strictEqual(freshSession.currentDelayMinutes, 30, 'Manual delay of 30m must be retained');
const mdChild1 = state.appointments.find(a => a.id === 'md-appt-1')!;
const mdChild2 = state.appointments.find(a => a.id === 'md-appt-2')!;
console.log(`Child 1 ETA: ${mdChild1.expectedConsultationTime}, Child 2 ETA: ${mdChild2.expectedConsultationTime}`);
assert.strictEqual(mdChild1.expectedConsultationTime, '10:30', 'Child 1 expected time must be 10:30 (10:00 + 30m delay)');
assert.strictEqual(mdChild2.expectedConsultationTime, '10:45', 'Child 2 expected time must be 10:45 (10:15 + 30m delay)');

// Repeat with 20 min delay
freshSession.currentDelayMinutes = 20;
schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', MANUAL_DELAY_DATE);
assert.strictEqual(freshSession.currentDelayMinutes, 20, 'Manual delay of 20m must be retained');
assert.strictEqual(mdChild1.expectedConsultationTime, '10:20', 'Child 1 expected time must be 10:20 (10:00 + 20m delay)');
assert.strictEqual(mdChild2.expectedConsultationTime, '10:35', 'Child 2 expected time must be 10:35 (10:15 + 20m delay)');
console.log('PASS: RT-D01 manual delay retained and drives queue estimates.\n');

// ----------------------------------------------------
// TEST 8: RT-D02 - No-shows release slot capacity immediately
// ----------------------------------------------------
console.log('--- TEST 8: RT-D02: No-shows release slot capacity ---');
const NOSHOW_DATE = '2026-10-06';
state.config.simulatedDate = NOSHOW_DATE;
state.config.simulatedTime = '11:30';
state.appointments = state.appointments.filter(a => a.doctorId !== 'dr-prashant' || a.date !== NOSHOW_DATE);
state.sessions = state.sessions.filter(s => s.doctorId !== 'dr-prashant' || s.date !== NOSHOW_DATE);

const nsSession = schedulingService.ensureDoctorSession('dr-prashant', 'pithapuram', NOSHOW_DATE);
nsSession.actualStart = '11:00'; // Doctor started earlier and is now free at 11:30

// 3 checked-in children booked 11:00, 11:15, 11:30
['11:00', '11:15', '11:30'].forEach((t, idx) => {
  state.appointments.push({
    id: `ns-appt-${idx + 1}`,
    appointmentNumber: `SD-NS-${idx + 1}`,
    childId: `ns-child-${idx + 1}`,
    childName: `NS Child ${idx + 1}`,
    parentId: `p-${idx + 1}`,
    parentName: `Parent ${idx + 1}`,
    parentMobile: `900009300${idx}`,
    doctorId: 'dr-prashant',
    doctorName: 'Dr. Prashant',
    branchId: 'pithapuram',
    branchName: 'Pithapuram Branch',
    date: NOSHOW_DATE,
    bookedTime: t,
    expectedConsultationTime: t,
    recommendedArrivalTime: t,
    status: 'WAITING',
    paymentStatus: 'PAID',
    bookingSource: 'ONLINE',
    advanceNoticePreferenceMinutes: 30,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
});

schedulingService.recalculateSessionQueue('dr-prashant', 'pithapuram', NOSHOW_DATE);
const nsChild3 = state.appointments.find(a => a.id === 'ns-appt-3')!;
console.log(`Baseline child 3 ETA with 2 waiting ahead: ${nsChild3.expectedConsultationTime}`);
assert.strictEqual(nsChild3.expectedConsultationTime, '12:00', 'Child 3 should initially be 12:00 (11:30 + 15m + 15m)');

// Mark child 2 NO_SHOW
schedulingService.markNoShow('ns-appt-2');
console.log(`After marking child 2 NO_SHOW: child 3 ETA = ${nsChild3.expectedConsultationTime}`);
assert.strictEqual(nsChild3.expectedConsultationTime, '11:45', 'Child 3 should move to 11:45 after child 2 NO_SHOW');

// Mark child 1 NO_SHOW
schedulingService.markNoShow('ns-appt-1');
console.log(`After marking child 1 NO_SHOW: child 3 ETA = ${nsChild3.expectedConsultationTime}`);
assert.strictEqual(nsChild3.expectedConsultationTime, '11:30', 'Child 3 should be available at 11:30 with doctor free');
console.log('PASS: RT-D02 no-shows release slot capacity.\n');

// ----------------------------------------------------
// TEST 9: RT-D03 - Today clock does not shift tomorrow appointments
// ----------------------------------------------------
console.log('--- TEST 9: RT-D03: Tomorrow appointments independent of today clock ---');
const TODAY = '2026-10-06';
const TOMORROW = '2026-10-07';
state.config.simulatedDate = TODAY;
state.config.simulatedTime = '11:30';

state.appointments = state.appointments.filter(a => a.date !== TOMORROW);
state.sessions = state.sessions.filter(s => s.date !== TOMORROW);

schedulingService.ensureDoctorSession('dr-prashant', 'pithapuram', TOMORROW);

// Book 2 appointments for tomorrow at 10:00 and 10:15
['10:00', '10:15'].forEach((t, idx) => {
  state.appointments.push({
    id: `fut-appt-${idx + 1}`,
    appointmentNumber: `SD-FUT-${idx + 1}`,
    childId: `fut-child-${idx + 1}`,
    childName: `Future Child ${idx + 1}`,
    parentId: `p-${idx + 1}`,
    parentName: `Parent ${idx + 1}`,
    parentMobile: `900009400${idx}`,
    doctorId: 'dr-prashant',
    doctorName: 'Dr. Prashant',
    branchId: 'pithapuram',
    branchName: 'Pithapuram Branch',
    date: TOMORROW,
    bookedTime: t,
    expectedConsultationTime: t,
    recommendedArrivalTime: t,
    status: 'BOOKED',
    paymentStatus: 'PAID',
    bookingSource: 'ONLINE',
    advanceNoticePreferenceMinutes: 30,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
});

schedulingService.recalculateSessionQueue('dr-prashant', 'pithapuram', TOMORROW);
const futChild1 = state.appointments.find(a => a.id === 'fut-appt-1')!;
const futChild2 = state.appointments.find(a => a.id === 'fut-appt-2')!;

console.log(`Tomorrow Child 1 (booked 10:00) expected: ${futChild1.expectedConsultationTime}`);
console.log(`Tomorrow Child 2 (booked 10:15) expected: ${futChild2.expectedConsultationTime}`);
assert.strictEqual(futChild1.expectedConsultationTime, '10:00', 'Tomorrow child 1 must remain 10:00, not shifted by today 11:30');
assert.strictEqual(futChild2.expectedConsultationTime, '10:15', 'Tomorrow child 2 must remain 10:15, not shifted by today 11:30');
console.log('PASS: RT-D03 tomorrow appointments are independent of today clock.\n');

// Clean up
state.appointments = state.appointments.filter(a => a.date !== TEST_DATE && a.date !== MANUAL_DELAY_DATE && a.date !== TOMORROW);
state.sessions = state.sessions.filter(s => s.date !== TEST_DATE && s.date !== MANUAL_DELAY_DATE && s.date !== TOMORROW);
db.persistState();

console.log('=== ALL 9 TESTS PASSED SUCCESSFULLY! ===');
