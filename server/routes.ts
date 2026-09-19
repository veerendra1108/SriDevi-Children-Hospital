import { Router } from 'express';
import { db } from './db.js';
import { schedulingService, timeToMinutes, minutesToTime } from './schedulingService.js';
import { BranchId, OperationalAnalytics } from '../src/types/index.js';
import { vaccinationService } from './vaccinationService.js';
import { IAP_2018_SCHEDULE_MASTER } from './vaccineScheduleData.js';

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
  const { appointmentId, paymentMethod } = req.body;
  const result = schedulingService.checkInPaymentReceived(appointmentId, paymentMethod);
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
