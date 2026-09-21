import { Router } from 'express';
import { db } from './db.js';
import { schedulingService, timeToMinutes, minutesToTime } from './schedulingService.js';
import {
  BranchId,
  OperationalAnalytics,
  ChildAllergy,
  ChildCondition,
  PediatricGrowthRecord,
  PrescriptionItem,
  Prescription,
  Encounter,
  ClinicalCorrectionRequest,
} from '../src/types/index.js';
import { vaccinationService } from './vaccinationService.js';
import { IAP_2018_SCHEDULE_MASTER } from './vaccineScheduleData.js';
import {
  buildInstructionTexts,
  calculatePediatricGrowth,
  checkAllergyConflict,
  logClinicalAudit,
  FREQUENCY_TRANSLATIONS,
  TIMING_TRANSLATIONS,
  FORM_TRANSLATIONS,
} from './pediatricEmrService.js';

export const apiRouter = Router();

// --- PUBLIC & AUTH ENDPOINTS ---

// Public hospital info
apiRouter.get('/public/info', (req, res) => {
  const state = db.getState();
  res.json({
    doctors: state.doctors,
    branches: state.branches,
    schedules: state.schedules,
    gallery: state.gallery.filter((g) => g.active),
    reviews: state.reviews,
    config: state.config,
  });
});

apiRouter.get('/schedules', (req, res) => {
  const state = db.getState();
  res.json(state.schedules);
});

// Parent login (Mobile + Password)
apiRouter.post('/auth/parent-login', (req, res) => {
  const { mobile, password } = req.body;
  const state = db.getState();
  const trimmedMobile = String(mobile || '').trim();

  const parent = state.parents.find((p) => p.mobile === trimmedMobile);
  if (!parent) {
    return res.status(401).json({ success: false, message: 'Invalid mobile number or parent account not found.' });
  }

  const expectedPassword = state.parentPasswords[trimmedMobile] || 'Test@123';
  if (password !== expectedPassword) {
    return res.status(401).json({ success: false, message: 'Incorrect password. (Test password is: Test@123)' });
  }

  return res.json({
    success: true,
    parent,
  });
});

// Reception login (Username + Password)
apiRouter.post('/auth/reception-login', (req, res) => {
  const { username, password } = req.body;
  const state = db.getState();
  const trimmedUser = String(username || '').trim().toLowerCase();

  const user = state.receptionUsers.find((u) => u.username.toLowerCase() === trimmedUser);
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid reception credentials. (e.g. reception.kakinada / Reception@123)',
    });
  }

  return res.json({
    success: true,
    user: {
      username: user.username,
      name: user.name,
      branchId: user.branchId,
    },
  });
});

// --- DOCTORS & SCHEDULES ---

apiRouter.get('/doctors', (req, res) => {
  const state = db.getState();
  res.json(state.doctors);
});

apiRouter.get('/branches', (req, res) => {
  const state = db.getState();
  res.json(state.branches);
});

apiRouter.get('/gallery', (req, res) => {
  const state = db.getState();
  res.json(state.gallery.filter((g) => g.active));
});

apiRouter.get('/reviews', (req, res) => {
  const state = db.getState();
  res.json(state.reviews);
});

apiRouter.get('/simulation/config', (req, res) => {
  const state = db.getState();
  res.json(state.config);
});

apiRouter.get('/config', (req, res) => {
  const state = db.getState();
  res.json(state.config);
});

apiRouter.get('/doctors/:id/schedules', (req, res) => {
  const state = db.getState();
  const schedules = state.schedules.filter((s) => s.doctorId === req.params.id);
  res.json(schedules);
});

// Available slots for doctor on date and branch
apiRouter.get('/slots', (req, res) => {
  const { doctorId, branchId, date } = req.query;
  if (!doctorId || !branchId || !date) {
    return res.status(400).json({ error: 'doctorId, branchId, and date query params are required' });
  }

  const slots = schedulingService.getAvailableSlots(
    String(doctorId),
    String(branchId) as BranchId,
    String(date)
  );

  res.json(slots);
});

// --- APPOINTMENTS ---

// Get appointments (filtered by parentId, doctorId, branchId, date, mobile, q)
apiRouter.get('/appointments', (req, res) => {
  const { parentId, doctorId, branchId, date, mobile, q } = req.query;
  const state = db.getState();

  // Always keep today's sessions queue recalculated
  state.sessions.forEach((s) => {
    schedulingService.recalculateSessionQueue(s.doctorId, s.branchId, s.date);
  });

  let list = [...state.appointments];
  if (parentId) {
    list = list.filter((a) => a.parentId === parentId);
  }
  if (mobile) {
    const cleanMobile = String(mobile).replace(/\D/g, '');
    list = list.filter((a) => a.parentMobile.replace(/\D/g, '').includes(cleanMobile));
  }
  if (q) {
    const query = String(q).trim().toLowerCase();
    list = list.filter((a) =>
      a.parentMobile.includes(query) ||
      a.appointmentNumber.toLowerCase().includes(query) ||
      a.childName.toLowerCase().includes(query) ||
      a.doctorName.toLowerCase().includes(query)
    );
  }
  if (doctorId) {
    list = list.filter((a) => a.doctorId === doctorId);
  }
  if (branchId) {
    list = list.filter((a) => a.branchId === branchId);
  }
  if (date) {
    list = list.filter((a) => a.date === date);
  }

  // Sort by date and booked time
  list.sort((a, b) => a.date.localeCompare(b.date) || a.bookedTime.localeCompare(b.bookedTime));

  res.json(list);
});

// Dedicated Public Appointment Tracking Endpoint (by mobile number or token number)
apiRouter.get('/appointments/track', (req, res) => {
  const { mobile, token, q } = req.query;
  const state = db.getState();
  const searchInput = String(mobile || token || q || '').trim();

  if (!searchInput) {
    return res.status(400).json({ error: 'Please provide a mobile number or token number to track.' });
  }

  // Recalculate live doctor queue for today's active sessions
  state.sessions.forEach((s) => {
    schedulingService.recalculateSessionQueue(s.doctorId, s.branchId, s.date);
  });

  const cleanDigits = searchInput.replace(/\D/g, '');
  const searchLower = searchInput.toLowerCase();

  const matched = state.appointments.filter((a) => {
    const apptPhoneDigits = a.parentMobile.replace(/\D/g, '');
    const phoneMatch = cleanDigits.length >= 4 && apptPhoneDigits.includes(cleanDigits);
    const tokenMatch = a.appointmentNumber.toLowerCase().includes(searchLower);
    return phoneMatch || tokenMatch;
  });

  // Sort by date then booked time
  matched.sort((a, b) => a.date.localeCompare(b.date) || a.bookedTime.localeCompare(b.bookedTime));

  // Augment with today status & doctor delay metrics
  const enriched = matched.map((appt) => {
    const isToday = appt.date === state.config.simulatedDate;
    const session = state.sessions.find(
      (s) => s.doctorId === appt.doctorId && s.branchId === appt.branchId && s.date === appt.date
    );

    return {
      ...appt,
      isToday,
      currentDoctorDelayMinutes: isToday ? (session?.currentDelayMinutes ?? 0) : 0,
      sessionStatus: session?.status || 'NOT_STARTED',
      doctorActualStart: session?.actualStart,
    };
  });

  res.json({
    simulatedDate: state.config.simulatedDate,
    simulatedTime: state.config.simulatedTime,
    appointments: enriched,
  });
});

// Single appointment
apiRouter.get('/appointments/:id', (req, res) => {
  const state = db.getState();
  const appt = state.appointments.find((a) => a.id === req.params.id);
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // Recalculate
  schedulingService.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
  res.json(appt);
});

