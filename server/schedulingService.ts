import { db } from './db.js';
import {
  Appointment,
  AppointmentStatus,
  BranchId,
  DoctorSession,
  SlotAvailability,
} from '../src/types/index.js';

// Helper: convert HH:mm string to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper: convert minutes from midnight to HH:mm
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, minutes % (24 * 60));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class SchedulingService {
  /**
   * Recalculates expected consultation times and queue metrics for a doctor session.
   * Employs rolling train-ETA model: near-term appointments absorb delay;
   * downstream appointments (beyond ~1.5 hours) gradually catch up via buffer absorption.
   */
  public recalculateSessionQueue(doctorId: string, branchId: BranchId, date: string): void {
    const state = db.getState();
    const session = state.sessions.find(
      (s) => s.doctorId === doctorId && s.branchId === branchId && s.date === date
    );

    if (!session) return;

    // Fetch all active appointments for this doctor, branch, and date ordered by booked time
    const dayAppointments = state.appointments
      .filter(
        (a) =>
          a.doctorId === doctorId &&
          a.branchId === branchId &&
          a.date === date &&
          a.status !== 'RESCHEDULED' &&
          a.status !== 'HOSPITAL_CANCELLED'
      )
      .sort((a, b) => timeToMinutes(a.bookedTime) - timeToMinutes(b.bookedTime));

    if (dayAppointments.length === 0) return;

    // Calculate current running delay
    let currentDelay = session.currentDelayMinutes;

    // If currently with doctor, calculate elapsed time
    const currentActiveAppt = dayAppointments.find((a) => a.status === 'WITH_DOCTOR');
    if (currentActiveAppt && currentActiveAppt.consultationStartTime) {
      const startMin = timeToMinutes(currentActiveAppt.consultationStartTime);
      const simulatedNowMin = timeToMinutes(state.config.simulatedTime);
      const elapsed = simulatedNowMin - startMin;
      const expectedDuration = state.config.slotDurationMinutes;
      if (elapsed > expectedDuration) {
        // Additional over-run delay
        currentDelay = Math.max(currentDelay, elapsed - expectedDuration + 5);
      }
    }

    session.currentDelayMinutes = currentDelay;

    // Count waiting/ahead
    let waitingAheadCounter = 0;
    const isDoctorBusy = !!currentActiveAppt;

    // Rolling ETA calculation
    dayAppointments.forEach((appt, index) => {
      // Completed appointments keep their actual times
      if (appt.status === 'COMPLETED') {
        return;
      }

      if (appt.status === 'WITH_DOCTOR') {
        appt.childrenAhead = 0;
        appt.positionInQueue = 0;
        return;
      }

      const bookedMin = timeToMinutes(appt.bookedTime);
      const nowMin = timeToMinutes(state.config.simulatedTime);

      // Decay factor for delay: near appointments feel 100% delay, appointments 2 hours out absorb delay
      const timeDistance = Math.max(0, bookedMin - nowMin);
      let effectiveDelay = currentDelay;
      if (timeDistance > 60) {
        // After 60 minutes, delay reduces linearly
        const decay = Math.min(1, (timeDistance - 60) / 120);
        effectiveDelay = Math.round(currentDelay * (1 - decay * 0.7));
      }

      const expectedMin = bookedMin + effectiveDelay;
      appt.expectedConsultationTime = minutesToTime(expectedMin);

      // Recommended arrival is 15 minutes before expected consultation
      const recommendedArrivalMin = Math.max(0, expectedMin - state.config.arrivalBeforeAppointmentMinutes);
      appt.recommendedArrivalTime = minutesToTime(recommendedArrivalMin);

      // Queue position
      if (appt.status === 'WAITING' || appt.status === 'ARRIVED' || appt.status === 'BOOKED' || appt.status === 'APPROACHING') {
        appt.positionInQueue = waitingAheadCounter + 1;
        appt.childrenAhead = (isDoctorBusy ? 1 : 0) + waitingAheadCounter;
        waitingAheadCounter++;
      } else {
        appt.childrenAhead = undefined;
      }

      // Delay status explanation
      if (effectiveDelay > 20) {
        appt.delayExplanation = `Doctor running approximately ${effectiveDelay} minutes late due to critical patient stabilization.`;
      } else if (effectiveDelay > 5) {
        appt.delayExplanation = `Doctor running approximately ${effectiveDelay} minutes behind schedule.`;
      } else if (effectiveDelay < -5) {
        appt.delayExplanation = `Doctor is running slightly ahead of schedule. Early consultation may be possible if you arrive.`;
      } else {
        appt.delayExplanation = `Doctor running approximately on time.`;
      }

      // Check notification triggers: if 2 children ahead and within notification preference
      if (appt.childrenAhead !== undefined && appt.childrenAhead <= state.config.notificationTriggerChildrenCount) {
        if (appt.status === 'BOOKED') {
          appt.status = 'APPROACHING';
          this.sendSimulatedNotification(
            appt,
            'Consultation Approaching',
            `Your child's consultation with ${appt.doctorName} is approaching. There are currently ${appt.childrenAhead} children ahead of you. Please proceed to Sri Devi Children Hospital.`
          );
        }
      }
    });

    db.persistState();
  }

  /**
   * Generates available slots for a doctor on a given date at a branch.
   */
  public getAvailableSlots(doctorId: string, branchId: BranchId, dateStr: string): SlotAvailability[] {
    const state = db.getState();
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); // 0-6

    // Find schedule
    const schedule = state.schedules.find(
      (s) => s.doctorId === doctorId && s.branchId === branchId && s.daysOfWeek.includes(dayOfWeek) && s.isAvailable
    );

    if (!schedule) {
      return [];
    }

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    const slotDuration = schedule.slotDurationMinutes || 15;

    // Existing active bookings for this date and doctor
    const existingBookings = state.appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.branchId === branchId &&
        a.date === dateStr &&
        a.status !== 'RESCHEDULED' &&
        a.status !== 'SLOT_RELEASED' &&
        a.status !== 'HOSPITAL_CANCELLED'
    );

    const bookedTimes = new Set(existingBookings.map((a) => a.bookedTime));

    const slots: SlotAvailability[] = [];
    let current = startMinutes;
    let slotIndex = 0;

    while (current + slotDuration <= endMinutes) {
      const timeStr = minutesToTime(current);
      // Every 4th slot can be designated as internal protected buffer (10 mins per hour equivalent)
      const isBuffer = slotIndex % 4 === 3;

      if (isBuffer) {
        // Internal buffer slot - not shown as normal parent-bookable slot
        slots.push({
          time: timeStr,
          available: false,
          status: 'Buffer',
          isBufferSlot: true,
        });
      } else if (bookedTimes.has(timeStr)) {
        slots.push({
          time: timeStr,
          available: false,
          status: 'Booked',
        });
      } else {
        slots.push({
          time: timeStr,
          available: true,
          status: 'Available',
        });
      }

      current += slotDuration;
      slotIndex++;
    }

    return slots;
  }

  /**
   * Prevents appointment hoarding: A child must not have multiple active appointments with the same doctor on the same day.
   */
  public checkOneActiveAppointmentRule(childId: string, doctorId: string, date: string): boolean {
    const state = db.getState();
    const activeAppointment = state.appointments.find(
      (a) =>
        a.childId === childId &&
        a.doctorId === doctorId &&
        a.date === date &&
        ['BOOKED', 'APPROACHING', 'ARRIVED', 'WAITING', 'WITH_DOCTOR'].includes(a.status)
    );
    return !activeAppointment;
  }

  /**
   * Atomically books an appointment.
   */
  public bookAppointment(params: {
    parentId: string;
    childId: string;
    doctorId: string;
    branchId: BranchId;
    date: string;
    bookedTime: string;
    bookingSource?: 'ONLINE' | 'RECEPTION_PHONE' | 'WALK_IN';
    advanceNoticePreferenceMinutes?: number;
  }): { success: boolean; appointment?: Appointment; message?: string } {
    const state = db.getState();

    // 1. One Active Appointment Rule
    if (!this.checkOneActiveAppointmentRule(params.childId, params.doctorId, params.date)) {
      return {
        success: false,
        message: 'You already have an active appointment for this child on this date with this doctor.',
      };
    }

    // 2. Concurrency check: is slot already taken?
    const conflict = state.appointments.find(
      (a) =>
        a.doctorId === params.doctorId &&
        a.branchId === params.branchId &&
        a.date === params.date &&
        a.bookedTime === params.bookedTime &&
        a.status !== 'RESCHEDULED' &&
        a.status !== 'SLOT_RELEASED' &&
        a.status !== 'HOSPITAL_CANCELLED'
    );

    if (conflict) {
      return {
        success: false,
        message: 'Sorry, this appointment was just booked by another parent. Please select another available time.',
      };
    }

    // Find parent & child
    const parent = state.parents.find((p) => p.id === params.parentId);
    if (!parent) return { success: false, message: 'Parent account not found.' };

    const child = parent.children.find((c) => c.id === params.childId);
    if (!child) return { success: false, message: 'Child profile not found.' };

    const doctor = state.doctors.find((d) => d.id === params.doctorId);
    if (!doctor) return { success: false, message: 'Doctor not found.' };

    const branch = state.branches.find((b) => b.id === params.branchId);
    if (!branch) return { success: false, message: 'Branch not found.' };

    const appointmentNumber = `SD-${params.branchId === 'kakinada' ? 'KAK' : 'PIT'}-${1000 + state.appointments.length + 1}`;
    const bookedMin = timeToMinutes(params.bookedTime);
    const recommendedArrival = minutesToTime(Math.max(0, bookedMin - state.config.arrivalBeforeAppointmentMinutes));

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appointmentNumber,
      childId: child.id,
      childName: child.name,
      parentId: parent.id,
      parentName: parent.name,
      parentMobile: parent.mobile,
      doctorId: doctor.id,
      doctorName: doctor.name,
      branchId: branch.id,
      branchName: branch.name,
      date: params.date,
      bookedTime: params.bookedTime,
      expectedConsultationTime: params.bookedTime,
      recommendedArrivalTime: recommendedArrival,
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: params.bookingSource || 'ONLINE',
      advanceNoticePreferenceMinutes: params.advanceNoticePreferenceMinutes || 30,
      history: [
        {
          timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
          status: 'BOOKED',
          note: params.bookingSource === 'RECEPTION_PHONE' ? 'Booked over phone by receptionist' : 'Booked online by parent',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.appointments.push(newAppointment);

    // Recalculate queue ETAs
    this.recalculateSessionQueue(params.doctorId, params.branchId, params.date);

    return { success: true, appointment: newAppointment };
  }

  /**
   * Reschedule appointment: allowed only until 60 minutes before appointment time.
   */
  public rescheduleAppointment(
    appointmentId: string,
    newBookedTime: string,
    newDate?: string
  ): { success: boolean; appointment?: Appointment; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);

    if (!appt) return { success: false, message: 'Appointment not found.' };

    // Check cutoff (60 mins before booked appointment time)
    const targetDate = newDate || appt.date;
    const nowMin = timeToMinutes(state.config.simulatedTime);
    const bookedMin = timeToMinutes(appt.bookedTime);

    if (appt.date === state.config.simulatedDate && bookedMin - nowMin < state.config.rescheduleCutoffMinutes) {
      return {
        success: false,
        message: 'Your appointment is approaching and can no longer be rescheduled online. Please proceed to the hospital as planned.',
      };
    }

    // Check slot availability
    const conflict = state.appointments.find(
      (a) =>
        a.doctorId === appt.doctorId &&
        a.branchId === appt.branchId &&
        a.date === targetDate &&
        a.bookedTime === newBookedTime &&
        a.id !== appt.id &&
        a.status !== 'RESCHEDULED' &&
        a.status !== 'SLOT_RELEASED' &&
        a.status !== 'HOSPITAL_CANCELLED'
    );

    if (conflict) {
      return {
        success: false,
        message: 'The selected slot is no longer available. Please choose another time.',
      };
    }

    // Old slot is freed atomically
    const oldTime = appt.bookedTime;
    appt.bookedTime = newBookedTime;
    if (newDate) appt.date = newDate;
    appt.expectedConsultationTime = newBookedTime;
    appt.recommendedArrivalTime = minutesToTime(
      Math.max(0, timeToMinutes(newBookedTime) - state.config.arrivalBeforeAppointmentMinutes)
    );
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'BOOKED',
      note: `Rescheduled from ${oldTime} to ${newBookedTime}`,
    });
    appt.updatedAt = new Date().toISOString();

    // Recalculate
    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);

    return { success: true, appointment: appt };
  }

  /**
   * Reception Workflow: Check in / payment received
   */
  public checkInPaymentReceived(appointmentId: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    appt.paymentStatus = 'PAID';
    appt.status = 'WAITING';
    appt.actualArrivalTime = state.config.simulatedTime;
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'ARRIVED',
      note: 'Checked in by reception; consultation fee payment received',
    });
    appt.updatedAt = new Date().toISOString();

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * Reception / Doctor: Send to doctor / start consultation
   */
  public sendToDoctor(appointmentId: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    // Update doctor session
    const session = state.sessions.find(
      (s) => s.doctorId === appt.doctorId && s.branchId === appt.branchId && s.date === appt.date
    );
    if (session) {
      session.currentAppointmentId = appt.id;
      if (!session.actualStart) {
        session.actualStart = state.config.simulatedTime;
      }
    }

    appt.status = 'WITH_DOCTOR';
    appt.consultationStartTime = state.config.simulatedTime;
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'WITH_DOCTOR',
      note: 'Consultation initiated with pediatrician',
    });
    appt.updatedAt = new Date().toISOString();

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * Reception / Doctor: Complete consultation
   */
  public completeConsultation(appointmentId: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    appt.status = 'COMPLETED';
    appt.consultationEndTime = state.config.simulatedTime;
    if (appt.consultationStartTime) {
      appt.consultationDurationMinutes = Math.max(
        5,
        timeToMinutes(appt.consultationEndTime) - timeToMinutes(appt.consultationStartTime)
      );
    } else {
      appt.consultationDurationMinutes = 14;
    }

    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'COMPLETED',
      note: 'Consultation completed successfully',
    });
    appt.updatedAt = new Date().toISOString();

    const session = state.sessions.find(
      (s) => s.doctorId === appt.doctorId && s.branchId === appt.branchId && s.date === appt.date
    );
    if (session && session.currentAppointmentId === appt.id) {
      session.currentAppointmentId = undefined;
    }

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * Late arrival handling: Patient loses original priority, placed in next suitable position
   */
  public markLate(appointmentId: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    appt.status = 'LATE';
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'LATE',
      note: 'Marked late by reception; pending reassignment when family arrives',
    });
    appt.updatedAt = new Date().toISOString();

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * Reassign position for late arriving or emergency adjusted patient
   */
  public reassignPosition(appointmentId: string, newPositionOrTime?: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    appt.status = 'WAITING';
    if (newPositionOrTime) {
      appt.expectedConsultationTime = newPositionOrTime;
    }
    appt.delayExplanation = 'Your original appointment time has passed. Reception has assigned the next available consultation position.';
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'WAITING',
      note: 'Reassigned to active queue by reception',
    });
    appt.updatedAt = new Date().toISOString();

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * No-Show Rule: Releases slot capacity, non-punitive messaging
   */
  public markNoShow(appointmentId: string): { success: boolean; message?: string } {
    const state = db.getState();
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Appointment not found' };

    appt.status = 'NO_SHOW';
    appt.history.push({
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      status: 'NO_SHOW',
      note: 'Patient did not arrive within grace threshold; slot released for on-site queue relief',
    });
    appt.updatedAt = new Date().toISOString();

    this.sendSimulatedNotification(
      appt,
      'Appointment Status Update',
      'Your original appointment time has passed. If you are still planning to visit today, please come to the hospital. Reception will arrange the next available consultation slot based on availability.'
    );

    this.recalculateSessionQueue(appt.doctorId, appt.branchId, appt.date);
    return { success: true };
  }

  /**
   * Emergency Priority Adjustment:
   * Inserts emergency patient, consumes buffer capacity, recalculates downstream ETAs
   */
  public insertEmergencyAdjustment(params: {
    doctorId: string;
    branchId: BranchId;
    childName: string;
    parentName: string;
    parentMobile: string;
  }): { success: boolean; appointment?: Appointment } {
    const state = db.getState();
    const session = state.sessions.find(
      (s) => s.doctorId === params.doctorId && s.branchId === params.branchId && s.date === state.config.simulatedDate
    );

    if (session) {
      session.emergencyAdjustmentCount += 1;
      // Consume 15 mins of buffer
      session.bufferAvailableMinutes = Math.max(0, session.bufferAvailableMinutes - 15);
      session.currentDelayMinutes += 15; // Propagate 15m delay to downstream
    }

    const doctor = state.doctors.find((d) => d.id === params.doctorId);
    const branch = state.branches.find((b) => b.id === params.branchId);

    const emergencyAppt: Appointment = {
      id: `apt-emg-${Date.now()}`,
      appointmentNumber: `SD-EMG-${Math.floor(100 + Math.random() * 900)}`,
      childId: `c-emg-${Date.now()}`,
      childName: params.childName || 'Emergency Pediatric Patient',
      parentId: 'p-emg',
      parentName: params.parentName || 'Attending Guardian',
      parentMobile: params.parentMobile || '9999999999',
      doctorId: params.doctorId,
      doctorName: doctor?.name || 'Pediatric Specialist',
      branchId: params.branchId,
      branchName: branch?.name || 'Hospital Clinic',
      date: state.config.simulatedDate,
      bookedTime: state.config.simulatedTime,
      expectedConsultationTime: state.config.simulatedTime,
      recommendedArrivalTime: state.config.simulatedTime,
      status: 'WAITING',
      paymentStatus: 'PAID',
      bookingSource: 'WALK_IN',
      advanceNoticePreferenceMinutes: 0,
      isEmergency: true,
      emergencyReason: 'Emergency priority adjustment',
      actualArrivalTime: state.config.simulatedTime,
      history: [
        {
          timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
          status: 'ARRIVED',
          note: 'Emergency patient admitted with immediate queue priority',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.appointments.push(emergencyAppt);
    this.recalculateSessionQueue(params.doctorId, params.branchId, state.config.simulatedDate);

    return { success: true, appointment: emergencyAppt };
  }

  /**
   * Hospital-Caused Session Cancellation
   */
  public cancelDoctorSession(doctorId: string, branchId: BranchId, reason?: string): { success: boolean; affectedCount: number } {
    const state = db.getState();
    const session = state.sessions.find(
      (s) => s.doctorId === doctorId && s.branchId === branchId && s.date === state.config.simulatedDate
    );

    if (session) {
      session.status = 'CANCELLED_BY_HOSPITAL';
      session.cancellationNotice = reason || 'Emergency operational contingency';
    }

    const doctor = state.doctors.find((d) => d.id === doctorId);
    const affectedAppointments = state.appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.branchId === branchId &&
        a.date === state.config.simulatedDate &&
        ['BOOKED', 'APPROACHING', 'ARRIVED', 'WAITING'].includes(a.status)
    );

    affectedAppointments.forEach((appt) => {
      appt.status = 'HOSPITAL_CANCELLED';
      appt.history.push({
        timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
        status: 'HOSPITAL_CANCELLED',
        note: reason || 'Cancelled by hospital management',
      });
      appt.updatedAt = new Date().toISOString();

      this.sendSimulatedNotification(
        appt,
        'Hospital Notice - Session Rescheduled',
        `Unfortunately today's consultation with ${doctor?.name || 'the doctor'} has been cancelled by the hospital. We apologise for the inconvenience. Please check available appointments or contact reception.`
      );
    });

    return { success: true, affectedCount: affectedAppointments.length };
  }

  /**
   * Helper to append an in-app simulated notification
   */
  public sendSimulatedNotification(appt: Appointment, title: string, message: string): void {
    const state = db.getState();
    state.notifications.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appointmentId: appt.id,
      parentId: appt.parentId,
      title,
      message,
      type: 'APPROACHING',
      timestamp: `${state.config.simulatedDate} ${state.config.simulatedTime}`,
      read: false,
    });
  }
}

export const schedulingService = new SchedulingService();
