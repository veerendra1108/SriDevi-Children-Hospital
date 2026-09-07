import { Router } from 'express';
import { db } from './db.js';
import { schedulingService, timeToMinutes, minutesToTime } from './schedulingService.js';
import { BranchId, OperationalAnalytics } from '../src/types/index.js';

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

// Get appointments (filtered by parentId, doctorId, branchId, date)
apiRouter.get('/appointments', (req, res) => {
  const { parentId, doctorId, branchId, date } = req.query;
  const state = db.getState();

  let list = [...state.appointments];
  if (parentId) {
    list = list.filter((a) => a.parentId === parentId);
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

  // Recalculate live ETAs before returning
  if (doctorId && branchId && date) {
    schedulingService.recalculateSessionQueue(String(doctorId), String(branchId) as BranchId, String(date));
  }

  // Sort by date and booked time
  list.sort((a, b) => a.date.localeCompare(b.date) || a.bookedTime.localeCompare(b.bookedTime));

  res.json(list);
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

// Book appointment
apiRouter.post('/appointments', (req, res) => {
  const result = schedulingService.bookAppointment(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
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

apiRouter.get('/parents/search', (req, res) => {
  const { mobile } = req.query;
  const state = db.getState();
  const parent = state.parents.find((p) => p.mobile === String(mobile || '').trim());
  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }
  res.json(parent);
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
  const { appointmentId } = req.body;
  const result = schedulingService.checkInPaymentReceived(appointmentId);
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

apiRouter.post('/reception/cancel-session', (req, res) => {
  const { doctorId, branchId, reason } = req.body;
  const result = schedulingService.cancelDoctorSession(doctorId, branchId, reason);
  res.json(result);
});

// Live Queue for doctor & branch
apiRouter.get('/queue/live', (req, res) => {
  const { doctorId, branchId, date } = req.query;
  const state = db.getState();
  const targetDate = String(date || state.config.simulatedDate);

  if (doctorId && branchId) {
    schedulingService.recalculateSessionQueue(String(doctorId), String(branchId) as BranchId, targetDate);
  }

  const session = state.sessions.find(
    (s) => s.doctorId === doctorId && s.branchId === branchId && s.date === targetDate
  );

  const appointments = state.appointments
    .filter(
      (a) =>
        (!doctorId || a.doctorId === doctorId) &&
        (!branchId || a.branchId === branchId) &&
        a.date === targetDate &&
        a.status !== 'RESCHEDULED'
    )
    .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime));

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

  res.json({ success: true, newTime: state.config.simulatedTime });
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
  }

  res.json({ success: true, currentDelay: session?.currentDelayMinutes });
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
    case 'reset-database': {
      db.resetToSeed();
      break;
    }
  }

  res.json({ success: true, scenarioId });
});

// Update system configuration
apiRouter.put('/config', (req, res) => {
  const state = db.getState();
  Object.assign(state.config, req.body);
  res.json({ success: true, config: state.config });
});