// Book appointment (Supports both registered parentId/childId OR direct quick booking with parentMobile & childName)
apiRouter.post('/appointments', (req, res) => {
  const {
    parentId,
    childId,
    parentName,
    parentMobile,
    childName,
    doctorId,
    branchId,
    date,
    bookedTime,
    bookingSource,
    advanceNoticePreferenceMinutes,
  } = req.body;

  const state = db.getState();
  let effectiveParentId = parentId;
  let effectiveChildId = childId;

  // If parentId is not provided, auto-create or find by mobile
  if (!effectiveParentId && parentMobile) {
    const trimmedMobile = String(parentMobile).trim();
    let parent = state.parents.find((p) => p.mobile === trimmedMobile);
    if (!parent) {
      parent = {
        id: `p-${Date.now()}`,
        name: (parentName || 'Parent / Guardian').trim(),
        mobile: trimmedMobile,
        children: [],
      };
      state.parents.push(parent);
      state.parentPasswords[trimmedMobile] = 'Test@123';
    } else if (parentName && parentName.trim()) {
      parent.name = parentName.trim();
    }

    effectiveParentId = parent.id;

    // Find or add child
    const trimmedChild = (childName || 'Child').trim();
    let child = parent.children.find((c) => c.name.toLowerCase() === trimmedChild.toLowerCase());
    if (!child) {
      child = {
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        parentId: parent.id,
        name: trimmedChild,
        gender: 'Boy',
      };
      parent.children.push(child);
    }
    effectiveChildId = child.id;
  } else if (effectiveParentId && !effectiveChildId && childName) {
    const parent = state.parents.find((p) => p.id === effectiveParentId);
    if (parent) {
      const trimmedChild = childName.trim();
      let child = parent.children.find((c) => c.name.toLowerCase() === trimmedChild.toLowerCase());
      if (!child) {
        child = {
          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          parentId: parent.id,
          name: trimmedChild,
          gender: 'Boy',
        };
        parent.children.push(child);
      }
      effectiveChildId = child.id;
    }
  }

  // Check if parent is blocked due to consecutive no-shows
  const parentRecord = state.parents.find(
    (p) => p.id === effectiveParentId || (parentMobile && p.mobile === String(parentMobile).trim())
  );
  if (parentRecord && parentRecord.isBlocked) {
    return res.status(403).json({
      success: false,
      isBlocked: true,
      message: "As you didn't respect your appointment slot, we are temporarily blocking your appointment booking. Please contact hospital reception to resolve this.",
      parentName: parentRecord.name,
      consecutiveNoShows: parentRecord.consecutiveNoShows || 3,
    });
  }

  const result = schedulingService.bookAppointment({
    parentId: effectiveParentId,
    childId: effectiveChildId,
    doctorId,
    branchId,
    date,
    bookedTime,
    bookingSource: bookingSource || 'ONLINE',
    advanceNoticePreferenceMinutes: advanceNoticePreferenceMinutes || 30,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  const parent = state.parents.find((p) => p.id === effectiveParentId);
  db.persistState();
  res.status(201).json({ ...result, parent });
});

// Reschedule appointment
apiRouter.put('/appointments/:id/reschedule', (req, res) => {
  const { newBookedTime, newDate } = req.body;
  const result = schedulingService.rescheduleAppointment(req.params.id, newBookedTime, newDate);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// --- PARENTS & CHILDREN MANAGEMENT ---

apiRouter.get('/parents', (_req, res) => {
  const state = db.getState();
  res.json(state.parents);
});

apiRouter.get('/parents/search', (req, res) => {
  const { mobile } = req.query;
  const state = db.getState();
  const parent = state.parents.find((p) => p.mobile === String(mobile || '').trim());
  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }
  res.json(parent);
});

// Check if a patient / parent is blocked from booking appointments
apiRouter.get('/parents/booking-status', (req, res) => {
  const { mobile, parentId } = req.query;
  const state = db.getState();
  const cleanMobile = mobile ? String(mobile).trim().replace(/\D/g, '') : '';
  const parent = state.parents.find(
    (p) =>
      (parentId && p.id === parentId) ||
      (cleanMobile && p.mobile.replace(/\D/g, '') === cleanMobile)
  );

  if (!parent) {
    return res.json({
      isBlocked: false,
      consecutiveNoShows: 0,
      exists: false,
    });
  }

  res.json({
    exists: true,
    parentId: parent.id,
    parentName: parent.name,
    parentMobile: parent.mobile,
    isBlocked: Boolean(parent.isBlocked),
    consecutiveNoShows: parent.consecutiveNoShows || 0,
    blockedReason: parent.blockedReason,
    blockedAt: parent.blockedAt,
  });
});

apiRouter.post('/parents', (req, res) => {
  const { name, mobile, childName, gender, ageYears } = req.body;
  const state = db.getState();
  const trimmedMobile = String(mobile || '').trim();

  let parent = state.parents.find((p) => p.mobile === trimmedMobile);
  if (parent) {
    // If child provided and not in parent list, add child
    if (childName) {
      const newChild = {
        id: `c-${Date.now()}`,
        parentId: parent.id,
        name: childName.trim(),
        gender: gender || 'Boy',
        ageYears: ageYears ? Number(ageYears) : undefined,
      };
      parent.children.push(newChild);
    }
  } else {
    parent = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      mobile: trimmedMobile,
      children: [
        {
          id: `c-${Date.now()}`,
          parentId: `p-${Date.now()}`,
          name: childName ? childName.trim() : 'Child',
          gender: gender || 'Boy',
          ageYears: ageYears ? Number(ageYears) : undefined,
        },
      ],
    };
    state.parents.push(parent);
    state.parentPasswords[trimmedMobile] = 'Test@123';
  }

  db.persistState();
  res.json({ success: true, parent });
});

apiRouter.post('/parents/:id/children', (req, res) => {
  const { name, gender, ageYears } = req.body;
  const state = db.getState();
  const parent = state.parents.find((p) => p.id === req.params.id);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const newChild = {
    id: `c-${Date.now()}`,
    parentId: parent.id,
    name: name.trim(),
    gender: gender || 'Boy',
    ageYears: ageYears ? Number(ageYears) : undefined,
  };
  parent.children.push(newChild);
  db.persistState();

  res.json({ success: true, child: newChild, parent });
});

apiRouter.put('/parents/:parentId/children/:childId', (req, res) => {
  const { name } = req.body;
  const state = db.getState();
  const parent = state.parents.find((p) => p.id === req.params.parentId);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const child = parent.children.find((c) => c.id === req.params.childId);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  child.name = name.trim();
  res.json({ success: true, child });
});

// --- RECEPTION ACTIONS ---

apiRouter.post('/reception/check-in', (req, res) => {
  const { appointmentId, paymentMethod, heightCm, weightKg, temperatureF, pulseRate } = req.body;
  const result = schedulingService.checkInPaymentReceived(appointmentId, paymentMethod);
  if (result.success && (heightCm || weightKg || temperatureF || pulseRate)) {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (appt) {
      if (heightCm) appt.heightCm = Number(heightCm);
      if (weightKg) appt.weightKg = Number(weightKg);
      if (temperatureF) appt.temperatureF = Number(temperatureF);
      if (pulseRate) appt.pulseRate = Number(pulseRate);
      if (heightCm && weightKg) {
        const hM = Number(heightCm) / 100;
        appt.pediatricBmi = Number((Number(weightKg) / (hM * hM)).toFixed(1));

        // Find child for growth entry
        const child = state.parents.flatMap((p) => p.children).find((c) => c.id === appt.childId);
        const growth = calculatePediatricGrowth({
          childId: appt.childId,
          ageYears: child?.ageYears || 3,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          recordedByRole: 'RECEPTIONIST',
          recordedByName: 'Reception Triage Desk',
          notes: 'Recorded during arrival triage check-in',
        });
        state.growthRecords.push(growth);
      }
      db.persistState();
    }
  }
  res.json(result);
});

apiRouter.post('/reception/send-to-doctor', (req, res) => {
  const { appointmentId } = req.body;
  const result = schedulingService.sendToDoctor(appointmentId);
  res.json(result);
});

apiRouter.post('/reception/complete', (req, res) => {
  const { appointmentId } = req.body;
  const result = schedulingService.completeConsultation(appointmentId);
  res.json(result);
});

apiRouter.post('/reception/mark-late', (req, res) => {
  const { appointmentId } = req.body;
  const result = schedulingService.markLate(appointmentId);
  res.json(result);
});

apiRouter.post('/reception/reassign', (req, res) => {
  const { appointmentId, newExpectedTime } = req.body;
  const result = schedulingService.reassignPosition(appointmentId, newExpectedTime);
  res.json(result);
});

apiRouter.post('/reception/emergency', (req, res) => {
  const result = schedulingService.insertEmergencyAdjustment(req.body);
  res.json(result);
});

apiRouter.post('/reception/no-show', (req, res) => {
  const { appointmentId } = req.body;
  const result = schedulingService.markNoShow(appointmentId);
  res.json(result);
});

// Reception: Get all restricted or no-show parents
apiRouter.get('/reception/blocked-parents', (_req, res) => {
  const state = db.getState();
  const list = state.parents
    .filter((p) => p.isBlocked || (p.consecutiveNoShows && p.consecutiveNoShows > 0))
    .map((p) => {
      // Find past no-show appointments for this parent
      const missedAppointments = state.appointments
        .filter((a) => (a.parentId === p.id || a.parentMobile === p.mobile) && a.status === 'NO_SHOW')
        .map((a) => ({
          id: a.id,
          appointmentNumber: a.appointmentNumber,
          date: a.date,
          bookedTime: a.bookedTime,
          doctorName: a.doctorName,
          branchName: a.branchName,
          childName: a.childName,
        }));

      return {
        ...p,
        missedAppointments,
      };
    });

  res.json(list);
});

// Reception: Re-enable booking with parent's justification
apiRouter.post('/reception/unblock-patient', (req, res) => {
  const { parentId, mobile, justification, receptionistName } = req.body;
  const result = schedulingService.unblockPatient({
    parentId,
    mobile,
    justification,
    receptionistName,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

apiRouter.post('/reception/cancel-session', (req, res) => {
  const { doctorId, branchId, reason } = req.body;
  const result = schedulingService.cancelDoctorSession(doctorId, branchId, reason);
  res.json(result);
});

// Live Queue for doctor & branch
apiRouter.get('/queue/live', (req, res) => {
  const { doctorId, branchId, date } = req.query;
  const state = db.getState();
  const isAllDates = date === 'all';
  const targetDate = isAllDates ? '' : String(date || state.config.simulatedDate);
  const isAllDoctors = !doctorId || doctorId === 'all';

  if (!isAllDoctors && branchId && targetDate) {
    schedulingService.ensureDoctorSession(String(doctorId), String(branchId) as BranchId, targetDate);
    schedulingService.recalculateSessionQueue(String(doctorId), String(branchId) as BranchId, targetDate);
  } else if (isAllDoctors && branchId && targetDate) {
    state.doctors.forEach((d) => {
      schedulingService.ensureDoctorSession(d.id, String(branchId) as BranchId, targetDate);
      schedulingService.recalculateSessionQueue(d.id, String(branchId) as BranchId, targetDate);
    });
  }

  let session = isAllDoctors
    ? state.sessions.find((s) => s.branchId === branchId && s.date === (targetDate || state.config.simulatedDate))
    : state.sessions.find(
        (s) => s.doctorId === doctorId && s.branchId === branchId && s.date === (targetDate || state.config.simulatedDate)
      );

  if (!session && branchId) {
    const defaultDocId = isAllDoctors ? (state.doctors[0]?.id || 'dr-subba-rao') : String(doctorId);
    session = schedulingService.ensureDoctorSession(
      defaultDocId,
      branchId as BranchId,
      targetDate || state.config.simulatedDate
    );
  }

  const appointments = state.appointments
    .filter(
      (a) =>
        (isAllDoctors || a.doctorId === doctorId) &&
        (!branchId || a.branchId === branchId) &&
        (isAllDates || a.date === targetDate) &&
        a.status !== 'RESCHEDULED'
    )
    .sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime));

  const currentPatient = appointments.find((a) => a.status === 'WITH_DOCTOR');
  const waitingPatients = appointments.filter((a) => a.status === 'WAITING' || a.status === 'ARRIVED');
  const upcomingPatients = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'APPROACHING');
  const completedPatients = appointments.filter((a) => a.status === 'COMPLETED');

  res.json({
    session,
    currentPatient,
    nextPatient: waitingPatients[0] || upcomingPatients[0] || null,
    waitingCount: waitingPatients.length,
    remainingCount: waitingPatients.length + upcomingPatients.length + (currentPatient ? 1 : 0),
    completedCount: completedPatients.length,
    appointments,
    simulatedTime: state.config.simulatedTime,
    simulatedDate: state.config.simulatedDate,
  });
});

// Notifications for parent
apiRouter.get('/notifications', (req, res) => {
  const { parentId } = req.query;
  const state = db.getState();
  const list = state.notifications.filter((n) => !parentId || n.parentId === parentId);
  res.json(list);
});

apiRouter.post('/notifications/:id/read', (req, res) => {
  const state = db.getState();
  const notif = state.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// --- OPERATIONAL ANALYTICS ---

apiRouter.get('/analytics', (req, res) => {
  const state = db.getState();
  const total = state.appointments.length;
  const online = state.appointments.filter((a) => a.bookingSource === 'ONLINE').length;
  const reception = state.appointments.filter((a) => a.bookingSource === 'RECEPTION_PHONE').length;
  const completed = state.appointments.filter((a) => a.status === 'COMPLETED').length;
  const late = state.appointments.filter((a) => a.status === 'LATE').length;
  const noShows = state.appointments.filter((a) => a.status === 'NO_SHOW').length;

  const completedWithDur = state.appointments.filter((a) => a.consultationDurationMinutes);
  const avgDuration =
    completedWithDur.length > 0
      ? Math.round(
          completedWithDur.reduce((acc, a) => acc + (a.consultationDurationMinutes || 14), 0) /
            completedWithDur.length
        )
      : 14;

  const earlierTreatments = state.appointments.filter((a) => {
    if (a.status === 'COMPLETED' && a.consultationStartTime) {
      return timeToMinutes(a.consultationStartTime) < timeToMinutes(a.bookedTime);
    }
    return false;
  }).length;

  const activeSessions = state.sessions;
  const avgDelay =
    activeSessions.length > 0
      ? Math.round(activeSessions.reduce((acc, s) => acc + s.currentDelayMinutes, 0) / activeSessions.length)
      : 8;

  const cashPayments = state.appointments.filter(
    (a) => a.paymentMethod === 'CASH' || (a.paymentStatus === 'PAID' && !a.paymentMethod)
  ).length;
  const phonePePayments = state.appointments.filter((a) => a.paymentMethod === 'PHONEPE').length;

  const analytics: OperationalAnalytics = {
    totalAppointments: total,
    onlineBookings: online,
    receptionBookings: reception,
    completedConsultations: completed,
    lateArrivals: late,
    noShows: noShows,
    averageConsultationDurationMinutes: avgDuration,
    averageParentWaitingTimeMinutes: 11, // Parents wait on average only 11 mins physical hospital time!
    averageDoctorStartDelayMinutes: 8,
    bufferMinutesUsed: 15,
    emergencyAdjustments: state.appointments.filter((a) => a.isEmergency).length,
    appointmentsTreatedEarlierThanBooked: earlierTreatments || 1,
    averageScheduleDelayMinutes: avgDelay,
    cashPayments,
    phonePePayments,
  };

  res.json(analytics);
});

// --- SIMULATION / DEVELOPMENT CONTROLS ---

apiRouter.get('/simulation/state', (req, res) => {
  const state = db.getState();
  res.json({
    simulatedTime: state.config.simulatedTime,
    simulatedDate: state.config.simulatedDate,
    config: state.config,
    sessions: state.sessions,
  });
});

apiRouter.post('/simulation/advance-time', (req, res) => {
  const { minutes, targetTime } = req.body;
  const state = db.getState();

  if (targetTime) {
    state.config.simulatedTime = targetTime;
  } else if (minutes) {
    const currentMin = timeToMinutes(state.config.simulatedTime);
    state.config.simulatedTime = minutesToTime(currentMin + Number(minutes));
  }

  // Recalculate all active doctor sessions
  state.sessions.forEach((s) => {
    schedulingService.recalculateSessionQueue(s.doctorId, s.branchId, s.date);
  });

  db.persistState();
  res.json({ success: true, newTime: state.config.simulatedTime, config: state.config });
});

apiRouter.post('/simulation/doctor-delay', (req, res) => {
  const { doctorId, branchId, delayMinutes } = req.body;
  const state = db.getState();
  const session = state.sessions.find(
    (s) => s.doctorId === doctorId && s.branchId === branchId && s.date === state.config.simulatedDate
  );

  if (session) {
    session.currentDelayMinutes = Number(delayMinutes);
    schedulingService.recalculateSessionQueue(doctorId, branchId, state.config.simulatedDate);
    db.persistState();
  }

  res.json({ success: true, currentDelay: session?.currentDelayMinutes, config: state.config });
});

apiRouter.post('/simulation/trigger-scenario', (req, res) => {
  const { scenarioId } = req.body;
  const state = db.getState();
  const today = state.config.simulatedDate;

  switch (scenarioId) {
    case 'doctor-late-15': {
      const session = state.sessions.find((s) => s.doctorId === 'dr-subba-rao');
      if (session) {
        session.currentDelayMinutes = 15;
        session.actualStart = '10:15';
        schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', today);
      }
      break;
    }
    case 'doctor-ahead-10': {
      const session = state.sessions.find((s) => s.doctorId === 'dr-subba-rao');
      if (session) {
        session.currentDelayMinutes = -10;
        schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', today);
      }
      break;
    }
    case 'long-consultation-30': {
      const session = state.sessions.find((s) => s.doctorId === 'dr-subba-rao');
      if (session) {
        session.currentDelayMinutes += 15;
        schedulingService.recalculateSessionQueue('dr-subba-rao', 'kakinada', today);
      }
      break;
    }
    case 'emergency-patient': {
      schedulingService.insertEmergencyAdjustment({
        doctorId: 'dr-subba-rao',
        branchId: 'kakinada',
        childName: 'Baby Aryan (Emergency High Fever)',
        parentName: 'Ramesh Reddy',
        parentMobile: '9848012345',
      });
      break;
    }
    case 'patient-late-reassign': {
      const appt = state.appointments.find((a) => a.id === 'apt-3');
      if (appt) {
        schedulingService.markLate(appt.id);
        schedulingService.reassignPosition(appt.id, '10:55');
      }
      break;
    }
    case 'patient-no-show': {
      const appt = state.appointments.find((a) => a.id === 'apt-4');
      if (appt) {
        schedulingService.markNoShow(appt.id);
      }
      break;
    }
    case 'consecutive-3-no-shows': {
      const appt = state.appointments.find((a) => a.id === 'apt-6') || state.appointments.find((a) => a.parentId === 'p6');
      if (appt) {
        schedulingService.markNoShow(appt.id);
      } else {
        const parent = state.parents.find((p) => p.id === 'p6' || p.mobile === '9000000006');
        if (parent) {
          parent.consecutiveNoShows = 3;
          parent.isBlocked = true;
          parent.blockedReason = "As you didn't respect your appointment slot, we are temporarily blocking your appointment booking.";
          parent.blockedAt = `${state.config.simulatedDate} ${state.config.simulatedTime}`;
        }
      }
      break;
    }
    case 'reset-database': {
      db.resetToSeed();
      break;
    }
  }

  if (scenarioId !== 'reset-database') {
    db.persistState();
  }

  res.json({ success: true, scenarioId, config: state.config });
});

// Set simulated date
apiRouter.post('/simulation/set-date', (req, res) => {
  const { date } = req.body;
  const state = db.getState();
  if (date) {
    state.config.simulatedDate = String(date);
    schedulingService.ensureDoctorSessionsForDate(String(date));
    state.sessions.forEach((s) => {
      schedulingService.recalculateSessionQueue(s.doctorId, s.branchId, s.date);
    });
    db.persistState();
  }
  res.json({ success: true, newDate: state.config.simulatedDate, config: state.config });
});

// Update system configuration
apiRouter.put('/config', (req, res) => {
  const state = db.getState();
  Object.assign(state.config, req.body);
  if (req.body.simulatedDate) {
    schedulingService.ensureDoctorSessionsForDate(String(req.body.simulatedDate));
    state.sessions.forEach((s) => {
      schedulingService.recalculateSessionQueue(s.doctorId, s.branchId, s.date);
    });
  }
  db.persistState();
  res.json({ success: true, config: state.config });
});

// ==========================================
// VACCINATION SYSTEM ENDPOINTS (IAP 2018)
// ==========================================

// Master reference chart
apiRouter.get('/vaccinations/schedule-master', (_req, res) => {
  res.json({
    standard: 'IAP 2018',
    title: 'Immunization Table of IAP 2018 (Indian Academy of Pediatrics)',
    milestones: IAP_2018_SCHEDULE_MASTER,
  });
});

// Get vaccination program by child ID
apiRouter.get('/vaccinations/child/:childId', (req, res) => {
  const program = vaccinationService.getProgramByChildId(req.params.childId);
  if (!program) {
    return res.status(404).json({ success: false, message: 'Vaccination program not found for this child.' });
  }
  res.json({ success: true, program });
});

// Get vaccination programs for a parent's children
apiRouter.get('/vaccinations/parent/:parentId', (req, res) => {
  const programs = vaccinationService.getProgramsByParentId(req.params.parentId);
  res.json({ success: true, programs });
});

// Reception: Register a child for vaccination
apiRouter.post('/vaccinations/register', (req, res) => {
  try {
    const {
      childId,
      parentId,
      firstVaccineDate,
      firstMilestoneId,
      branchId,
      registeredBy,
      paymentAmount,
      paymentReceiptNo,
      notes,
    } = req.body;

    if (!childId || !parentId || !firstVaccineDate || !firstMilestoneId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: childId, parentId, firstVaccineDate, and firstMilestoneId are required.',
      });
    }

    const program = vaccinationService.registerChild({
      childId,
      parentId,
      firstVaccineDate,
      firstMilestoneId,
      branchId: branchId || 'kakinada',
      registeredBy: registeredBy || 'Reception Desk',
      paymentAmount: Number(paymentAmount) || 1500,
      paymentReceiptNo: paymentReceiptNo || `REC-VAC-${Date.now().toString().slice(-6)}`,
      notes,
    });

    res.status(201).json({
      success: true,
      message: `${program.childName} successfully enrolled into IAP 2018 Vaccination Program!`,
      program,
    });
  } catch (err: any) {
    console.error('Vaccination registration error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to register child for vaccination.' });
  }
});

// Administer / mark a vaccine dose as completed
apiRouter.put('/vaccinations/doses/:doseId/administer', (req, res) => {
  try {
    const { doseId } = req.params;
    const { administeredDate, batchNumber, administeredBy, branchId, notes } = req.body;

    const updatedProgram = vaccinationService.markDoseGiven({
      doseId,
      administeredDate,
      batchNumber,
      administeredBy,
      branchId,
      notes,
    });

    res.json({
      success: true,
      message: 'Vaccination dose successfully recorded as administered.',
      program: updatedProgram,
    });
  } catch (err: any) {
    console.error('Vaccine dose administration error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to administer vaccine dose.' });
  }
});

// Reception: 15-day upcoming reminder list (plus overdue)
apiRouter.get('/vaccinations/reception/due-reminders', (req, res) => {
  try {
    const daysAhead = req.query.days ? parseInt(String(req.query.days), 10) : 15;
    const reminders = vaccinationService.getUpcomingDueReminders(daysAhead);
    res.json({
      success: true,
      daysAhead,
      count: reminders.length,
      reminders,
    });
  } catch (err: any) {
    console.error('Error fetching vaccine due reminders:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch reminders.' });
  }
});

