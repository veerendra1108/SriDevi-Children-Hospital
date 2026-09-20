import {
  Parent,
  Child,
  Doctor,
  DoctorAccount,
  HospitalBranch,
  DoctorSchedule,
  Appointment,
  DoctorSession,
  SystemConfiguration,
  GalleryItem,
  HospitalReview,
  NotificationItem,
  VaccinationDose,
  ChildVaccinationProgram,
  VaccineCallReminderLog,
  ChildAllergy,
  ChildCondition,
  Encounter,
  PediatricGrowthRecord,
  ClinicalCorrectionRequest,
  ClinicalAuditLog,
} from '../src/types/index.js';
import { SqliteManager } from './sqlite.js';
import { IAP_2018_SCHEDULE_MASTER, addDays } from './vaccineScheduleData.js';

export interface DatabaseState {
  parents: Parent[];
  parentPasswords: Record<string, string>; // mobile -> password
  receptionUsers: {
    username: string;
    password: string;
    branchId: 'kakinada' | 'pithapuram';
    name: string;
  }[];
  doctors: Doctor[];
  doctorAccounts: DoctorAccount[];
  doctorPasswords: Record<string, string>; // doctorId -> password
  doctorSessionsAuth: { token: string; doctorId: string; expiresAt: string }[];
  branches: HospitalBranch[];
  schedules: DoctorSchedule[];
  appointments: Appointment[];
  sessions: DoctorSession[];
  config: SystemConfiguration;
  gallery: GalleryItem[];
  reviews: HospitalReview[];
  notifications: NotificationItem[];
  vaccinationPrograms: ChildVaccinationProgram[];
  vaccineReminderLogs: VaccineCallReminderLog[];
  allergies: ChildAllergy[];
  conditions: ChildCondition[];
  encounters: Encounter[];
  growthRecords: PediatricGrowthRecord[];
  correctionRequests: ClinicalCorrectionRequest[];
  auditLogs: ClinicalAuditLog[];
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialSeedData(): DatabaseState {
  const parents: Parent[] = [
    {
      id: 'p1',
      name: 'Ravi Kumar',
      mobile: '9000000001',
      children: [
        { id: 'c1-1', permanentId: 'DM-SDCH-000101', parentId: 'p1', name: 'Aarav Kumar', gender: 'Boy', dateOfBirth: '2022-07-15', bloodGroup: 'O+', ageYears: 4, hospitalId: 'sdch' },
        { id: 'c1-2', permanentId: 'DM-SDCH-000102', parentId: 'p1', name: 'Diya Kumar', gender: 'Girl', dateOfBirth: '2024-03-10', bloodGroup: 'B+', ageYears: 2, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p2',
      name: 'Suresh Babu',
      mobile: '9000000002',
      children: [
        { id: 'c2-1', permanentId: 'DM-SDCH-000103', parentId: 'p2', name: 'Vihaan Babu', gender: 'Boy', dateOfBirth: '2023-01-20', bloodGroup: 'A+', ageYears: 3, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p3',
      name: 'Lakshmi Devi',
      mobile: '9000000003',
      children: [
        { id: 'c3-1', permanentId: 'DM-SDCH-000104', parentId: 'p3', name: 'Ananya Devi', gender: 'Girl', dateOfBirth: '2021-11-05', bloodGroup: 'AB+', ageYears: 4, hospitalId: 'sdch' },
        { id: 'c3-2', permanentId: 'DM-SDCH-000105', parentId: 'p3', name: 'Aditya Devi', gender: 'Boy', dateOfBirth: '2025-02-14', bloodGroup: 'O+', ageYears: 1, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p4',
      name: 'Rajesh Kumar',
      mobile: '9000000004',
      children: [
        { id: 'c4-1', permanentId: 'DM-SDCH-000106', parentId: 'p4', name: 'Ishaan Kumar', gender: 'Boy', dateOfBirth: '2022-09-18', bloodGroup: 'B+', ageYears: 4, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p5',
      name: 'Priya Rao',
      mobile: '9000000005',
      children: [
        { id: 'c5-1', permanentId: 'DM-SDCH-000107', parentId: 'p5', name: 'Myra Rao', gender: 'Girl', dateOfBirth: '2023-05-30', bloodGroup: 'A-', ageYears: 3, hospitalId: 'sdch' },
        { id: 'c5-2', permanentId: 'DM-SDCH-000108', parentId: 'p5', name: 'Riya Rao', gender: 'Girl', dateOfBirth: '2025-06-12', bloodGroup: 'O+', ageYears: 1, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p6',
      name: 'Mahesh',
      mobile: '9000000006',
      consecutiveNoShows: 2,
      isBlocked: false,
      children: [
        { id: 'c6-1', permanentId: 'DM-SDCH-000109', parentId: 'p6', name: 'Arjun', gender: 'Boy', dateOfBirth: '2023-08-25', bloodGroup: 'B+', ageYears: 3, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p7',
      name: 'Sravani',
      mobile: '9000000007',
      children: [
        { id: 'c7-1', permanentId: 'DM-SDCH-000110', parentId: 'p7', name: 'Kavya', gender: 'Girl', dateOfBirth: '2022-01-11', bloodGroup: 'O+', ageYears: 4, hospitalId: 'sdch' },
        { id: 'c7-2', permanentId: 'DM-SDCH-000111', parentId: 'p7', name: 'Karthik', gender: 'Boy', dateOfBirth: '2024-08-20', bloodGroup: 'A+', ageYears: 2, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p8',
      name: 'Venkatesh',
      mobile: '9000000008',
      children: [
        { id: 'c8-1', permanentId: 'DM-SDCH-000112', parentId: 'p8', name: 'Sai', gender: 'Boy', dateOfBirth: '2023-04-10', bloodGroup: 'B+', ageYears: 3, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p9',
      name: 'Deepika',
      mobile: '9000000009',
      children: [
        { id: 'c9-1', permanentId: 'DM-SDCH-000113', parentId: 'p9', name: 'Tara', gender: 'Girl', dateOfBirth: '2022-12-05', bloodGroup: 'O+', ageYears: 3, hospitalId: 'sdch' },
        { id: 'c9-2', permanentId: 'DM-SDCH-000114', parentId: 'p9', name: 'Nikhil', gender: 'Boy', dateOfBirth: '2024-10-15', bloodGroup: 'AB+', ageYears: 1, hospitalId: 'sdch' },
      ],
    },
    {
      id: 'p10',
      name: 'Praveen',
      mobile: '9000000010',
      children: [
        { id: 'c10-1', permanentId: 'DM-SDCH-000115', parentId: 'p10', name: 'Anika', gender: 'Girl', dateOfBirth: '2023-06-18', bloodGroup: 'B+', ageYears: 3, hospitalId: 'sdch' },
      ],
    },
  ];

  const parentPasswords: Record<string, string> = {
    '9000000001': 'Test@123',
    '9000000002': 'Test@123',
    '9000000003': 'Test@123',
    '9000000004': 'Test@123',
    '9000000005': 'Test@123',
    '9000000006': 'Test@123',
    '9000000007': 'Test@123',
    '9000000008': 'Test@123',
    '9000000009': 'Test@123',
    '9000000010': 'Test@123',
  };

  const receptionUsers = [
    {
      username: 'reception.kakinada',
      password: 'Reception@123',
      branchId: 'kakinada' as const,
      name: 'Kakinada Frontdesk',
    },
    {
      username: 'reception.pithapuram',
      password: 'Reception@123',
      branchId: 'pithapuram' as const,
      name: 'Pithapuram Frontdesk',
    },
  ];

  const doctors: Doctor[] = [
    {
      id: 'dr-subba-rao',
      name: 'Dr. Subba Rao Vadarevu',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
      qualifications: 'MBBS, MD (Pediatrics), DCH',
      specialty: 'Senior Pediatric Specialist & Neonatal Care',
      experienceYears: 28,
      summary: 'Dr. Subba Rao Vadarevu has been caring for infants, children, and adolescents with unmatched clinical attentiveness and generational trust across Godavari districts.',
      branches: ['kakinada', 'pithapuram'],
      active: true,
      scheduleDescription: 'Daily consultation sessions from 10:00 AM to 07:00 PM across hospital branches.',
      medicalRegistrationNo: 'APMC-38492',
      mobile: '9440112233',
      email: 'subbarao@drsridevichildren.com',
      digitalSignatureUrl: '/signatures/dr-subba-rao.png',
    },
    {
      id: 'dr-prashant',
      name: 'Dr. Prashant',
      photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
      qualifications: 'MBBS, DNB (Pediatrics), Fellowship in Neonatology',
      specialty: 'Consultant Pediatrician & Child Health Specialist',
      experienceYears: 14,
      summary: 'Specializing in pediatric development, immunization tracking, and acute childhood illnesses with calm, parent-friendly guidance.',
      branches: ['kakinada', 'pithapuram'],
      active: true,
      scheduleDescription: 'Daily consultation sessions from 10:00 AM to 07:00 PM across hospital branches.',
      medicalRegistrationNo: 'APMC-61204',
      mobile: '9440112244',
      email: 'prashant@drsridevichildren.com',
      digitalSignatureUrl: '/signatures/dr-prashant.png',
    },
  ];

  const doctorAccounts: DoctorAccount[] = [
    {
      id: 'dr-subba-rao',
      doctorId: 'dr-subba-rao',
      name: 'Dr. Subba Rao Vadarevu',
      email: 'subbarao@drsridevichildren.com',
      mobile: '9440112233',
      medicalRegistrationNo: 'APMC-38492',
      digitalSignatureUrl: '/signatures/dr-subba-rao.png',
      isApproved: true,
      isActive: true,
    },
    {
      id: 'dr-prashant',
      doctorId: 'dr-prashant',
      name: 'Dr. Prashant',
      email: 'prashant@drsridevichildren.com',
      mobile: '9440112244',
      medicalRegistrationNo: 'APMC-61204',
      digitalSignatureUrl: '/signatures/dr-prashant.png',
      isApproved: true,
      isActive: true,
    },
  ];

  const doctorPasswords: Record<string, string> = {
    'dr-subba-rao': 'Doctor@123',
    'dr-prashant': 'Doctor@123',
  };

  const branches: HospitalBranch[] = [
    {
      id: 'kakinada',
      name: 'Sri Devi Children Hospital - Kakinada',
      address: 'Near Rama Rao Peta, Main Road, Kakinada, Andhra Pradesh 533004',
      landmark: 'Near Government General Hospital / Medical College Junction',
      phone: '+91 884 237 8899',
      emergencyPhone: '+91 944 011 2233',
      timings: 'Daily: 10:00 AM - 07:00 PM (Emergency 24/7)',
      googleMapsUrl: 'https://maps.google.com/?q=Sri+Devi+Children+Hospital+Kakinada',
    },
    {
      id: 'pithapuram',
      name: 'Sri Devi Children Hospital - Pithapuram',
      address: 'Station Road, Opp. Municipal Complex, Pithapuram, Andhra Pradesh 533450',
      landmark: 'Near RTC Bus Complex & Temple Arch Road',
      phone: '+91 8869 252 777',
      emergencyPhone: '+91 944 011 2244',
      timings: 'Daily: 10:00 AM - 07:00 PM (Emergency open)',
      googleMapsUrl: 'https://maps.google.com/?q=Sri+Devi+Children+Hospital+Pithapuram',
    },
  ];

  const schedules: DoctorSchedule[] = [
    {
      id: 'sch-1',
      doctorId: 'dr-subba-rao',
      branchId: 'kakinada',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily (Sun-Sat)
      startTime: '10:00',
      endTime: '19:00',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Daily consultation session in Kakinada',
    },
    {
      id: 'sch-2',
      doctorId: 'dr-subba-rao',
      branchId: 'pithapuram',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily (Sun-Sat)
      startTime: '10:00',
      endTime: '19:00',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Daily consultation session in Pithapuram',
    },
    {
      id: 'sch-3',
      doctorId: 'dr-prashant',
      branchId: 'kakinada',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily (Sun-Sat)
      startTime: '10:00',
      endTime: '19:00',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Daily consultation session in Kakinada',
    },
    {
      id: 'sch-4',
      doctorId: 'dr-prashant',
      branchId: 'pithapuram',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily (Sun-Sat)
      startTime: '10:00',
      endTime: '19:00',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Daily consultation session in Pithapuram',
    },
  ];

  // Today's date in local YYYY-MM-DD
  const today = getLocalDateString();
  const [yyyy, mm, dd] = today.split('-');
  const ddmmyy = `${dd}${mm}${yyyy.slice(-2)}`;

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrow = getLocalDateString(tomorrowObj);
  const [tY, tM, tD] = tomorrow.split('-');
  const tmrwDdmmyy = `${tD}${tM}${tY.slice(-2)}`;

  const config: SystemConfiguration = {
    slotDurationMinutes: 15,
    arrivalBeforeAppointmentMinutes: 15,
    rescheduleCutoffMinutes: 60,
    lateGracePeriodMinutes: 15,
    noShowThresholdMinutes: 30,
    bufferMinutesPerHour: 10,
    notificationTriggerChildrenCount: 2,
    simulatedTime: '10:20',
    simulatedDate: today,
    isSimulatedClockActive: true,
  };

  const sessions: DoctorSession[] = [
    {
      doctorId: 'dr-subba-rao',
      branchId: 'kakinada',
      date: today,
      scheduledStart: '10:00',
      actualStart: '10:08', // Started 8 minutes late
      status: 'IN_SESSION',
      currentAppointmentId: 'apt-2',
      currentDelayMinutes: 12,
      avgConsultationDurationMinutes: 14,
      bufferAvailableMinutes: 20,
      emergencyAdjustmentCount: 0,
    },
    {
      doctorId: 'dr-prashant',
      branchId: 'kakinada',
      date: today,
      scheduledStart: '10:00',
      actualStart: '10:00',
      status: 'IN_SESSION',
      currentAppointmentId: undefined,
      currentDelayMinutes: 0,
      avgConsultationDurationMinutes: 12,
      bufferAvailableMinutes: 25,
      emergencyAdjustmentCount: 0,
    },
  ];

  const appointments: Appointment[] = [
    // Scenario 1: Patient 1 (Aarav, Ravi Kumar) - 10:00 AM. Arrived early (09:45 AM). Completed consultation!
    {
      id: 'apt-1',
      appointmentNumber: `SD-K-${ddmmyy}-1000`,
      childId: 'c1-1',
      childName: 'Aarav Kumar',
      parentId: 'p1',
      parentName: 'Ravi Kumar',
      parentMobile: '9000000001',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '10:00',
      expectedConsultationTime: '10:08',
      recommendedArrivalTime: '09:45',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      actualArrivalTime: '09:44',
      consultationStartTime: '10:08',
      consultationEndTime: '10:22',
      consultationDurationMinutes: 14,
      history: [
        { timestamp: `${today} 08:00`, status: 'BOOKED', note: 'Booked online' },
        { timestamp: `${today} 09:44`, status: 'ARRIVED', note: 'Checked in by reception; payment confirmed' },
        { timestamp: `${today} 10:08`, status: 'WITH_DOCTOR', note: 'Consultation initiated' },
        { timestamp: `${today} 10:22`, status: 'COMPLETED', note: 'Consultation concluded' },
      ],
      createdAt: `${today} 08:00:00`,
      updatedAt: `${today} 10:22:00`,
    },

    // Scenario 2: Patient 2 (Vihaan, Suresh Babu) - 10:15 AM. Arrived 10 mins late (10:25), currently WITH DOCTOR!
    {
      id: 'apt-2',
      appointmentNumber: `SD-K-${ddmmyy}-1015`,
      childId: 'c2-1',
      childName: 'Vihaan Babu',
      parentId: 'p2',
      parentName: 'Suresh Babu',
      parentMobile: '9000000002',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '10:15',
      expectedConsultationTime: '10:23',
      recommendedArrivalTime: '10:00',
      status: 'WITH_DOCTOR',
      paymentStatus: 'PAID',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      actualArrivalTime: '10:21',
      consultationStartTime: '10:23',
      history: [
        { timestamp: `${today} 08:15`, status: 'BOOKED', note: 'Booked online' },
        { timestamp: `${today} 10:21`, status: 'ARRIVED', note: 'Arrived after slot time; receptionist admitted to queue' },
        { timestamp: `${today} 10:23`, status: 'WITH_DOCTOR', note: 'Sent to Dr. Subba Rao' },
      ],
      createdAt: `${today} 08:15:00`,
      updatedAt: `${today} 10:23:00`,
    },

    // Scenario 3: Patient 3 (Ananya, Lakshmi Devi) - 10:30 AM. Arrived on time, checked in & WAITING! Next patient in line.
    {
      id: 'apt-3',
      appointmentNumber: `SD-K-${ddmmyy}-1030`,
      childId: 'c3-1',
      childName: 'Ananya Devi',
      parentId: 'p3',
      parentName: 'Lakshmi Devi',
      parentMobile: '9000000003',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '10:30',
      expectedConsultationTime: '10:38',
      recommendedArrivalTime: '10:15',
      status: 'WAITING',
      paymentStatus: 'PAID',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      actualArrivalTime: '10:12',
      positionInQueue: 1,
      childrenAhead: 0,
      history: [
        { timestamp: `${today} 08:30`, status: 'BOOKED', note: 'Booked online' },
        { timestamp: `${today} 10:12`, status: 'ARRIVED', note: 'Checked in & fee paid' },
      ],
      createdAt: `${today} 08:30:00`,
      updatedAt: `${today} 10:12:00`,
    },

    // Scenario 4: Patient 4 (Ishaan, Rajesh Kumar) - 10:45 AM. Not checked in yet, approaching slot time.
    {
      id: 'apt-4',
      appointmentNumber: `SD-K-${ddmmyy}-1045`,
      childId: 'c4-1',
      childName: 'Ishaan Kumar',
      parentId: 'p4',
      parentName: 'Rajesh Kumar',
      parentMobile: '9000000004',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '10:45',
      expectedConsultationTime: '10:52',
      recommendedArrivalTime: '10:37',
      status: 'APPROACHING',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      positionInQueue: 2,
      childrenAhead: 1,
      history: [
        { timestamp: `${today} 08:45`, status: 'BOOKED', note: 'Booked online' },
        { timestamp: `${today} 10:00`, status: 'APPROACHING', note: 'Alert triggered: 2 children ahead' },
      ],
      createdAt: `${today} 08:45:00`,
      updatedAt: `${today} 10:00:00`,
    },

    // Scenario 5: Patient 5 (Myra, Priya Rao) - 11:00 AM. Booked, tracking queue from home!
    {
      id: 'apt-5',
      appointmentNumber: `SD-K-${ddmmyy}-1100`,
      childId: 'c5-1',
      childName: 'Myra Rao',
      parentId: 'p5',
      parentName: 'Priya Rao',
      parentMobile: '9000000005',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '11:00',
      expectedConsultationTime: '11:12', // Doctor running approx 12 mins late
      recommendedArrivalTime: '10:57',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      delayExplanation: 'Doctor running approximately 12 minutes late due to thorough case reviews.',
      positionInQueue: 3,
      childrenAhead: 2,
      history: [
        { timestamp: `${today} 09:00`, status: 'BOOKED', note: 'Booked online' },
      ],
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 6: Patient 6 (Arjun, Mahesh) - 11:15 AM. Booked via Telephone by receptionist.
    {
      id: 'apt-6',
      appointmentNumber: `SD-K-${ddmmyy}-1115`,
      childId: 'c6-1',
      childName: 'Arjun',
      parentId: 'p6',
      parentName: 'Mahesh',
      parentMobile: '9000000006',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '11:15',
      expectedConsultationTime: '11:27',
      recommendedArrivalTime: '11:12',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'RECEPTION_PHONE',
      advanceNoticePreferenceMinutes: 30,
      positionInQueue: 4,
      childrenAhead: 3,
      history: [
        { timestamp: `${today} 09:10`, status: 'BOOKED', note: 'Booked over phone by receptionist' },
      ],
      createdAt: `${today} 09:10:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 7: Patient 7 (Kavya, Sravani) - 11:30 AM.
    {
      id: 'apt-7',
      appointmentNumber: `SD-K-${ddmmyy}-1130`,
      childId: 'c7-1',
      childName: 'Kavya',
      parentId: 'p7',
      parentName: 'Sravani',
      parentMobile: '9000000007',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '11:30',
      expectedConsultationTime: '11:42',
      recommendedArrivalTime: '11:27',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      positionInQueue: 5,
      childrenAhead: 4,
      history: [
        { timestamp: `${today} 09:15`, status: 'BOOKED', note: 'Booked online' },
      ],
      createdAt: `${today} 09:15:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 8: Patient 8 (Sai, Venkatesh) - 11:45 AM.
    {
      id: 'apt-8',
      appointmentNumber: `SD-K-${ddmmyy}-1145`,
      childId: 'c8-1',
      childName: 'Sai',
      parentId: 'p8',
      parentName: 'Venkatesh',
      parentMobile: '9000000008',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '11:45',
      expectedConsultationTime: '11:55',
      recommendedArrivalTime: '11:40',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      positionInQueue: 6,
      childrenAhead: 5,
      history: [
        { timestamp: `${today} 09:20`, status: 'BOOKED', note: 'Booked online' },
      ],
      createdAt: `${today} 09:20:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 9: Patient 9 (Tara, Deepika) - 12:00 PM. Booked, reschedule cutoff >60 mins away!
    {
      id: 'apt-9',
      appointmentNumber: `SD-K-${ddmmyy}-1200`,
      childId: 'c9-1',
      childName: 'Tara',
      parentId: 'p9',
      parentName: 'Deepika',
      parentMobile: '9000000009',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '12:00',
      expectedConsultationTime: '12:05',
      recommendedArrivalTime: '11:50',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 45,
      positionInQueue: 7,
      childrenAhead: 6,
      history: [
        { timestamp: `${today} 09:25`, status: 'BOOKED', note: 'Booked online' },
      ],
      createdAt: `${today} 09:25:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 10: Patient 10 (Akhil, Praveen) - 12:15 PM.
    {
      id: 'apt-10',
      appointmentNumber: `SD-K-${ddmmyy}-1215`,
      childId: 'c10-1',
      childName: 'Akhil',
      parentId: 'p10',
      parentName: 'Praveen',
      parentMobile: '9000000010',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: today,
      bookedTime: '12:15',
      expectedConsultationTime: '12:15',
      recommendedArrivalTime: '12:00',
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      positionInQueue: 8,
      childrenAhead: 7,
      history: [
        { timestamp: `${today} 09:30`, status: 'BOOKED', note: 'Booked online' },
      ],
      createdAt: `${today} 09:30:00`,
      updatedAt: `${today} 10:15:00`,
    },

    // Scenario 11: Tomorrow's appointment for Ravi Kumar (9000000001) to test future date tracking
    {
      id: 'apt-11',
      appointmentNumber: `SD-K-${tmrwDdmmyy}-1115`,
      childId: 'c1-2',
      childName: 'Diya Kumar',
      parentId: 'p1',
      parentName: 'Ravi Kumar',
      parentMobile: '9000000001',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      branchName: 'Sri Devi Children Hospital - Kakinada',
      date: tomorrow,
      bookedTime: '11:15',
      expectedConsultationTime: '11:15',
      recommendedArrivalTime: '11:00',
      status: 'BOOKED',
      paymentStatus: 'PAID',
      bookingSource: 'ONLINE',
      advanceNoticePreferenceMinutes: 30,
      history: [
        { timestamp: `${today} 09:40`, status: 'BOOKED', note: 'Booked online for tomorrow' },
      ],
      createdAt: `${today} 09:40:00`,
      updatedAt: `${today} 09:40:00`,
    },
  ];

  const gallery: GalleryItem[] = [
    {
      id: 'gal-1',
      title: 'Pediatric Examination Suite',
      category: 'Facilities',
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      caption: 'Warm, calm, and sanitized clinical suites designed to put children at ease during consultation.',
      displayOrder: 1,
      active: true,
    },
    {
      id: 'gal-2',
      title: 'Senior Pediatrician in Consultation',
      category: 'Doctors',
      imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
      caption: 'Decades of experience guiding infant health, fever management, and nutritional growth.',
      displayOrder: 2,
      active: true,
    },
    {
      id: 'gal-3',
      title: 'Comfortable Waiting Lounge',
      category: 'Waiting Area',
      imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      caption: 'Spacious, well-ventilated lounge with live digital token status and parent seating.',
      displayOrder: 3,
      active: true,
    },
    {
      id: 'gal-4',
      title: 'Child-Friendly Activity Corner',
      category: 'Pediatric Care',
      imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      caption: 'Books and clean toys to keep toddlers cheerful during brief check-in intervals.',
      displayOrder: 4,
      active: true,
    },
    {
      id: 'gal-5',
      title: 'Modern Frontdesk & Patient Care',
      category: 'Hospital',
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      caption: 'Welcoming reception team assisting families with prompt check-in and queue guidance.',
      displayOrder: 5,
      active: true,
    },
    {
      id: 'gal-6',
      title: 'Neonatal & Child Wellness Ward',
      category: 'Facilities',
      imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
      caption: 'Equipped for rapid diagnosis, phototherapy, nebulization, and emergency pediatric stabilization.',
      displayOrder: 6,
      active: true,
    },
  ];

  const reviews: HospitalReview[] = [
    {
      id: 'rev-1',
      parentName: 'Srinivas Varma',
      childName: 'Baby Shravya',
      rating: 5,
      date: '3 days ago',
      branch: 'Kakinada',
      comment: 'Dr. Subba Rao garu treated my daughter with so much patience. Best part was checking the live queue from home and reaching right on time. We spent only 10 minutes at the hospital!',
      featured: true,
    },
    {
      id: 'rev-2',
      parentName: 'Bhavani Prasad',
      childName: 'Master Karthik',
      rating: 5,
      date: '1 week ago',
      branch: 'Kakinada',
      comment: 'Sri Devi Children Hospital has been our family doctor since my childhood. Now I bring my son here. The experience and personal touch cannot be matched by any corporate setup.',
      featured: true,
    },
    {
      id: 'rev-3',
      parentName: 'Madhavi Latha',
      childName: 'Baby Harshitha',
      rating: 5,
      date: '2 weeks ago',
      branch: 'Pithapuram',
      comment: 'Very reassuring doctors. Dr. Prashant explains everything so calmly to anxious parents. The appointment tracking saved us from sitting for hours with a sick child.',
      featured: true,
    },
    {
      id: 'rev-4',
      parentName: 'Venkat Ramana',
      childName: 'Master Teja',
      rating: 5,
      date: '3 weeks ago',
      branch: 'Kakinada',
      comment: 'Transparent timings and very respectful staff. Unlike other clinics where you sit for 3 hours, here the expected time updates dynamically. Highly recommended!',
      featured: true,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      appointmentId: 'apt-4',
      parentId: 'p4',
      title: 'Consultation Approaching',
      message: 'Your child\'s consultation is approaching. There are currently 2 children ahead of you. Please proceed to Sri Devi Children Hospital.',
      type: 'APPROACHING',
      timestamp: `${today} 10:00`,
      read: false,
    },
  ];

  // Helper to construct seed vaccination programs
  const buildSeedProgram = (
    childId: string,
    childName: string,
    childGender: 'Boy' | 'Girl',
    parentId: string,
    parentName: string,
    parentMobile: string,
    birthOffsetDaysAgo: number,
    completedMilestoneIds: string[]
  ): ChildVaccinationProgram => {
    const baselineBirthDate = addDays(today, -birthOffsetDaysAgo);

    const doses: VaccinationDose[] = IAP_2018_SCHEDULE_MASTER.map((m) => {
      const dueDate = addDays(baselineBirthDate, m.offsetDays);
      const isGiven = completedMilestoneIds.includes(m.id);
      const isPast = dueDate < today;
      const diffFromToday = Math.round(
        (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isDueSoon = !isPast && !isGiven && diffFromToday <= 15;

      return {
        id: `dose-${childId}-${m.id}`,
        milestoneId: m.id,
        ageLabel: m.ageLabel,
        vaccines: [...m.vaccines],
        dueDate,
        status: isGiven ? 'GIVEN' : isPast ? 'OVERDUE' : isDueSoon ? 'DUE_SOON' : 'PENDING',
        givenDate: isGiven ? dueDate : undefined,
        administeredBy: isGiven ? 'Dr. Subba Rao Vadarevu' : undefined,
        batchNumber: isGiven ? `SRI-VAC-${m.offsetDays || '00'}` : undefined,
        notes: isGiven ? 'Administered on schedule at Sri Devi Children Hospital.' : undefined,
        weightKg: isGiven ? (m.offsetDays === 0 ? 3.1 : m.offsetDays === 42 ? 4.5 : 5.8) : undefined,
        heightCm: isGiven ? (m.offsetDays === 0 ? 50 : m.offsetDays === 42 ? 55 : 61) : undefined,
      };
    });

    return {
      id: `vac-prog-${childId}`,
      childId,
      childName,
      childGender,
      parentId,
      parentName,
      parentMobile,
      registeredDate: baselineBirthDate,
      firstVaccineDate: baselineBirthDate,
      firstMilestoneId: 'birth',
      baselineBirthDate,
      registrationFeePaid: true,
      registrationAmount: 500,
      registeredByBranchId: 'kakinada',
      doses,
      createdAt: `${baselineBirthDate} 10:00:00`,
      updatedAt: `${today} 10:00:00`,
    };
  };

  const vaccinationPrograms: ChildVaccinationProgram[] = [
    // 1. Aarav Kumar: 10 weeks dose due in 5 days!
    buildSeedProgram(
      'c1-1',
      'Aarav Kumar',
      'Boy',
      'p1',
      'Ravi Kumar',
      '9000000001',
      65, // birth was 65 days ago, so 10w (+70d) is due in 5 days!
      ['birth', '6-weeks']
    ),
    // 2. Vihaan Babu: 14 weeks dose due in 11 days!
    buildSeedProgram(
      'c2-1',
      'Vihaan Babu',
      'Boy',
      'p2',
      'Suresh Babu',
      '9000000002',
      87, // birth was 87 days ago, so 14w (+98d) is due in 11 days!
      ['birth', '6-weeks', '10-weeks']
    ),
    // 3. Diya Kumar: 6 weeks dose due in 2 days!
    buildSeedProgram(
      'c1-2',
      'Diya Kumar',
      'Girl',
      'p1',
      'Ravi Kumar',
      '9000000001',
      40, // birth was 40 days ago, so 6w (+42d) is due in 2 days!
      ['birth']
    ),
    // 4. Ananya Devi: 6 months dose (Typhoid & Influenza) due in 8 days!
    buildSeedProgram(
      'c3-1',
      'Ananya Devi',
      'Girl',
      'p3',
      'Lakshmi Devi',
      '9000000003',
      172, // birth was 172 days ago, so 6m (+180d) is due in 8 days!
      ['birth', '6-weeks', '10-weeks', '14-weeks']
    ),
  ];

  const vaccineReminderLogs: VaccineCallReminderLog[] = [
    {
      id: 'call-log-1',
      programId: 'vac-prog-c1-1',
      childId: 'c1-1',
      childName: 'Aarav Kumar',
      parentId: 'p1',
      parentName: 'Ravi Kumar',
      parentMobile: '9000000001',
      milestoneId: '10-weeks',
      milestoneLabel: '10 Weeks',
      dueDate: addDays(today, 5),
      calledAt: `${today} 09:30`,
      receptionistName: 'Sujatha (Reception Desk)',
      callOutcome: 'CONFIRMED',
      notes: 'Called father Ravi Kumar. Confirmed bringing Aarav this Saturday morning at 10:30 AM for 10-week pentavalent dose.',
    },
  ];

  const allergies: ChildAllergy[] = [
    {
      id: 'alg-1',
      childId: 'c1-1',
      allergyType: 'MEDICINE',
      substance: 'Amoxicillin',
      reaction: 'Severe skin rash and facial hives',
      severity: 'SEVERE',
      status: 'ACTIVE',
      identifiedDate: '2026-05-10',
      doctorId: 'dr-prashant',
      doctorName: 'Dr. Prashant',
      notes: 'Occurred 2 hours after first oral dose of Augmentin syrup. Avoid penicillin family.',
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 09:00:00`,
    },
    {
      id: 'alg-2',
      childId: 'c2-1',
      allergyType: 'FOOD',
      substance: 'Peanuts & Tree Nuts',
      reaction: 'Mild lip tingling and perioral erythema',
      severity: 'MODERATE',
      status: 'ACTIVE',
      identifiedDate: '2026-02-14',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      notes: 'Parent carries Cetirizine syrup as precaution.',
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 09:00:00`,
    },
  ];

  const conditions: ChildCondition[] = [
    {
      id: 'cnd-1',
      childId: 'c1-1',
      conditionName: 'Recurring Sinus Symptoms & Reactive Wheezing',
      category: 'RESPIRATORY',
      status: 'RECURRING',
      firstIdentifiedDate: '2026-04-12',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      notes: 'Symptoms increase during monsoon and winter seasonal changes. Recommend steam inhalation and avoiding cold beverages.',
      lastReviewedDate: '2026-07-22',
      followUpRecommendation: 'Review in 3 months or upon respiratory distress',
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 09:00:00`,
    },
    {
      id: 'cnd-2',
      childId: 'c3-1',
      conditionName: 'Mild Childhood Bronchial Asthma',
      category: 'RESPIRATORY',
      status: 'ACTIVE',
      firstIdentifiedDate: '2025-11-20',
      doctorId: 'dr-prashant',
      doctorName: 'Dr. Prashant',
      notes: 'Maintained on Salbutamol inhaler with spacer as needed for acute nocturnal cough.',
      lastReviewedDate: '2026-06-15',
      followUpRecommendation: '6-monthly pediatric pulmonology follow-up',
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 09:00:00`,
    },
  ];

  const growthRecords: PediatricGrowthRecord[] = [
    {
      id: 'gr-1',
      childId: 'c1-1',
      recordedDate: '2026-03-15',
      ageYears: 3,
      ageMonths: 8,
      heightCm: 99.0,
      weightKg: 14.8,
      pediatricBmi: 15.1,
      growthStatus: 'HEALTHY',
      interpretationText: 'Healthy pediatric growth range (50th percentile on IAP chart)',
      doctorConfirmed: true,
      recordedByRole: 'RECEPTIONIST',
      recordedByName: 'Kakinada Frontdesk',
    },
    {
      id: 'gr-2',
      childId: 'c1-1',
      recordedDate: today,
      ageYears: 4,
      ageMonths: 2,
      heightCm: 104.0,
      weightKg: 16.2,
      pediatricBmi: 15.0,
      heightDeltaCm: 5.0,
      weightDeltaKg: 1.4,
      growthStatus: 'HEALTHY',
      interpretationText: 'Healthy pediatric growth range. Expected height velocity maintained.',
      doctorConfirmed: true,
      recordedByRole: 'DOCTOR',
      recordedByName: 'Dr. Prashant',
    },
  ];

  const encounters: Encounter[] = [
    {
      id: 'enc-1',
      appointmentId: 'apt-1',
      childId: 'c1-1',
      childPermanentId: 'DM-SDCH-000101',
      childName: 'Aarav Kumar',
      parentId: 'p1',
      parentName: 'Ravi Kumar',
      parentMobile: '9000000001',
      doctorId: 'dr-subba-rao',
      doctorName: 'Dr. Subba Rao Vadarevu',
      branchId: 'kakinada',
      date: '2026-07-22',
      visitType: 'PHYSICAL_OPD',
      arrivalTime: '09:45',
      startTime: '10:05',
      endTime: '10:20',
      heightCm: 102.5,
      weightKg: 15.6,
      temperatureF: 98.6,
      pulseRate: 98,
      pediatricBmi: 14.9,
      growthStatus: 'HEALTHY',
      chiefComplaints: ['Vomiting x 3 episodes', 'Mild abdominal colic'],
      clinicalObservations: 'Abdomen soft, non-tender. Mild dehydration, alert and responsive.',
      diagnosis: 'Acute Gastritis with mild dehydration',
      doctorNotes: 'Advised oral rehydration solution (ORS), light bland diet, avoid milk products for 24h.',
      followUpDate: '2026-07-25',
      status: 'FINALIZED',
      createdAt: '2026-07-22 10:20:00',
      updatedAt: '2026-07-22 10:20:00',
      prescription: {
        id: 'rx-1',
        encounterId: 'enc-1',
        prescriptionNumber: 'RX-SDCH-2026-000084',
        childId: 'c1-1',
        childPermanentId: 'DM-SDCH-000101',
        childName: 'Aarav Kumar',
        doctorId: 'dr-subba-rao',
        doctorName: 'Dr. Subba Rao Vadarevu',
        doctorRegNo: 'APMC-38492',
        hospitalName: 'Sri Devi Children Hospital',
        branchId: 'kakinada',
        date: '2026-07-22',
        version: 1,
        diagnosis: 'Acute Gastritis with mild dehydration',
        items: [
          {
            id: 'rxi-1',
            medicineName: 'Ondansetron Oral Solution (Emset)',
            genericName: 'Ondansetron 2mg/5ml',
            form: 'SYRUP',
            strength: '2mg/5ml',
            dosage: '3 ml',
            frequency: 'SOS',
            timing: 'BEFORE_FOOD',
            durationDays: 2,
            timeSlots: ['Morning', 'Afternoon', 'Night'],
            instructionEn: 'Give 3 ml 15 minutes before food only if child vomits.',
            instructionTe: 'వాంతులు అయినప్పుడు మాత్రమే భోజనానికి 15 నిమిషాల ముందు 3 ml ఇవ్వండి.',
          },
          {
            id: 'rxi-2',
            medicineName: 'Probiotic Zinc Sachet (Econorm / Darolac)',
            genericName: 'Saccharomyces boulardii + Zinc',
            form: 'DROPS',
            strength: '250mg',
            dosage: '1 sachet',
            frequency: 'TWICE_DAILY',
            timing: 'AFTER_FOOD',
            durationDays: 5,
            timeSlots: ['Morning', 'Night'],
            instructionEn: 'Mix 1 sachet in lukewarm water or breastmilk twice daily for 5 days.',
            instructionTe: 'గోరువెచ్చని నీటిలో ఒక ప్యాకెట్ కలిపి రోజుకు రెండుసార్లు 5 రోజుల పాటు ఇవ్వండి.',
          },
        ],
        specialNotesEn: 'Ensure plentiful sips of ORS after every loose stool or vomiting episode.',
        specialNotesTe: 'ప్రతి వాంతి తర్వాత తరచుగా ఓఆర్ఎస్ (ORS) నీరు కొద్దికొద్దిగా తాగించండి.',
        followUpDate: '2026-07-25',
        status: 'FINALIZED',
        createdAt: '2026-07-22 10:20:00',
        updatedAt: '2026-07-22 10:20:00',
      },
    },
  ];

  return {
    parents,
    parentPasswords,
    receptionUsers,
    doctors,
    doctorAccounts,
    doctorPasswords,
    doctorSessionsAuth: [],
    branches,
    schedules,
    appointments,
    sessions,
    config,
    gallery,
    reviews,
    notifications,
    vaccinationPrograms,
    vaccineReminderLogs,
    allergies,
    conditions,
    encounters,
    growthRecords,
    correctionRequests: [],
    auditLogs: [],
  };
}

// SQLite-backed persistent database singleton
class Database {
  private state: DatabaseState;
  private sqlite: SqliteManager;

  constructor() {
    this.sqlite = new SqliteManager();
    try {
      if (this.sqlite.isDatabaseEmpty()) {
        this.state = getInitialSeedData();
        this.sqlite.seedAll(this.state);
      } else {
        this.state = this.sqlite.loadState();
        const currentLocalDate = getLocalDateString();
        // If persisted simulatedDate is in the past, roll it forward to today
        if (this.state.config && this.state.config.simulatedDate < currentLocalDate) {
          console.log(`[Database] Rolling forward past simulatedDate (${this.state.config.simulatedDate}) to current date (${currentLocalDate})`);
          this.state.config.simulatedDate = currentLocalDate;
          // Ensure doctor sessions exist for today
          const defaultDoctors = ['dr-subba-rao', 'dr-prashant'];
          for (const docId of defaultDoctors) {
            const hasSession = this.state.sessions.some((s) => s.doctorId === docId && s.branchId === 'kakinada' && s.date === currentLocalDate);
            if (!hasSession) {
              this.state.sessions.push({
                doctorId: docId,
                branchId: 'kakinada',
                date: currentLocalDate,
                scheduledStart: '10:00',
                actualStart: '10:00',
                status: 'IN_SESSION',
                currentDelayMinutes: 0,
                avgConsultationDurationMinutes: 15,
                bufferAvailableMinutes: 20,
                emergencyAdjustmentCount: 0,
              });
            }
          }
          this.persistState();
        }
        if (!this.state.vaccinationPrograms || this.state.vaccinationPrograms.length === 0) {
          const freshSeed = getInitialSeedData();
          this.state.vaccinationPrograms = freshSeed.vaccinationPrograms;
          this.state.vaccineReminderLogs = freshSeed.vaccineReminderLogs;
          this.persistState();
        }

        // Ensure both doctors have daily schedules from 10:00 to 19:00 across branches
        const freshSeed = getInitialSeedData();
        const hasOutdatedSchedules = !this.state.schedules || this.state.schedules.length === 0 || this.state.schedules.some(
          (s) => s.startTime !== '10:00' || s.endTime !== '19:00' || !s.daysOfWeek || s.daysOfWeek.length !== 7
        );
        if (hasOutdatedSchedules) {
          console.log('[Database] Synchronizing doctor schedules to daily 10:00 AM - 07:00 PM...');
          this.state.schedules = freshSeed.schedules;
          this.state.doctors = freshSeed.doctors;
          this.state.branches = freshSeed.branches;
          if (this.state.sessions) {
            this.state.sessions.forEach((sess) => {
              sess.scheduledStart = '10:00';
            });
          }
          this.persistState();
        }

        const fresh = getInitialSeedData();
        // Ensure doctor accounts, permanent child IDs and clinical data are loaded
        if (!this.state.doctorAccounts || this.state.doctorAccounts.length === 0) {
          this.state.doctorAccounts = fresh.doctorAccounts;
          this.state.doctorPasswords = fresh.doctorPasswords;
          this.state.doctorSessionsAuth = [];
          this.state.allergies = fresh.allergies;
          this.state.conditions = fresh.conditions;
          this.state.encounters = fresh.encounters;
          this.state.growthRecords = fresh.growthRecords;
          this.state.correctionRequests = [];
          this.state.auditLogs = [];
          this.persistState();
        }

        // Ensure permanent Child IDs and details for all children
        const seedChildrenMap = new Map<string, any>();
        fresh.parents.forEach((p) => {
          p.children.forEach((c) => {
            seedChildrenMap.set(c.id, c);
          });
        });

        let childIdCounter = 101;
        let childUpdated = false;
        if (this.state.parents) {
          this.state.parents.forEach((p) => {
            if (p.children) {
              p.children.forEach((c) => {
                const seedChild = seedChildrenMap.get(c.id);
                if (!c.permanentId) {
                  c.permanentId = seedChild?.permanentId || `DM-SDCH-000${childIdCounter}`;
                  c.hospitalId = 'sdch';
                  childUpdated = true;
                }
                if (!c.dateOfBirth && seedChild?.dateOfBirth) {
                  c.dateOfBirth = seedChild.dateOfBirth;
                  childUpdated = true;
                }
                if (!c.bloodGroup && seedChild?.bloodGroup) {
                  c.bloodGroup = seedChild.bloodGroup;
                  childUpdated = true;
                }
                if (c.ageYears === undefined && seedChild?.ageYears !== undefined) {
                  c.ageYears = seedChild.ageYears;
                  childUpdated = true;
                }
                childIdCounter++;
              });
            }
          });
        }
        if (childUpdated) {
          this.persistState();
        }
      }
    } catch (err) {
      this.state = getInitialSeedData();
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getSqlite(): SqliteManager {
    return this.sqlite;
  }

  public resetToSeed(): void {
    this.state = getInitialSeedData();
    try {
      this.sqlite.seedAll(this.state);
    } catch (err) {
      console.warn('SQLite reset error:', err);
    }
  }

  public persistState(): void {
    try {
      this.sqlite.seedAll(this.state);
    } catch (err) {
      console.warn('SQLite persistState error:', err);
    }
  }

  public updateState(updater: (draft: DatabaseState) => void): void {
    updater(this.state);
    this.persistState();
  }
}

export const db = new Database();
