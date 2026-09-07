export type BranchId = 'kakinada' | 'pithapuram';

export interface Doctor {
  id: string;
  name: string;
  photoUrl: string;
  qualifications: string;
  specialty: string;
  experienceYears: number;
  summary: string;
  branches: BranchId[];
  active: boolean;
  scheduleDescription?: string;
}

export interface HospitalBranch {
  id: BranchId;
  name: string;
  address: string;
  landmark: string;
  phone: string;
  emergencyPhone: string;
  timings: string;
  mapEmbedUrl?: string;
  googleMapsUrl: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  branchId: BranchId;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "10:00"
  endTime: string;   // "13:30"
  slotDurationMinutes: number; // 15
  bufferMinutesPerHour: number; // 10
  isAvailable: boolean;
  notes?: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  gender?: 'Boy' | 'Girl';
  ageYears?: number; // optional, disabled by default in UI
}

export interface Parent {
  id: string;
  name: string;
  mobile: string;
  children: Child[];
}

export type AppointmentStatus =
  | 'BOOKED'
  | 'REMINDER_SENT'
  | 'APPROACHING'
  | 'ARRIVED'
  | 'WAITING'
  | 'WITH_DOCTOR'
  | 'COMPLETED'
  | 'LATE'
  | 'SLOT_RELEASED'
  | 'NO_SHOW'
  | 'RESCHEDULED'
  | 'HOSPITAL_CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID';

export interface AppointmentHistoryItem {
  timestamp: string;
  status: AppointmentStatus;
  note?: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  parentMobile: string;
  doctorId: string;
  doctorName: string;
  branchId: BranchId;
  branchName: string;
  date: string; // YYYY-MM-DD
  bookedTime: string; // "10:30"
  expectedConsultationTime: string; // "10:42" dynamically updated
  recommendedArrivalTime: string; // "10:27" (15m before expected)
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  bookingSource: 'ONLINE' | 'RECEPTION_PHONE' | 'WALK_IN';
  advanceNoticePreferenceMinutes: number; // 10, 20, 30, 45, 60 (default 30)
  isEmergency?: boolean;
  emergencyReason?: string;
  actualArrivalTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  consultationDurationMinutes?: number;
  delayExplanation?: string;
  rescheduledFromAppointmentId?: string;
  positionInQueue?: number;
  childrenAhead?: number;
  history: AppointmentHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSession {
  doctorId: string;
  branchId: BranchId;
  date: string;
  scheduledStart: string;
  actualStart?: string;
  status: 'NOT_STARTED' | 'IN_SESSION' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED_BY_HOSPITAL';
  currentAppointmentId?: string;
  currentDelayMinutes: number;
  avgConsultationDurationMinutes: number;
  bufferAvailableMinutes: number;
  emergencyAdjustmentCount: number;
  cancellationNotice?: string;
}

export interface SlotAvailability {
  time: string; // "10:00"
  available: boolean;
  status: 'Available' | 'Booked' | 'Blocked' | 'Buffer' | 'Doctor unavailable';
  isBufferSlot?: boolean;
}

export interface SystemConfiguration {
  slotDurationMinutes: number; // 15
  arrivalBeforeAppointmentMinutes: number; // 15
  rescheduleCutoffMinutes: number; // 60
  lateGracePeriodMinutes: number; // 15
  noShowThresholdMinutes: number; // 30
  bufferMinutesPerHour: number; // 10
  notificationTriggerChildrenCount: number; // 2
  simulatedTime: string; // "10:15"
  simulatedDate: string; // YYYY-MM-DD
  isSimulatedClockActive: boolean;
}

export interface NotificationItem {
  id: string;
  appointmentId: string;
  parentId: string;
  title: string;
  message: string;
  type: 'APPROACHING' | 'DELAY' | 'EARLY' | 'REASSIGNED' | 'HOSPITAL_CANCELLED' | 'GENERAL';
  timestamp: string;
  read: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Hospital' | 'Facilities' | 'Doctors' | 'Pediatric Care' | 'Waiting Area';
  imageUrl: string;
  caption: string;
  displayOrder: number;
  active: boolean;
}

export interface HospitalReview {
  id: string;
  parentName: string;
  childName?: string;
  rating: number;
  date: string;
  branch: string;
  comment: string;
  featured: boolean;
}

export interface OperationalAnalytics {
  totalAppointments: number;
  onlineBookings: number;
  receptionBookings: number;
  completedConsultations: number;
  lateArrivals: number;
  noShows: number;
  averageConsultationDurationMinutes: number;
  averageParentWaitingTimeMinutes: number;
  averageDoctorStartDelayMinutes: number;
  bufferMinutesUsed: number;
  emergencyAdjustments: number;
  appointmentsTreatedEarlierThanBooked: number;
  averageScheduleDelayMinutes: number;
}