// Reception: Log a reminder call to a parent
apiRouter.post('/vaccinations/reception/call-log', (req, res) => {
  try {
    const { programId, doseId, calledBy, callOutcome, parentFeedback, nextFollowUpDate } = req.body;

    if (!programId || !doseId || !callOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: programId, doseId, and callOutcome are required.',
      });
    }

    const log = vaccinationService.logReminderCall({
      programId,
      doseId,
      calledBy: calledBy || 'Reception Desk',
      callOutcome,
      parentFeedback,
      nextFollowUpDate,
    });

    res.status(201).json({
      success: true,
      message: 'Reminder call logged successfully.',
      log,
    });
  } catch (err: any) {
    console.error('Error logging reminder call:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to log reminder call.' });
  }
});

// ==========================================
// --- PEDIATRIC EMR & CLINICAL ENDPOINTS ---
// ==========================================

// Helper: authenticate doctor token
function getDoctorAuth(req: any) {
  const token = req.headers['x-doctor-token'] || req.query.token;
  if (!token) return null;
  const state = db.getState();
  const session = state.doctorSessionsAuth?.find((s) => s.token === token);
  if (!session) return null;
  const doctor = state.doctors.find((d) => d.id === session.doctorId);
  const account = state.doctorAccounts.find((a) => a.doctorId === session.doctorId);
  return { doctor, account, token };
}

