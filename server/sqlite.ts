import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  Parent,
  Child,
  Doctor,
  HospitalBranch,
  DoctorSchedule,
  Appointment,
  DoctorSession,
  SystemConfiguration,
  GalleryItem,
  HospitalReview,
  NotificationItem,
} from '../src/types/index.js';
import { DatabaseState } from './db.js';

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'hospital.db');

export class SqliteManager {
  private db: Database.Database;

  constructor(filePath: string = DB_PATH) {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  public getRawDb(): Database.Database {
    return this.db;
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS parents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL,
        name TEXT NOT NULL,
        gender TEXT,
        age_years INTEGER,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reception_users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        qualifications TEXT NOT NULL,
        specialty TEXT NOT NULL,
        experience_years INTEGER NOT NULL,
        summary TEXT NOT NULL,
        branches_json TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        schedule_description TEXT
      );

      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        landmark TEXT NOT NULL,
        phone TEXT NOT NULL,
        emergency_phone TEXT NOT NULL,
        timings TEXT NOT NULL,
        map_embed_url TEXT,
        google_maps_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id TEXT PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        days_of_week_json TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        slot_duration_minutes INTEGER NOT NULL,
        buffer_minutes_per_hour INTEGER NOT NULL,
        is_available INTEGER NOT NULL DEFAULT 1,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        appointment_number TEXT NOT NULL,
        child_id TEXT NOT NULL,
        child_name TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        parent_name TEXT NOT NULL,
        parent_mobile TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        date TEXT NOT NULL,
        booked_time TEXT NOT NULL,
        expected_consultation_time TEXT NOT NULL,
        recommended_arrival_time TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        booking_source TEXT NOT NULL,
        advance_notice_preference_minutes INTEGER NOT NULL DEFAULT 30,
        is_emergency INTEGER NOT NULL DEFAULT 0,
        emergency_reason TEXT,
        actual_arrival_time TEXT,
        consultation_start_time TEXT,
        consultation_end_time TEXT,
        consultation_duration_minutes INTEGER,
        delay_explanation TEXT,
        rescheduled_from_appointment_id TEXT,
        position_in_queue INTEGER,
        children_ahead INTEGER,
        history_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS doctor_sessions (
        doctor_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        date TEXT NOT NULL,
        scheduled_start TEXT NOT NULL,
        actual_start TEXT,
        status TEXT NOT NULL,
        current_appointment_id TEXT,
        current_delay_minutes INTEGER NOT NULL DEFAULT 0,
        avg_consultation_duration_minutes INTEGER NOT NULL DEFAULT 15,
        buffer_available_minutes INTEGER NOT NULL DEFAULT 0,
        emergency_adjustment_count INTEGER NOT NULL DEFAULT 0,
        cancellation_notice TEXT,
        PRIMARY KEY (doctor_id, branch_id, date)
      );

      CREATE TABLE IF NOT EXISTS system_config (
        id TEXT PRIMARY KEY DEFAULT 'primary',
        slot_duration_minutes INTEGER NOT NULL,
        arrival_before_appointment_minutes INTEGER NOT NULL,
        reschedule_cutoff_minutes INTEGER NOT NULL,
        late_grace_period_minutes INTEGER NOT NULL,
        no_show_threshold_minutes INTEGER NOT NULL,
        buffer_minutes_per_hour INTEGER NOT NULL,
        notification_trigger_children_count INTEGER NOT NULL,
        simulated_time TEXT NOT NULL,
        simulated_date TEXT NOT NULL,
        is_simulated_clock_active INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT NOT NULL,
        caption TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        parent_name TEXT NOT NULL,
        child_name TEXT,
        rating INTEGER NOT NULL,
        date TEXT NOT NULL,
        branch TEXT NOT NULL,
        comment TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        appointment_id TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  public isDatabaseEmpty(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
    return row.count === 0;
  }

  public seedAll(seed: DatabaseState): void {
    const tx = this.db.transaction(() => {
      // Clear existing
      this.db.exec(`
        DELETE FROM notifications;
        DELETE FROM appointments;
        DELETE FROM doctor_sessions;
        DELETE FROM doctor_schedules;
        DELETE FROM children;
        DELETE FROM parents;
        DELETE FROM reception_users;
        DELETE FROM doctors;
        DELETE FROM branches;
        DELETE FROM gallery;
        DELETE FROM reviews;
        DELETE FROM system_config;
      `);

      // Parents & Children
      const insertParent = this.db.prepare(`
        INSERT INTO parents (id, name, mobile, password_hash)
        VALUES (@id, @name, @mobile, @password_hash)
      `);
      const insertChild = this.db.prepare(`
        INSERT INTO children (id, parent_id, name, gender, age_years)
        VALUES (@id, @parentId, @name, @gender, @ageYears)
      `);

      for (const p of seed.parents) {
        insertParent.run({
          id: p.id,
          name: p.name,
          mobile: p.mobile,
          password_hash: seed.parentPasswords[p.mobile] || 'Test@123',
        });
        if (p.children && p.children.length > 0) {
          for (const c of p.children) {
            insertChild.run({
              id: c.id,
              parentId: p.id,
              name: c.name,
              gender: c.gender || null,
              ageYears: c.ageYears ?? null,
            });
          }
        }
      }

      // Reception Users
      const insertReception = this.db.prepare(`
        INSERT INTO reception_users (username, password, branch_id, name)
        VALUES (@username, @password, @branchId, @name)
      `);
      for (const u of seed.receptionUsers) {
        insertReception.run(u);
      }

      // Doctors
      const insertDoctor = this.db.prepare(`
        INSERT INTO doctors (id, name, photo_url, qualifications, specialty, experience_years, summary, branches_json, active, schedule_description)
        VALUES (@id, @name, @photoUrl, @qualifications, @specialty, @experienceYears, @summary, @branchesJson, @active, @scheduleDescription)
      `);
      for (const d of seed.doctors) {
        insertDoctor.run({
          id: d.id,
          name: d.name,
          photoUrl: d.photoUrl,
          qualifications: d.qualifications,
          specialty: d.specialty,
          experienceYears: d.experienceYears,
          summary: d.summary,
          branchesJson: JSON.stringify(d.branches),
          active: d.active ? 1 : 0,
          scheduleDescription: d.scheduleDescription || null,
        });
      }

      // Branches
      const insertBranch = this.db.prepare(`
        INSERT INTO branches (id, name, address, landmark, phone, emergency_phone, timings, map_embed_url, google_maps_url)
        VALUES (@id, @name, @address, @landmark, @phone, @emergencyPhone, @timings, @mapEmbedUrl, @googleMapsUrl)
      `);
      for (const b of seed.branches) {
        insertBranch.run({
          ...b,
          mapEmbedUrl: b.mapEmbedUrl || null,
        });
      }

      // Schedules
      const insertSchedule = this.db.prepare(`
        INSERT INTO doctor_schedules (id, doctor_id, branch_id, days_of_week_json, start_time, end_time, slot_duration_minutes, buffer_minutes_per_hour, is_available, notes)
        VALUES (@id, @doctorId, @branchId, @daysOfWeekJson, @startTime, @endTime, @slotDurationMinutes, @bufferMinutesPerHour, @isAvailable, @notes)
      `);
      for (const s of seed.schedules) {
        insertSchedule.run({
          id: s.id,
          doctorId: s.doctorId,
          branchId: s.branchId,
          daysOfWeekJson: JSON.stringify(s.daysOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMinutes: s.slotDurationMinutes,
          bufferMinutesPerHour: s.bufferMinutesPerHour,
          isAvailable: s.isAvailable ? 1 : 0,
          notes: s.notes || null,
        });
      }

      // Appointments
      const insertAppt = this.db.prepare(`
        INSERT INTO appointments (
          id, appointment_number, child_id, child_name, parent_id, parent_name, parent_mobile,
          doctor_id, doctor_name, branch_id, branch_name, date, booked_time,
          expected_consultation_time, recommended_arrival_time, status, payment_status,
          booking_source, advance_notice_preference_minutes, is_emergency, emergency_reason,
          actual_arrival_time, consultation_start_time, consultation_end_time,
          consultation_duration_minutes, delay_explanation, rescheduled_from_appointment_id,
          position_in_queue, children_ahead, history_json, created_at, updated_at
        ) VALUES (
          @id, @appointmentNumber, @childId, @childName, @parentId, @parentName, @parentMobile,
          @doctorId, @doctorName, @branchId, @branchName, @date, @bookedTime,
          @expectedConsultationTime, @recommendedArrivalTime, @status, @paymentStatus,
          @bookingSource, @advanceNoticePreferenceMinutes, @isEmergency, @emergencyReason,
          @actualArrivalTime, @consultationStartTime, @consultationEndTime,
          @consultationDurationMinutes, @delayExplanation, @rescheduledFromAppointmentId,
          @positionInQueue, @childrenAhead, @historyJson, @createdAt, @updatedAt
        )
      `);
      for (const a of seed.appointments) {
        insertAppt.run({
          id: a.id,
          appointmentNumber: a.appointmentNumber,
          childId: a.childId,
          childName: a.childName,
          parentId: a.parentId,
          parentName: a.parentName,
          parentMobile: a.parentMobile,
          doctorId: a.doctorId,
          doctorName: a.doctorName,
          branchId: a.branchId,
          branchName: a.branchName,
          date: a.date,
          bookedTime: a.bookedTime,
          expectedConsultationTime: a.expectedConsultationTime,
          recommendedArrivalTime: a.recommendedArrivalTime,
          status: a.status,
          paymentStatus: a.paymentStatus,
          bookingSource: a.bookingSource,
          advanceNoticePreferenceMinutes: a.advanceNoticePreferenceMinutes || 30,
          isEmergency: a.isEmergency ? 1 : 0,
          emergencyReason: a.emergencyReason || null,
          actualArrivalTime: a.actualArrivalTime || null,
          consultationStartTime: a.consultationStartTime || null,
          consultationEndTime: a.consultationEndTime || null,
          consultationDurationMinutes: a.consultationDurationMinutes ?? null,
          delayExplanation: a.delayExplanation || null,
          rescheduledFromAppointmentId: a.rescheduledFromAppointmentId || null,
          positionInQueue: a.positionInQueue ?? null,
          childrenAhead: a.childrenAhead ?? null,
          historyJson: JSON.stringify(a.history || []),
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        });
      }

      // Sessions
      const insertSession = this.db.prepare(`
        INSERT INTO doctor_sessions (
          doctor_id, branch_id, date, scheduled_start, actual_start, status,
          current_appointment_id, current_delay_minutes, avg_consultation_duration_minutes,
          buffer_available_minutes, emergency_adjustment_count, cancellation_notice
        ) VALUES (
          @doctorId, @branchId, @date, @scheduledStart, @actualStart, @status,
          @currentAppointmentId, @currentDelayMinutes, @avgConsultationDurationMinutes,
          @bufferAvailableMinutes, @emergencyAdjustmentCount, @cancellationNotice
        )
      `);
      for (const ses of seed.sessions) {
        insertSession.run({
          doctorId: ses.doctorId,
          branchId: ses.branchId,
          date: ses.date,
          scheduledStart: ses.scheduledStart,
          actualStart: ses.actualStart || null,
          status: ses.status,
          currentAppointmentId: ses.currentAppointmentId || null,
          currentDelayMinutes: ses.currentDelayMinutes || 0,
          avgConsultationDurationMinutes: ses.avgConsultationDurationMinutes || 15,
          bufferAvailableMinutes: ses.bufferAvailableMinutes || 0,
          emergencyAdjustmentCount: ses.emergencyAdjustmentCount || 0,
          cancellationNotice: ses.cancellationNotice || null,
        });
      }

      // Config
      const insertConfig = this.db.prepare(`
        INSERT INTO system_config (
          id, slot_duration_minutes, arrival_before_appointment_minutes, reschedule_cutoff_minutes,
          late_grace_period_minutes, no_show_threshold_minutes, buffer_minutes_per_hour,
          notification_trigger_children_count, simulated_time, simulated_date, is_simulated_clock_active
        ) VALUES (
          'primary', @slotDurationMinutes, @arrivalBeforeAppointmentMinutes, @rescheduleCutoffMinutes,
          @lateGracePeriodMinutes, @noShowThresholdMinutes, @bufferMinutesPerHour,
          @notificationTriggerChildrenCount, @simulatedTime, @simulatedDate, @isSimulatedClockActive
        )
      `);
      insertConfig.run({
        ...seed.config,
        isSimulatedClockActive: seed.config.isSimulatedClockActive ? 1 : 0,
      });

      // Gallery
      const insertGallery = this.db.prepare(`
        INSERT INTO gallery (id, title, category, image_url, caption, display_order, active)
        VALUES (@id, @title, @category, @imageUrl, @caption, @displayOrder, @active)
      `);
      for (const g of seed.gallery) {
        insertGallery.run({
          id: g.id,
          title: g.title,
          category: g.category,
          imageUrl: g.imageUrl,
          caption: g.caption,
          displayOrder: g.displayOrder,
          active: g.active ? 1 : 0,
        });
      }

      // Reviews
      const insertReview = this.db.prepare(`
        INSERT INTO reviews (id, parent_name, child_name, rating, date, branch, comment, featured)
        VALUES (@id, @parentName, @childName, @rating, @date, @branch, @comment, @featured)
      `);
      for (const r of seed.reviews) {
        insertReview.run({
          id: r.id,
          parentName: r.parentName,
          childName: r.childName || null,
          rating: r.rating,
          date: r.date,
          branch: r.branch,
          comment: r.comment,
          featured: r.featured ? 1 : 0,
        });
      }

      // Notifications
      const insertNotif = this.db.prepare(`
        INSERT INTO notifications (id, appointment_id, parent_id, title, message, type, timestamp, read)
        VALUES (@id, @appointmentId, @parentId, @title, @message, @type, @timestamp, @read)
      `);
      for (const n of seed.notifications) {
        insertNotif.run({
          ...n,
          read: n.read ? 1 : 0,
        });
      }
    });

    tx();
  }

  public loadState(): DatabaseState {
    // Parents & Children
    const parentRows = this.db.prepare('SELECT * FROM parents').all() as any[];
    const childRows = this.db.prepare('SELECT * FROM children').all() as any[];
    const parentPasswords: Record<string, string> = {};

    const childrenByParent = new Map<string, Child[]>();
    for (const c of childRows) {
      const list = childrenByParent.get(c.parent_id) || [];
      list.push({
        id: c.id,
        parentId: c.parent_id,
        name: c.name,
        gender: c.gender || undefined,
        ageYears: c.age_years ?? undefined,
      });
      childrenByParent.set(c.parent_id, list);
    }

    const parents: Parent[] = parentRows.map((p) => {
      parentPasswords[p.mobile] = p.password_hash;
      return {
        id: p.id,
        name: p.name,
        mobile: p.mobile,
        children: childrenByParent.get(p.id) || [],
      };
    });

    // Reception Users
    const receptionRows = this.db.prepare('SELECT * FROM reception_users').all() as any[];
    const receptionUsers = receptionRows.map((r) => ({
      username: r.username,
      password: r.password,
      branchId: r.branch_id,
      name: r.name,
    }));

    // Doctors
    const doctorRows = this.db.prepare('SELECT * FROM doctors').all() as any[];
    const doctors: Doctor[] = doctorRows.map((d) => ({
      id: d.id,
      name: d.name,
      photoUrl: d.photo_url,
      qualifications: d.qualifications,
      specialty: d.specialty,
      experienceYears: d.experience_years,
      summary: d.summary,
      branches: JSON.parse(d.branches_json),
      active: d.active === 1,
      scheduleDescription: d.schedule_description || undefined,
    }));

    // Branches
    const branchRows = this.db.prepare('SELECT * FROM branches').all() as any[];
    const branches: HospitalBranch[] = branchRows.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      landmark: b.landmark,
      phone: b.phone,
      emergencyPhone: b.emergency_phone,
      timings: b.timings,
      mapEmbedUrl: b.map_embed_url || undefined,
      googleMapsUrl: b.google_maps_url,
    }));

    // Doctor Schedules
    const scheduleRows = this.db.prepare('SELECT * FROM doctor_schedules').all() as any[];
    const schedules: DoctorSchedule[] = scheduleRows.map((s) => ({
      id: s.id,
      doctorId: s.doctor_id,
      branchId: s.branch_id,
      daysOfWeek: JSON.parse(s.days_of_week_json),
      startTime: s.start_time,
      endTime: s.end_time,
      slotDurationMinutes: s.slot_duration_minutes,
      bufferMinutesPerHour: s.buffer_minutes_per_hour,
      isAvailable: s.is_available === 1,
      notes: s.notes || undefined,
    }));

    // Appointments
    const apptRows = this.db.prepare('SELECT * FROM appointments ORDER BY date ASC, booked_time ASC').all() as any[];
    const appointments: Appointment[] = apptRows.map((a) => ({
      id: a.id,
      appointmentNumber: a.appointment_number,
      childId: a.child_id,
      childName: a.child_name,
      parentId: a.parent_id,
      parentName: a.parent_name,
      parentMobile: a.parent_mobile,
      doctorId: a.doctor_id,
      doctorName: a.doctor_name,
      branchId: a.branch_id,
      branchName: a.branch_name,
      date: a.date,
      bookedTime: a.booked_time,
      expectedConsultationTime: a.expected_consultation_time,
      recommendedArrivalTime: a.recommended_arrival_time,
      status: a.status,
      paymentStatus: a.payment_status,
      bookingSource: a.booking_source,
      advanceNoticePreferenceMinutes: a.advance_notice_preference_minutes,
      isEmergency: a.is_emergency === 1,
      emergencyReason: a.emergency_reason || undefined,
      actualArrivalTime: a.actual_arrival_time || undefined,
      consultationStartTime: a.consultation_start_time || undefined,
      consultationEndTime: a.consultation_end_time || undefined,
      consultationDurationMinutes: a.consultation_duration_minutes ?? undefined,
      delayExplanation: a.delay_explanation || undefined,
      rescheduledFromAppointmentId: a.rescheduled_from_appointment_id || undefined,
      positionInQueue: a.position_in_queue ?? undefined,
      childrenAhead: a.childrenAhead ?? a.children_ahead ?? undefined,
      history: JSON.parse(a.history_json || '[]'),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    // Sessions
    const sessionRows = this.db.prepare('SELECT * FROM doctor_sessions').all() as any[];
    const sessions: DoctorSession[] = sessionRows.map((s) => ({
      doctorId: s.doctor_id,
      branchId: s.branch_id,
      date: s.date,
      scheduledStart: s.scheduled_start,
      actualStart: s.actual_start || undefined,
      status: s.status,
      currentAppointmentId: s.current_appointment_id || undefined,
      currentDelayMinutes: s.current_delay_minutes,
      avgConsultationDurationMinutes: s.avg_consultation_duration_minutes,
      bufferAvailableMinutes: s.buffer_available_minutes,
      emergencyAdjustmentCount: s.emergency_adjustment_count,
      cancellationNotice: s.cancellation_notice || undefined,
    }));

    // Config
    const configRow = this.db.prepare("SELECT * FROM system_config WHERE id = 'primary'").get() as any;
    const config: SystemConfiguration = configRow
      ? {
          slotDurationMinutes: configRow.slot_duration_minutes,
          arrivalBeforeAppointmentMinutes: configRow.arrival_before_appointment_minutes,
          rescheduleCutoffMinutes: configRow.reschedule_cutoff_minutes,
          lateGracePeriodMinutes: configRow.late_grace_period_minutes,
          noShowThresholdMinutes: configRow.no_show_threshold_minutes,
          bufferMinutesPerHour: configRow.buffer_minutes_per_hour,
          notificationTriggerChildrenCount: configRow.notification_trigger_children_count,
          simulatedTime: configRow.simulated_time,
          simulatedDate: configRow.simulated_date,
          isSimulatedClockActive: configRow.is_simulated_clock_active === 1,
        }
      : {
          slotDurationMinutes: 15,
          arrivalBeforeAppointmentMinutes: 15,
          rescheduleCutoffMinutes: 60,
          lateGracePeriodMinutes: 15,
          noShowThresholdMinutes: 30,
          bufferMinutesPerHour: 10,
          notificationTriggerChildrenCount: 2,
          simulatedTime: '10:15',
          simulatedDate: new Date().toISOString().split('T')[0],
          isSimulatedClockActive: true,
        };

    // Gallery
    const galleryRows = this.db.prepare('SELECT * FROM gallery ORDER BY display_order ASC').all() as any[];
    const gallery: GalleryItem[] = galleryRows.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      imageUrl: g.image_url,
      caption: g.caption,
      displayOrder: g.display_order,
      active: g.active === 1,
    }));

    // Reviews
    const reviewRows = this.db.prepare('SELECT * FROM reviews').all() as any[];
    const reviews: HospitalReview[] = reviewRows.map((r) => ({
      id: r.id,
      parentName: r.parent_name,
      childName: r.child_name || undefined,
      rating: r.rating,
      date: r.date,
      branch: r.branch,
      comment: r.comment,
      featured: r.featured === 1,
    }));

    // Notifications
    const notifRows = this.db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC').all() as any[];
    const notifications: NotificationItem[] = notifRows.map((n) => ({
      id: n.id,
      appointmentId: n.appointment_id,
      parentId: n.parent_id,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      read: n.read === 1,
    }));

    return {
      parents,
      parentPasswords,
      receptionUsers,
      doctors,
      branches,
      schedules,
      appointments,
      sessions,
      config,
      gallery,
      reviews,
      notifications,
    };
  }

