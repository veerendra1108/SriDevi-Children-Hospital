import {
  Parent,
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
import { SqliteManager } from './sqlite.js';

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
  branches: HospitalBranch[];
  schedules: DoctorSchedule[];
  appointments: Appointment[];
  sessions: DoctorSession[];
  config: SystemConfiguration;
  gallery: GalleryItem[];
  reviews: HospitalReview[];
  notifications: NotificationItem[];
}

export function getInitialSeedData(): DatabaseState {
  const parents: Parent[] = [
    {
      id: 'p1',
      name: 'Ravi Kumar',
      mobile: '9000000001',
      children: [
        { id: 'c1-1', parentId: 'p1', name: 'Aarav', gender: 'Boy' },
        { id: 'c1-2', parentId: 'p1', name: 'Diya', gender: 'Girl' },
      ],
    },
    {
      id: 'p2',
      name: 'Suresh Babu',
      mobile: '9000000002',
      children: [
        { id: 'c2-1', parentId: 'p2', name: 'Vihaan', gender: 'Boy' },
      ],
    },
    {
      id: 'p3',
      name: 'Lakshmi Devi',
      mobile: '9000000003',
      children: [
        { id: 'c3-1', parentId: 'p3', name: 'Ananya', gender: 'Girl' },
        { id: 'c3-2', parentId: 'p3', name: 'Aditya', gender: 'Boy' },
      ],
    },
    {
      id: 'p4',
      name: 'Rajesh Kumar',
      mobile: '9000000004',
      children: [
        { id: 'c4-1', parentId: 'p4', name: 'Ishaan', gender: 'Boy' },
      ],
    },
    {
      id: 'p5',
      name: 'Priya Rao',
      mobile: '9000000005',
      children: [
        { id: 'c5-1', parentId: 'p5', name: 'Myra', gender: 'Girl' },
        { id: 'c5-2', parentId: 'p5', name: 'Riya', gender: 'Girl' },
      ],
    },
    {
      id: 'p6',
      name: 'Mahesh',
      mobile: '9000000006',
      children: [
        { id: 'c6-1', parentId: 'p6', name: 'Arjun', gender: 'Boy' },
      ],
    },
    {
      id: 'p7',
      name: 'Sravani',
      mobile: '9000000007',
      children: [
        { id: 'c7-1', parentId: 'p7', name: 'Kavya', gender: 'Girl' },
        { id: 'c7-2', parentId: 'p7', name: 'Karthik', gender: 'Boy' },
      ],
    },
    {
      id: 'p8',
      name: 'Venkatesh',
      mobile: '9000000008',
      children: [
        { id: 'c8-1', parentId: 'p8', name: 'Sai', gender: 'Boy' },
      ],
    },
    {
      id: 'p9',
      name: 'Deepika',
      mobile: '9000000009',
      children: [
        { id: 'c9-1', parentId: 'p9', name: 'Tara', gender: 'Girl' },
        { id: 'c9-2', parentId: 'p9', name: 'Nikhil', gender: 'Boy' },
      ],
    },
    {
      id: 'p10',
      name: 'Praveen',
      mobile: '9000000010',
      children: [
        { id: 'c10-1', parentId: 'p10', name: 'Akhil', gender: 'Boy' },
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
      qualifications: 'Qualifications will be updated',
      specialty: 'Senior Pediatric Specialist & Neonatal Care',
      experienceYears: 28,
      summary: 'Doctor profile information will be updated. Dr. Subba Rao Vadarevu has been caring for infants, children, and adolescents with unmatched clinical attentiveness and generational trust across Godavari districts.',
      branches: ['kakinada', 'pithapuram'],
      active: true,
      scheduleDescription: 'Operates on selected configured consulting days. Please refer to live schedule.',
    },
    {
      id: 'dr-prashant',
      name: 'Dr. Prashant',
      photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
      qualifications: 'Qualifications will be updated',
      specialty: 'Consultant Pediatrician & Child Health Specialist',
      experienceYears: 14,
      summary: 'Doctor profile information will be updated. Specializing in pediatric development, immunization tracking, and acute childhood illnesses with calm, parent-friendly guidance.',
      branches: ['kakinada', 'pithapuram'],
      active: true,
      scheduleDescription: 'Regular morning and evening consultation sessions across Kakinada and Pithapuram.',
    },
  ];

  const branches: HospitalBranch[] = [
    {
      id: 'kakinada',
      name: 'Sri Devi Children Hospital - Kakinada',
      address: 'Near Rama Rao Peta, Main Road, Kakinada, Andhra Pradesh 533004',
      landmark: 'Near Government General Hospital / Medical College Junction',
      phone: '+91 884 237 8899',
      emergencyPhone: '+91 944 011 2233',
      timings: 'Mon - Sat: 09:30 AM - 01:30 PM & 05:00 PM - 08:30 PM (Emergency open)',
      googleMapsUrl: 'https://maps.google.com/?q=Sri+Devi+Children+Hospital+Kakinada',
    },
    {
      id: 'pithapuram',
      name: 'Sri Devi Children Hospital - Pithapuram',
      address: 'Station Road, Opp. Municipal Complex, Pithapuram, Andhra Pradesh 533450',
      landmark: 'Near RTC Bus Complex & Temple Arch Road',
      phone: '+91 8869 252 777',
      emergencyPhone: '+91 944 011 2244',
      timings: 'Mon, Wed, Fri: 10:00 AM - 02:00 PM (Emergency open)',
      googleMapsUrl: 'https://maps.google.com/?q=Sri+Devi+Children+Hospital+Pithapuram',
    },
  ];

  const schedules: DoctorSchedule[] = [
    {
      id: 'sch-1',
      doctorId: 'dr-subba-rao',
      branchId: 'kakinada',
      daysOfWeek: [1, 2, 3, 4, 5, 6], // Mon-Sat
      startTime: '10:00',
      endTime: '13:30',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Main consulting session in Kakinada',
    },
    {
      id: 'sch-2',
      doctorId: 'dr-subba-rao',
      branchId: 'pithapuram',
      daysOfWeek: [2, 4], // Tue, Thu
      startTime: '14:30',
      endTime: '17:30',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Special Pithapuram clinic session',
    },
    {
      id: 'sch-3',
      doctorId: 'dr-prashant',
      branchId: 'kakinada',
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '09:30',
      endTime: '13:00',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Morning session',
    },
    {
      id: 'sch-4',
      doctorId: 'dr-prashant',
      branchId: 'pithapuram',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      startTime: '10:00',
      endTime: '13:30',
      slotDurationMinutes: 15,
      bufferMinutesPerHour: 10,
      isAvailable: true,
      notes: 'Pithapuram pediatric clinic',
    },
  ];

  // Today's date ISO format
  const today = new Date().toISOString().split('T')[0];
  const [yyyy, mm, dd] = today.split('-');
  const dateCode = `${mm}${dd}${yyyy.slice(-2)}`;

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
      scheduledStart: '09:30',
      actualStart: '09:30',
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
      appointmentNumber: `SD-KAK.${dateCode}-001`,
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
      appointmentNumber: `SD-KAK.${dateCode}-002`,
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
      appointmentNumber: `SD-KAK.${dateCode}-003`,
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
      appointmentNumber: `SD-KAK.${dateCode}-004`,
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
      appointmentNumber: `SD-KAK.${dateCode}-005`,
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
      appointmentNumber: `SD-KAK.${dateCode}-006`,
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
      appointmentNumber: `SD-KAK.${dateCode}-007`,
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
      appointmentNumber: `SD-KAK.${dateCode}-008`,
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
      appointmentNumber: `SD-KAK.${dateCode}-009`,
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
      appointmentNumber: `SD-KAK.${dateCode}-010`,
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
      }
    } catch (err) {
      console.warn('SQLite init warning, falling back to memory seed:', err);
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