// 1. Doctor Login
apiRouter.post('/auth/doctor-login', (req, res) => {
  const { loginId, password } = req.body;
  const state = db.getState();
  const cleanId = String(loginId || '').trim();

  if (!cleanId || !password) {
    return res.status(400).json({ success: false, message: 'Please provide doctor identifier and password.' });
  }

  const account = state.doctorAccounts.find(
    (a) =>
      a.doctorId === cleanId ||
      a.mobile === cleanId ||
      a.email?.toLowerCase() === cleanId.toLowerCase() ||
      a.medicalRegistrationNo?.toLowerCase() === cleanId.toLowerCase()
  );

  if (!account) {
    return res.status(401).json({
      success: false,
      message: 'Doctor account not found. Please verify your Mobile, Registration No, or Doctor ID.',
    });
  }

  const isApproved = account.isApproved || account.status === 'APPROVED';
  if (!isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Doctor account is pending hospital administrator approval or has been suspended.',
    });
  }

  const expectedPassword = state.doctorPasswords[account.doctorId] || 'Doctor@123';
  if (password !== expectedPassword) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect doctor password. (Pilot test password: Doctor@123)',
    });
  }

  // Create session token
  const token = `doc_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  account.lastLoginAt = new Date().toISOString();

  if (!state.doctorSessionsAuth) {
    state.doctorSessionsAuth = [];
  }
  state.doctorSessionsAuth.push({ token, doctorId: account.doctorId, expiresAt });
  db.persistState();

  const doctor = state.doctors.find((d) => d.id === account.doctorId);

  res.json({
    success: true,
    token,
    account: {
      id: account.id,
      doctorId: account.doctorId,
      fullName: account.fullName,
      email: account.email,
      mobile: account.mobile,
      medicalRegistrationNo: account.medicalRegistrationNo,
      specialization: account.specialization,
      primaryBranchId: account.primaryBranchId,
      status: account.status,
      digitalSignatureUrl: account.digitalSignatureUrl,
    },
    doctor,
  });
});

// 2. Doctor Logout
apiRouter.post('/auth/doctor-logout', (req, res) => {
  const token = req.headers['x-doctor-token'] || req.body.token;
  if (token) {
    const state = db.getState();
    state.doctorSessionsAuth = state.doctorSessionsAuth.filter((s) => s.token !== token);
    db.persistState();
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 3. Current Doctor Profile
apiRouter.get('/doctor/me', (req, res) => {
  const auth = getDoctorAuth(req);
  if (!auth) {
    return res.status(401).json({ success: false, message: 'Doctor session expired or invalid.' });
  }
  res.json({
    success: true,
    account: auth.account,
    doctor: auth.doctor,
  });
});

// 4. Doctor Live Queue with Clinical Summaries
apiRouter.get('/doctor/queue', (req, res) => {
  const { doctorId, branchId, date } = req.query;
  const state = db.getState();
  const targetDoctorId = String(doctorId || state.doctors[0]?.id || 'dr-subba-rao');
  const targetBranchId = (branchId as BranchId) || 'kakinada';
  const targetDate = String(date || state.config.simulatedDate);

  schedulingService.ensureDoctorSession(targetDoctorId, targetBranchId, targetDate);
  schedulingService.recalculateSessionQueue(targetDoctorId, targetBranchId, targetDate);

  const session = state.sessions.find(
    (s) => s.doctorId === targetDoctorId && s.branchId === targetBranchId && s.date === targetDate
  );

  const appointments = state.appointments
    .filter((a) => a.doctorId === targetDoctorId && a.branchId === targetBranchId && a.date === targetDate)
    .sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime));

  // Enrich appointments with clinical EMR highlights (permanent Child ID, active allergies count, active conditions)
  const allChildren = state.parents.flatMap((p) => p.children);
  const enrichedAppointments = appointments.map((appt) => {
    const child = allChildren.find((c) => c.id === appt.childId);
    const activeAllergies = state.allergies.filter((al) => al.childId === appt.childId && al.status === 'ACTIVE');
    const activeConditions = state.conditions.filter((co) => co.childId === appt.childId && co.status !== 'RESOLVED');
    const existingEncounter = state.encounters.find((e) => e.appointmentId === appt.id);

    return {
      ...appt,
      childPermanentId: child?.permanentId || 'DM-SDCH-000101',
      childAge: child?.ageYears,
      childGender: child?.gender,
      bloodGroup: child?.bloodGroup,
      criticalAllergyCount: activeAllergies.length,
      activeAllergies: activeAllergies.map((a) => `${a.substance} (${a.severity})`),
      chronicConditions: activeConditions.map((c) => c.conditionName),
      hasActiveEncounter: Boolean(existingEncounter && existingEncounter.status === 'IN_PROGRESS'),
      encounterId: existingEncounter?.id,
    };
  });

  const currentPatient = enrichedAppointments.find((a) => a.status === 'WITH_DOCTOR');
  const waitingPatients = enrichedAppointments.filter((a) => a.status === 'WAITING' || a.status === 'ARRIVED');
  const upcomingPatients = enrichedAppointments.filter((a) => a.status === 'BOOKED' || a.status === 'APPROACHING');
  const completedPatients = enrichedAppointments.filter((a) => a.status === 'COMPLETED');

  res.json({
    success: true,
    session,
    currentPatient: currentPatient || null,
    nextPatient: waitingPatients[0] || upcomingPatients[0] || null,
    waitingPatients,
    upcomingPatients,
    completedPatients,
    allAppointments: enrichedAppointments,
    counts: {
      waiting: waitingPatients.length,
      upcoming: upcomingPatients.length,
      completed: completedPatients.length,
      total: enrichedAppointments.length,
    },
    simulatedDate: state.config.simulatedDate,
    simulatedTime: state.config.simulatedTime,
  });
});

// 5. EMR Child Search (by Child ID, Mobile, Name)
apiRouter.get('/emr/children/search', (req, res) => {
  const { q } = req.query;
  const state = db.getState();
  const query = String(q || '').trim().toLowerCase();

  const results: any[] = [];
  state.parents.forEach((parent) => {
    parent.children.forEach((child) => {
      const matchPermanentId = child.permanentId?.toLowerCase().includes(query);
      const matchChildName = child.name.toLowerCase().includes(query);
      const matchParentName = parent.name.toLowerCase().includes(query);
      const matchParentMobile = parent.mobile.includes(query);

      if (!query || matchPermanentId || matchChildName || matchParentName || matchParentMobile) {
        const allergies = state.allergies.filter((a) => a.childId === child.id && a.status === 'ACTIVE');
        const conditions = state.conditions.filter((c) => c.childId === child.id && c.status !== 'RESOLVED');

        results.push({
          childId: child.id,
          childName: child.name,
          permanentId: child.permanentId || `DM-SDCH-000101`,
          dateOfBirth: child.dateOfBirth,
          ageYears: child.ageYears,
          gender: child.gender,
          bloodGroup: child.bloodGroup || 'B+',
          parentId: parent.id,
          parentName: parent.name,
          parentMobile: parent.mobile,
          activeAllergyCount: allergies.length,
          activeConditionCount: conditions.length,
          allergies: allergies.map((a) => a.substance),
        });
      }
    });
  });

  res.json({ success: true, count: results.length, children: results.slice(0, 30) });
});

// 6. Comprehensive Child EMR Profile & Clinical History
apiRouter.get('/emr/children/:childId', (req, res) => {
  const { childId } = req.params;
  const state = db.getState();

  let matchedParent: any = null;
  let matchedChild: any = null;

  for (const parent of state.parents) {
    const ch = parent.children.find((c) => c.id === childId || c.permanentId === childId);
    if (ch) {
      matchedParent = parent;
      matchedChild = ch;
      break;
    }
  }

  if (!matchedChild) {
    return res.status(404).json({ success: false, message: 'Child medical record not found.' });
  }

  const effectiveChildId = matchedChild.id;

  // Allergies & Conditions
  const allergies = state.allergies.filter((a) => a.childId === effectiveChildId);
  const conditions = state.conditions.filter((c) => c.childId === effectiveChildId);

  // Critical alerts banner
  const activeAllergies = allergies.filter((a) => a.status === 'ACTIVE');
  const activeConditions = conditions.filter((c) => c.status !== 'RESOLVED');

  const alerts: any[] = [];
  activeAllergies.forEach((al) => {
    alerts.push({
      id: `alert-${al.id}`,
      childId: effectiveChildId,
      alertType: 'CRITICAL_ALLERGY',
      title: `ALLERGY: ${al.substance.toUpperCase()}`,
      description: `Reaction: ${al.reaction}. Severity: ${al.severity}. Verified by ${al.doctorName}.`,
      severity: al.severity === 'SEVERE' || al.severity === 'LIFE_THREATENING' ? 'HIGH' : 'MEDIUM',
      doctorId: al.doctorId,
      createdAt: al.createdAt,
    });
  });

  activeConditions.forEach((co) => {
    alerts.push({
      id: `alert-${co.id}`,
      childId: effectiveChildId,
      alertType: 'CHRONIC_CONDITION',
      title: `CONDITION: ${co.conditionName.toUpperCase()}`,
      description: `Category: ${co.category}. Status: ${co.status}. Follow-up: ${co.followUpRecommendation || 'Routine monitoring'}.`,
      severity: co.status === 'ACTIVE' || co.status === 'RECURRING' ? 'HIGH' : 'MEDIUM',
      doctorId: co.doctorId,
      createdAt: co.createdAt,
    });
  });

  // Growth Records
  const growthRecords = state.growthRecords
    .filter((g) => g.childId === effectiveChildId)
    .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));

  // Encounters timeline (sorted newest first)
  const encounters = state.encounters
    .filter((e) => e.childId === effectiveChildId)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Correction requests
  const correctionRequests = state.correctionRequests
    .filter((cr) => cr.childId === effectiveChildId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({
    success: true,
    child: matchedChild,
    parent: {
      id: matchedParent.id,
      name: matchedParent.name,
      mobile: matchedParent.mobile,
    },
    alerts,
    allergies,
    conditions,
    growthRecords,
    encounters,
    correctionRequests,
  });
});

// 7. Add Child Allergy (Doctor action)
apiRouter.post('/emr/children/:childId/allergies', (req, res) => {
  const { childId } = req.params;
  const { allergyType, substance, reaction, severity, notes, doctorId, doctorName } = req.body;
  const state = db.getState();

  if (!substance || !reaction) {
    return res.status(400).json({ success: false, message: 'Substance and reaction are required to register an allergy.' });
  }

  const newAllergy: ChildAllergy = {
    id: `alg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    childId,
    allergyType: allergyType || 'MEDICATION',
    substance: String(substance).trim(),
    reaction: String(reaction).trim(),
    severity: severity || 'MODERATE',
    status: 'ACTIVE',
    identifiedDate: state.config.simulatedDate,
    doctorId: doctorId || 'dr-subba-rao',
    doctorName: doctorName || 'Dr. K. Subba Rao, MD (Pediatrics)',
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.updateState((draft) => {
    draft.allergies.unshift(newAllergy);
  });

  logClinicalAudit({
    actorId: doctorId || 'dr-subba-rao',
    actorRole: 'DOCTOR',
    actorName: doctorName || 'Dr. K. Subba Rao',
    action: 'CREATE',
    entityType: 'ALLERGY',
    entityId: newAllergy.id,
    childId,
    details: `Added active ${newAllergy.severity} allergy to ${newAllergy.substance}: ${newAllergy.reaction}`,
  });

  res.status(201).json({ success: true, allergy: newAllergy });
});