  // --- Granular persistence methods ---

  public upsertParent(parent: Parent, password?: string): void {
    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO parents (id, name, mobile, password_hash)
        VALUES (@id, @name, @mobile, @password_hash)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          mobile = excluded.mobile,
          password_hash = COALESCE(excluded.password_hash, parents.password_hash)
      `).run({
        id: parent.id,
        name: parent.name,
        mobile: parent.mobile,
        password_hash: password || 'Test@123',
      });

      // Synchronize children
      const deleteChildren = this.db.prepare('DELETE FROM children WHERE parent_id = ?');
      deleteChildren.run(parent.id);

      const insertChild = this.db.prepare(`
        INSERT INTO children (id, parent_id, name, gender, age_years)
        VALUES (@id, @parentId, @name, @gender, @ageYears)
      `);
      for (const c of parent.children) {
        insertChild.run({
          id: c.id,
          parentId: parent.id,
          name: c.name,
          gender: c.gender || null,
          ageYears: c.ageYears ?? null,
        });
      }
    });

    tx();
  }

  public upsertAppointment(a: Appointment): void {
    this.db.prepare(`
      INSERT INTO appointments (
        id, appointment_number, child_id, child_name, parent_id, parent_name, parent_mobile,
        doctor_id, doctor_name, branch_id, branch_name, date, booked_time,
        expected_consultation_time, recommended_arrival_time, status, payment_status,
        booking_source, advance_notice_preference_minutes, is_emergency, emergency_reason,
        actual_arrival_time, consultation_start_time, consultation_end_time,
        consultation_duration_minutes, delay_explanation, rescheduled_from_appointment_id,
        position_in_queue, children_ahead, history_json, created_at, updated_at
      ) VALUES (
        @id, @appointmentNumber, @childId, @childName, @parentId, @parentName, @parentMobile,
        @doctorId, @doctorName, @branchId, @branchName, @date, @bookedTime,
        @expectedConsultationTime, @recommendedArrivalTime, @status, @paymentStatus,
        @bookingSource, @advanceNoticePreferenceMinutes, @isEmergency, @emergencyReason,
        @actualArrivalTime, @consultationStartTime, @consultationEndTime,
        @consultationDurationMinutes, @delayExplanation, @rescheduledFromAppointmentId,
        @positionInQueue, @childrenAhead, @historyJson, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        expected_consultation_time = excluded.expected_consultation_time,
        recommended_arrival_time = excluded.recommended_arrival_time,
        status = excluded.status,
        payment_status = excluded.payment_status,
        is_emergency = excluded.is_emergency,
        emergency_reason = excluded.emergency_reason,
        actual_arrival_time = excluded.actual_arrival_time,
        consultation_start_time = excluded.consultation_start_time,
        consultation_end_time = excluded.consultation_end_time,
        consultation_duration_minutes = excluded.consultation_duration_minutes,
        delay_explanation = excluded.delay_explanation,
        rescheduled_from_appointment_id = excluded.rescheduled_from_appointment_id,
        position_in_queue = excluded.position_in_queue,
        children_ahead = excluded.children_ahead,
        history_json = excluded.history_json,
        updated_at = excluded.updated_at
    `).run({
      id: a.id,
      appointmentNumber: a.appointmentNumber,
      childId: a.childId,
      childName: a.childName,
      parentId: a.parentId,
      parentName: a.parentName,
      parentMobile: a.parentMobile,
      doctorId: a.doctorId,
      doctorName: a.doctorName,
      branchId: a.branchId,
      branchName: a.branchName,
      date: a.date,
      bookedTime: a.bookedTime,
      expectedConsultationTime: a.expectedConsultationTime,
      recommendedArrivalTime: a.recommendedArrivalTime,
      status: a.status,
      paymentStatus: a.paymentStatus,
      bookingSource: a.bookingSource,
      advanceNoticePreferenceMinutes: a.advanceNoticePreferenceMinutes || 30,
      isEmergency: a.isEmergency ? 1 : 0,
      emergencyReason: a.emergencyReason || null,
      actualArrivalTime: a.actualArrivalTime || null,
      consultationStartTime: a.consultationStartTime || null,
      consultationEndTime: a.consultationEndTime || null,
      consultationDurationMinutes: a.consultationDurationMinutes ?? null,
      delayExplanation: a.delayExplanation || null,
      rescheduledFromAppointmentId: a.rescheduledFromAppointmentId || null,
      positionInQueue: a.positionInQueue ?? null,
      childrenAhead: a.childrenAhead ?? null,
      historyJson: JSON.stringify(a.history || []),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    });
  }

  public upsertSession(s: DoctorSession): void {
    this.db.prepare(`
      INSERT INTO doctor_sessions (
        doctor_id, branch_id, date, scheduled_start, actual_start, status,
        current_appointment_id, current_delay_minutes, avg_consultation_duration_minutes,
        buffer_available_minutes, emergency_adjustment_count, cancellation_notice
      ) VALUES (
        @doctorId, @branchId, @date, @scheduledStart, @actualStart, @status,
        @currentAppointmentId, @currentDelayMinutes, @avgConsultationDurationMinutes,
        @bufferAvailableMinutes, @emergencyAdjustmentCount, @cancellationNotice
      )
      ON CONFLICT(doctor_id, branch_id, date) DO UPDATE SET
        actual_start = excluded.actual_start,
        status = excluded.status,
        current_appointment_id = excluded.current_appointment_id,
        current_delay_minutes = excluded.current_delay_minutes,
        avg_consultation_duration_minutes = excluded.avg_consultation_duration_minutes,
        buffer_available_minutes = excluded.buffer_available_minutes,
        emergency_adjustment_count = excluded.emergency_adjustment_count,
        cancellation_notice = excluded.cancellation_notice
    `).run({
      doctorId: s.doctorId,
      branchId: s.branchId,
      date: s.date,
      scheduledStart: s.scheduledStart,
      actualStart: s.actualStart || null,
      status: s.status,
      currentAppointmentId: s.currentAppointmentId || null,
      currentDelayMinutes: s.currentDelayMinutes || 0,
      avgConsultationDurationMinutes: s.avgConsultationDurationMinutes || 15,
      bufferAvailableMinutes: s.bufferAvailableMinutes || 0,
      emergencyAdjustmentCount: s.emergencyAdjustmentCount || 0,
      cancellationNotice: s.cancellationNotice || null,
    });
  }

  public upsertConfig(cfg: SystemConfiguration): void {
    this.db.prepare(`
      INSERT INTO system_config (
        id, slot_duration_minutes, arrival_before_appointment_minutes, reschedule_cutoff_minutes,
        late_grace_period_minutes, no_show_threshold_minutes, buffer_minutes_per_hour,
        notification_trigger_children_count, simulated_time, simulated_date, is_simulated_clock_active
      ) VALUES (
        'primary', @slotDurationMinutes, @arrivalBeforeAppointmentMinutes, @rescheduleCutoffMinutes,
        @lateGracePeriodMinutes, @noShowThresholdMinutes, @bufferMinutesPerHour,
        @notificationTriggerChildrenCount, @simulatedTime, @simulatedDate, @isSimulatedClockActive
      )
      ON CONFLICT(id) DO UPDATE SET
        slot_duration_minutes = excluded.slot_duration_minutes,
        arrival_before_appointment_minutes = excluded.arrival_before_appointment_minutes,
        reschedule_cutoff_minutes = excluded.reschedule_cutoff_minutes,
        late_grace_period_minutes = excluded.late_grace_period_minutes,
        no_show_threshold_minutes = excluded.no_show_threshold_minutes,
        buffer_minutes_per_hour = excluded.buffer_minutes_per_hour,
        notification_trigger_children_count = excluded.notification_trigger_children_count,
        simulated_time = excluded.simulated_time,
        simulated_date = excluded.simulated_date,
        is_simulated_clock_active = excluded.is_simulated_clock_active
    `).run({
      ...cfg,
      isSimulatedClockActive: cfg.isSimulatedClockActive ? 1 : 0,
    });
  }

  public insertNotification(n: NotificationItem): void {
    this.db.prepare(`
      INSERT INTO notifications (id, appointment_id, parent_id, title, message, type, timestamp, read)
      VALUES (@id, @appointmentId, @parentId, @title, @message, @type, @timestamp, @read)
    `).run({
      ...n,
      read: n.read ? 1 : 0,
    });
  }
}