// 8. Update Allergy Status (e.g. ENTERED_IN_ERROR or RESOLVED)
apiRouter.patch('/emr/allergies/:allergyId', (req, res) => {
  const { allergyId } = req.params;
  const { status, reaction, severity, notes, doctorId, doctorName } = req.body;
  const state = db.getState();

  const allergy = state.allergies.find((a) => a.id === allergyId);
  if (!allergy) {
    return res.status(404).json({ success: false, message: 'Allergy record not found.' });
  }

  const oldStatus = allergy.status;
  if (status) allergy.status = status;
  if (reaction) allergy.reaction = reaction;
  if (severity) allergy.severity = severity;
  if (notes !== undefined) allergy.notes = notes;
  allergy.updatedAt = new Date().toISOString();

  db.persistState();

  logClinicalAudit({
    actorId: doctorId || 'dr-subba-rao',
    actorRole: 'DOCTOR',
    actorName: doctorName || 'Dr. Subba Rao',
    action: status === 'ENTERED_IN_ERROR' ? 'ENTER_ERROR' : status === 'RESOLVED' ? 'RESOLVE' : 'UPDATE',
    entityType: 'ALLERGY',
    entityId: allergy.id,
    childId: allergy.childId,
    details: `Updated allergy status from ${oldStatus} to ${allergy.status}. Notes: ${notes || 'None'}`,
  });

  res.json({ success: true, allergy });
});

// 9. Add Chronic Condition
apiRouter.post('/emr/children/:childId/conditions', (req, res) => {
  const { childId } = req.params;
  const { conditionName, category, status, notes, followUpRecommendation, doctorId, doctorName } = req.body;
  const state = db.getState();

  if (!conditionName) {
    return res.status(400).json({ success: false, message: 'Condition name is required.' });
  }

  const newCondition: ChildCondition = {
    id: `cnd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    childId,
    conditionName: String(conditionName).trim(),
    category: category || 'RESPIRATORY',
    status: status || 'ACTIVE',
    firstIdentifiedDate: state.config.simulatedDate,
    doctorId: doctorId || 'dr-subba-rao',
    doctorName: doctorName || 'Dr. K. Subba Rao, MD (Pediatrics)',
    notes,
    followUpRecommendation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.updateState((draft) => {
    draft.conditions.unshift(newCondition);
  });

  logClinicalAudit({
    actorId: doctorId || 'dr-subba-rao',
    actorRole: 'DOCTOR',
    actorName: doctorName || 'Dr. K. Subba Rao',
    action: 'CREATE',
    entityType: 'CONDITION',
    entityId: newCondition.id,
    childId,
    details: `Diagnosed condition: ${newCondition.conditionName} (${newCondition.status})`,
  });

  res.status(201).json({ success: true, condition: newCondition });
});

// 10. Update Chronic Condition
apiRouter.patch('/emr/conditions/:conditionId', (req, res) => {
  const { conditionId } = req.params;
  const { status, notes, followUpRecommendation, doctorId, doctorName } = req.body;
  const state = db.getState();

  const condition = state.conditions.find((c) => c.id === conditionId);
  if (!condition) {
    return res.status(404).json({ success: false, message: 'Condition record not found.' });
  }

  if (status) condition.status = status;
  if (notes !== undefined) condition.notes = notes;
  if (followUpRecommendation !== undefined) condition.followUpRecommendation = followUpRecommendation;
  condition.lastReviewedDate = state.config.simulatedDate;
  condition.updatedAt = new Date().toISOString();

  db.persistState();

  logClinicalAudit({
    actorId: doctorId || 'dr-subba-rao',
    actorRole: 'DOCTOR',
    actorName: doctorName || 'Dr. Subba Rao',
    action: status === 'RESOLVED' ? 'RESOLVE' : 'UPDATE',
    entityType: 'CONDITION',
    entityId: condition.id,
    childId: condition.childId,
    details: `Updated condition ${condition.conditionName} status to ${condition.status}`,
  });

  res.json({ success: true, condition });
});

// 11. Record Pediatric Growth / Vitals
apiRouter.post('/emr/children/:childId/growth', (req, res) => {
  const { childId } = req.params;
  const { heightCm, weightKg, temperatureF, pulseRate, recordedByRole, recordedByName, notes, appointmentId } = req.body;
  const state = db.getState();

  if (!heightCm || !weightKg) {
    return res.status(400).json({ success: false, message: 'Height (cm) and Weight (kg) are required.' });
  }

  // Find child age
  const allChildren = state.parents.flatMap((p) => p.children);
  const child = allChildren.find((c) => c.id === childId);
  const ageYears = child?.ageYears || 3;

  const record = calculatePediatricGrowth({
    childId,
    ageYears,
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    recordedByRole: recordedByRole || 'DOCTOR',
    recordedByName: recordedByName || 'Dr. K. Subba Rao',
    notes,
  });

  db.updateState((draft) => {
    draft.growthRecords.unshift(record);

    // If linked to active appointment, update appointment vitals as well
    if (appointmentId) {
      const appt = draft.appointments.find((a) => a.id === appointmentId);
      if (appt) {
        appt.heightCm = Number(heightCm);
        appt.weightKg = Number(weightKg);
        if (temperatureF) appt.temperatureF = Number(temperatureF);
        if (pulseRate) appt.pulseRate = Number(pulseRate);
        appt.pediatricBmi = record.pediatricBmi;
      }
    }
  });

  logClinicalAudit({
    actorId: recordedByName || 'doctor',
    actorRole: recordedByRole || 'DOCTOR',
    actorName: recordedByName || 'Pediatrician',
    action: 'CREATE',
    entityType: 'GROWTH',
    entityId: record.id,
    childId,
    details: `Recorded growth: ${record.heightCm}cm, ${record.weightKg}kg, BMI ${record.pediatricBmi} (${record.growthStatus})`,
  });

  res.status(201).json({ success: true, growthRecord: record });
});

// 12. Fast Medicines Catalog (standard pediatric drugs for quick 1-click prescription)
apiRouter.get('/emr/medicines/catalog', (_req, res) => {
  const catalog = [
    {
      medicineName: 'Syrup Paracetamol (Calpol 250mg)',
      genericName: 'Paracetamol',
      form: 'SYRUP',
      strength: '250mg / 5ml',
      defaultDosage: '5 ml',
      frequency: 'SOS',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 3,
    },
    {
      medicineName: 'Drops Paracetamol (Crocin Drops)',
      genericName: 'Paracetamol',
      form: 'DROPS',
      strength: '100mg / ml',
      defaultDosage: '1 ml',
      frequency: 'SOS',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 3,
    },
    {
      medicineName: 'Syrup Augmentin Duo (Amoxicillin + Clavulanate)',
      genericName: 'Amoxicillin / Clavulanate',
      form: 'SYRUP',
      strength: '228.5mg / 5ml',
      defaultDosage: '5 ml',
      frequency: 'TWICE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'Syrup Azee 200 (Azithromycin)',
      genericName: 'Azithromycin',
      form: 'SYRUP',
      strength: '200mg / 5ml',
      defaultDosage: '3.5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 3,
    },
    {
      medicineName: 'Syrup Cefixime (Zifi 50)',
      genericName: 'Cefixime',
      form: 'SYRUP',
      strength: '50mg / 5ml',
      defaultDosage: '5 ml',
      frequency: 'TWICE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'Syrup Levocetirizine (1-AL)',
      genericName: 'Levocetirizine',
      form: 'SYRUP',
      strength: '2.5mg / 5ml',
      defaultDosage: '2.5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'AT_BEDTIME',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'Syrup Montelukast + Levocetirizine (Montair LC Kid)',
      genericName: 'Montelukast + Levocetirizine',
      form: 'SYRUP',
      strength: '4mg + 2.5mg / 5ml',
      defaultDosage: '5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'AT_BEDTIME',
      defaultDurationDays: 7,
    },
    {
      medicineName: 'Salbutamol Inhaler (Asthalin 100mcg)',
      genericName: 'Salbutamol',
      form: 'INHALER',
      strength: '100 mcg / puff',
      defaultDosage: '2 puffs via baby spacer mask',
      frequency: 'SOS',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'ORS Sachet (Electral) in 1 Liter boiled cooled water',
      genericName: 'Oral Rehydration Salts (WHO Formula)',
      form: 'SYRUP',
      strength: 'WHO Standard',
      defaultDosage: '100 ml after every loose stool',
      frequency: 'SOS',
      timing: 'WITH_FOOD',
      defaultDurationDays: 3,
    },
    {
      medicineName: 'Syrup Zinc Gluconate (Zinconia)',
      genericName: 'Zinc Gluconate',
      form: 'SYRUP',
      strength: '20mg / 5ml',
      defaultDosage: '5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 14,
    },
    {
      medicineName: 'Drops Domperidone (Domstal)',
      genericName: 'Domperidone',
      form: 'DROPS',
      strength: '10mg / ml',
      defaultDosage: '0.5 ml',
      frequency: 'SOS',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 2,
    },
    {
      medicineName: 'Syrup Ondansetron (Ondem)',
      genericName: 'Ondansetron',
      form: 'SYRUP',
      strength: '2mg / 5ml',
      defaultDosage: '2.5 ml',
      frequency: 'SOS',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 2,
    },
    {
      medicineName: 'Syrup Mefenamic Acid (Meftal-P)',
      genericName: 'Mefenamic Acid',
      form: 'SYRUP',
      strength: '100mg / 5ml',
      defaultDosage: '4 ml',
      frequency: 'SOS',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 2,
    },
    {
      medicineName: 'Syrup Levosalbutamol + Ambroxol (Ascoril LS Junior)',
      genericName: 'Levosalbutamol + Ambroxol',
      form: 'SYRUP',
      strength: '0.5mg + 15mg / 5ml',
      defaultDosage: '3.5 ml',
      frequency: 'THRICE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'Drops Simethicone + Dill Oil (Colicaid Drops)',
      genericName: 'Simethicone + Dill Oil',
      form: 'DROPS',
      strength: '40mg / ml',
      defaultDosage: '8 drops',
      frequency: 'THRICE_DAILY',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 7,
    },
    {
      medicineName: 'Drops Saline Nasal (Nasoclear / Solspre)',
      genericName: 'Sodium Chloride 0.65%',
      form: 'DROPS',
      strength: '0.65% w/v',
      defaultDosage: '2 drops in each nostril',
      frequency: 'THRICE_DAILY',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 5,
    },
    {
      medicineName: 'Drops Vitamin D3 (D-3 Must 800 IU)',
      genericName: 'Cholecalciferol',
      form: 'DROPS',
      strength: '800 IU / ml',
      defaultDosage: '0.5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 30,
    },
    {
      medicineName: 'Syrup Ferrous Ascorbate (Orofer XT)',
      genericName: 'Ferrous Ascorbate + Folic Acid',
      form: 'SYRUP',
      strength: '30mg Iron / 5ml',
      defaultDosage: '2.5 ml',
      frequency: 'ONCE_DAILY',
      timing: 'BEFORE_FOOD',
      defaultDurationDays: 30,
    },
    {
      medicineName: 'Syrup Albendazole (Zentel 400mg)',
      genericName: 'Albendazole',
      form: 'SYRUP',
      strength: '400mg / 10ml',
      defaultDosage: '10 ml',
      frequency: 'ONCE_DAILY',
      timing: 'AT_BEDTIME',
      defaultDurationDays: 1,
    },
    {
      medicineName: 'Ointment Mupirocin 2% (T-Bact)',
      genericName: 'Mupirocin',
      form: 'CREAM',
      strength: '2% w/w',
      defaultDosage: 'Apply thin layer',
      frequency: 'THRICE_DAILY',
      timing: 'AFTER_FOOD',
      defaultDurationDays: 7,
    },
  ];

  res.json({ success: true, catalog });
});

// 13. Start Consultation / Encounter
apiRouter.post('/emr/encounters/start', (req, res) => {
  const { childId, appointmentId, doctorId, branchId, visitType } = req.body;
  const state = db.getState();

  // Find child & parent
  let matchedParent: any = null;
  let matchedChild: any = null;
  for (const p of state.parents) {
    const ch = p.children.find((c) => c.id === childId);
    if (ch) {
      matchedParent = p;
      matchedChild = ch;
      break;
    }
  }

  if (!matchedChild) {
    return res.status(404).json({ success: false, message: 'Child record not found.' });
  }

  const doctor = state.doctors.find((d) => d.id === doctorId) || state.doctors[0];
  const targetBranch = (branchId as BranchId) || 'kakinada';

  // Check if there is already an active encounter
  let encounter = state.encounters.find(
    (e) => e.childId === childId && e.status === 'IN_PROGRESS' && (appointmentId ? e.appointmentId === appointmentId : true)
  );

  if (!encounter) {
    encounter = {
      id: `enc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appointmentId,
      childId: matchedChild.id,
      childPermanentId: matchedChild.permanentId || 'DM-SDCH-000101',
      childName: matchedChild.name,
      parentId: matchedParent.id,
      parentName: matchedParent.name,
      parentMobile: matchedParent.mobile,
      doctorId: doctor.id,
      doctorName: doctor.name,
      branchId: targetBranch,
      date: state.config.simulatedDate,
      visitType: visitType || 'PHYSICAL_OPD',
      startTime: state.config.simulatedTime,
      chiefComplaints: [],
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.encounters.unshift(encounter);
  }

  // Advance appointment status in Smart OPD to WITH_DOCTOR
  if (appointmentId) {
    schedulingService.sendToDoctor(appointmentId);
  }

  db.persistState();

  logClinicalAudit({
    actorId: doctor.id,
    actorRole: 'DOCTOR',
    actorName: doctor.name,
    action: 'CREATE',
    entityType: 'ENCOUNTER',
    entityId: encounter.id,
    childId: matchedChild.id,
    details: `Started encounter consultation for ${matchedChild.name} (${matchedChild.permanentId})`,
  });

  res.json({ success: true, encounter });
});

// 14. Finalize Consultation & Generate Bilingual Digital Prescription
apiRouter.post('/emr/encounters/:encounterId/finalize', (req, res) => {
  const { encounterId } = req.params;
  const {
    chiefComplaints,
    clinicalObservations,
    diagnosis,
    doctorNotes,
    followUpDate,
    items,
    specialNotesEn,
    specialNotesTe,
    doctorId,
  } = req.body;

  const state = db.getState();
  const encounter = state.encounters.find((e) => e.id === encounterId);
  if (!encounter) {
    return res.status(404).json({ success: false, message: 'Encounter not found.' });
  }

  const doctor = state.doctors.find((d) => d.id === (doctorId || encounter.doctorId)) || state.doctors[0];
  const doctorAccount = state.doctorAccounts.find((a) => a.doctorId === doctor.id);

  // Active allergies snapshot for banner
  const activeAllergies = state.allergies
    .filter((a) => a.childId === encounter.childId && a.status === 'ACTIVE')
    .map((a) => `${a.substance} (${a.reaction})`);

  // Build processed prescription items with Telugu & English instructions
  const processedItems: PrescriptionItem[] = (items || []).map((item: any, idx: number) => {
    const bilingual = buildInstructionTexts({
      form: item.form || 'SYRUP',
      dosage: item.dosage || '5 ml',
      frequency: item.frequency || 'TWICE_DAILY',
      timing: item.timing || 'AFTER_FOOD',
      durationDays: Number(item.durationDays || 5),
    });

    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      medicineName: item.medicineName,
      genericName: item.genericName,
      form: item.form,
      strength: item.strength,
      dosage: item.dosage,
      frequency: item.frequency,
      timing: item.timing,
      durationDays: Number(item.durationDays || 5),
      timeSlots: bilingual.timeSlots,
      instructionEn: item.instructionEn || bilingual.instructionEn,
      instructionTe: item.instructionTe || bilingual.instructionTe,
    };
  });

  const year = state.config.simulatedDate.split('-')[0] || '2026';
  const rxNumber = `RX-SDCH-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

  const prescription: Prescription = {
    id: `rx-${Date.now()}`,
    encounterId: encounter.id,
    prescriptionNumber: rxNumber,
    childId: encounter.childId,
    childPermanentId: encounter.childPermanentId,
    childName: encounter.childName,
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorRegNo: doctorAccount?.medicalRegistrationNo || doctor.medicalRegistrationNo || 'APMC-38492',
    hospitalName: 'Sri Devi Children Hospital',
    branchId: encounter.branchId,
    date: state.config.simulatedDate,
    version: 1,
    diagnosis: diagnosis || encounter.diagnosis || 'Upper Respiratory Tract Infection',
    items: processedItems,
    allergyBannerSnapshot: activeAllergies,
    specialNotesEn,
    specialNotesTe,
    followUpDate,
    status: 'FINALIZED',
    digitalSignatureUrl: doctorAccount?.digitalSignatureUrl || doctor.digitalSignatureUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update encounter
  encounter.chiefComplaints = chiefComplaints || encounter.chiefComplaints;
  encounter.clinicalObservations = clinicalObservations || encounter.clinicalObservations;
  encounter.diagnosis = diagnosis || encounter.diagnosis;
  encounter.doctorNotes = doctorNotes || encounter.doctorNotes;
  encounter.followUpDate = followUpDate || encounter.followUpDate;
  encounter.endTime = state.config.simulatedTime;
  encounter.prescription = prescription;
  encounter.status = 'FINALIZED';
  encounter.updatedAt = new Date().toISOString();

  // If linked to appointment, complete appointment in Smart OPD
  if (encounter.appointmentId) {
    schedulingService.completeConsultation(encounter.appointmentId);
  }

  // Automatically advance queue: pull the next waiting child into consultation
  let nextPatient: any = null;
  const targetDoctorId = doctor.id || encounter.doctorId;
  const targetBranchId = encounter.branchId;
  const targetDate = state.config.simulatedDate;

  const nextWaitingAppt = state.appointments
    .filter(
      (a) =>
        a.doctorId === targetDoctorId &&
        a.branchId === targetBranchId &&
        a.date === targetDate &&
        (a.status === 'WAITING' || a.status === 'ARRIVED')
    )
    .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime))[0]
    ||
    state.appointments
    .filter(
      (a) =>
        a.doctorId === targetDoctorId &&
        a.branchId === targetBranchId &&
        a.date === targetDate &&
        (a.status === 'BOOKED' || a.status === 'APPROACHING')
    )
    .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime))[0];

  if (nextWaitingAppt) {
    schedulingService.sendToDoctor(nextWaitingAppt.id);
    const allChildren = state.parents.flatMap((p) => p.children);
    const child = allChildren.find((c) => c.id === nextWaitingAppt.childId);
    nextPatient = {
      ...nextWaitingAppt,
      childPermanentId: child?.permanentId || 'DM-SDCH-000101',
      childAge: child?.ageYears,
      childGender: child?.gender,
    };
  }

  db.persistState();

  logClinicalAudit({
    actorId: doctor.id,
    actorRole: 'DOCTOR',
    actorName: doctor.name,
    action: 'FINALIZE_PRESCRIPTION',
    entityType: 'PRESCRIPTION',
    entityId: prescription.id,
    childId: encounter.childId,
    details: `Finalized prescription ${rxNumber} with ${processedItems.length} items. Diagnosis: ${prescription.diagnosis}`,
  });

  res.json({
    success: true,
    message: 'Consultation completed and digital prescription generated.',
    encounter,
    prescription,
    nextPatient,
  });
});

// Quick Complete Treatment & Automatically Call Next Patient
apiRouter.post('/doctor/complete-treatment', (req, res) => {
  const { doctorId, branchId, appointmentId, encounterId } = req.body;
  const state = db.getState();

  if (appointmentId) {
    schedulingService.completeConsultation(appointmentId);
  }
  if (encounterId) {
    const enc = state.encounters.find((e) => e.id === encounterId);
    if (enc && enc.status === 'IN_PROGRESS') {
      enc.status = 'FINALIZED';
      enc.endTime = state.config.simulatedTime;
      enc.updatedAt = new Date().toISOString();
    }
  }

  const targetDoctorId = doctorId || state.doctors[0]?.id || 'dr-subba-rao';
  const targetBranchId = (branchId as BranchId) || 'kakinada';
  const targetDate = state.config.simulatedDate;

  const nextWaitingAppt = state.appointments
    .filter(
      (a) =>
        a.doctorId === targetDoctorId &&
        a.branchId === targetBranchId &&
        a.date === targetDate &&
        (a.status === 'WAITING' || a.status === 'ARRIVED')
    )
    .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime))[0]
    ||
    state.appointments
    .filter(
      (a) =>
        a.doctorId === targetDoctorId &&
        a.branchId === targetBranchId &&
        a.date === targetDate &&
        (a.status === 'BOOKED' || a.status === 'APPROACHING')
    )
    .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime))[0];

  let nextPatient = null;
  if (nextWaitingAppt) {
    schedulingService.sendToDoctor(nextWaitingAppt.id);
    const allChildren = state.parents.flatMap((p) => p.children);
    const child = allChildren.find((c) => c.id === nextWaitingAppt.childId);
    nextPatient = {
      ...nextWaitingAppt,
      childPermanentId: child?.permanentId || 'DM-SDCH-000101',
      childAge: child?.ageYears,
      childGender: child?.gender,
    };
  }

  db.persistState();

  res.json({
    success: true,
    message: 'Treatment marked completed. Next patient called into room.',
    nextPatient,
  });
});

// 15. Check Drug Allergy Warnings
apiRouter.post('/emr/prescriptions/check-allergy', (req, res) => {
  const { childId, medicineName, genericName } = req.body;
  const conflict = checkAllergyConflict(childId, medicineName, genericName);
  res.json(conflict);
});

// 16. Parent Clinical Correction Request
apiRouter.post('/emr/children/:childId/correction-requests', (req, res) => {
  const { childId } = req.params;
  const { parentId, entityType, entityId, requestNote } = req.body;
  const state = db.getState();

  const parent = state.parents.find((p) => p.id === parentId);
  if (!requestNote) {
    return res.status(400).json({ success: false, message: 'Please provide note describing the requested correction.' });
  }

  const correctionRequest: ClinicalCorrectionRequest = {
    id: `crq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    childId,
    parentId: parentId || parent?.id || 'p-unknown',
    parentName: parent?.name || 'Parent',
    parentMobile: parent?.mobile || '',
    entityType: entityType || 'RECORD',
    entityId,
    requestNote: String(requestNote).trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  db.updateState((draft) => {
    draft.correctionRequests.unshift(correctionRequest);
  });

  res.status(201).json({ success: true, correctionRequest });
});

// 17. Review Correction Request (Doctor)
apiRouter.patch('/emr/correction-requests/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { status, doctorReviewNotes, doctorId } = req.body;
  const state = db.getState();

  const reqItem = state.correctionRequests.find((r) => r.id === requestId);
  if (!reqItem) {
    return res.status(404).json({ success: false, message: 'Correction request not found.' });
  }

  reqItem.status = status || 'ACCEPTED';
  reqItem.doctorReviewNotes = doctorReviewNotes;
  reqItem.reviewedByDoctorId = doctorId || 'dr-subba-rao';
  reqItem.reviewedAt = new Date().toISOString();

  db.persistState();

  res.json({ success: true, correctionRequest: reqItem });
});

