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
  medicalRegistrationNo?: string;
  mobile?: string;
  email?: string;
  digitalSignatureUrl?: string;
}

export interface DoctorAccount {
  id: string; // matches doctor.id (e.g. 'dr-subba-rao')
  doctorId: string;
  name: string;
  fullName?: string;
  email: string;
  mobile: string;
  medicalRegistrationNo: string;
  specialization?: string;
  primaryBranchId?: BranchId;
  digitalSignatureUrl?: string;
  isApproved: boolean;
  isActive: boolean;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  lastLoginAt?: string;
}

export interface DoctorAuthSession {
  token: string;
  doctor: Doctor;
  account: DoctorAccount;
  expiresAt: string;
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
  endTime: string;   // "19:00"
  slotDurationMinutes: number; // 15
  bufferMinutesPerHour: number; // 10
  isAvailable: boolean;
  notes?: string;
}

export interface Child {
  id: string;
  permanentId?: string; // e.g. "DM-SDCH-000101"
  parentId: string;
  name: string;
  gender?: 'Boy' | 'Girl';
  ageYears?: number;
  dateOfBirth?: string; // YYYY-MM-DD
  bloodGroup?: string;
  hospitalId?: string;
}

export interface ParentUnblockRecord {
  timestamp: string;
  justification: string;
  receptionistName: string;
}

export interface Parent {
  id: string;
  name: string;
  mobile: string;
  children: Child[];
  consecutiveNoShows?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  unblockHistory?: ParentUnblockRecord[];
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
export type PaymentMethod = 'CASH' | 'PHONEPE';

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
  paymentMethod?: PaymentMethod;
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
  // Clinical vitals recorded for Smart OPD triage / consultation
  heightCm?: number;
  weightKg?: number;
  temperatureF?: number;
  pulseRate?: number;
  pediatricBmi?: number;
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
  cashPayments: number;
  phonePePayments: number;
}

// --- PEDIATRIC VACCINATION & IMMUNIZATION (IAP 2018) ---

export type VaccinationDoseStatus = 'PENDING' | 'DUE_SOON' | 'OVERDUE' | 'GIVEN' | 'SKIPPED';

export interface VaccineMilestoneDef {
  id: string; // e.g. 'birth', '6-weeks', '10-weeks', '14-weeks', '6-months', etc.
  ageLabel: string; // e.g. 'Birth', '6 Weeks', '10 Weeks'
  offsetDays: number; // offset in days from baseline birth
  vaccines: string[]; // e.g. ['BCG', 'Hep B 1', 'OPV 0']
  description?: string;
  mandatory?: boolean;
}

export interface VaccinationDose {
  id: string;
  milestoneId: string;
  ageLabel: string;
  vaccines: string[];
  dueDate: string; // YYYY-MM-DD calculated from first dose anchor
  status: VaccinationDoseStatus;
  givenDate?: string; // YYYY-MM-DD
  administeredBy?: string; // Doctor or nurse name
  batchNumber?: string;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  updatedAt?: string;
}

export interface ChildVaccinationProgram {
  id: string;
  childId: string;
  childName: string;
  childGender: 'Boy' | 'Girl';
  parentId: string;
  parentName: string;
  parentMobile: string;
  registeredDate: string; // YYYY-MM-DD
  firstVaccineDate: string; // YYYY-MM-DD anchor date
  firstMilestoneId: string; // milestone when first vaccine was given (default 'birth')
  baselineBirthDate: string; // imputed birth baseline for day calculations
  registrationFeePaid: boolean;
  registrationAmount?: number;
  registeredByBranchId: BranchId;
  doses: VaccinationDose[];
  createdAt: string;
  updatedAt: string;
}

export interface VaccineCallReminderLog {
  id: string;
  programId: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  parentMobile: string;
  milestoneId: string;
  milestoneLabel: string;
  dueDate: string;
  calledAt: string; // YYYY-MM-DD HH:mm
  receptionistName: string;
  callOutcome: 'CONFIRMED' | 'CALL_LATER' | 'NOT_REACHABLE' | 'ALREADY_VACCINATED_ELSEWHERE';
  notes: string;
}

export interface UpcomingVaccineReminderItem {
  programId: string;
  childId: string;
  childName: string;
  childGender: 'Boy' | 'Girl';
  parentId: string;
  parentName: string;
  parentMobile: string;
  doseId: string;
  milestoneId: string;
  milestoneLabel: string;
  vaccines: string[];
  dueDate: string;
  daysRemaining: number; // positive = days until due, 0 = due today, negative = overdue
  urgency: 'OVERDUE' | 'DUE_TODAY' | 'DUE_WITHIN_7_DAYS' | 'DUE_WITHIN_15_DAYS';
  lastCallLog?: VaccineCallReminderLog;
}

// ================= PEDIATRIC EMR DOMAIN TYPES =================

export type AllergyType = 'MEDICINE' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
export type AllergyStatus = 'ACTIVE' | 'INACTIVE' | 'ENTERED_IN_ERROR';

export interface ChildAllergy {
  id: string;
  childId: string;
  allergyType: AllergyType;
  substance: string; // e.g. "Amoxicillin"
  reaction: string;  // e.g. "Skin rash and facial hives"
  severity: AllergySeverity;
  status: AllergyStatus;
  identifiedDate: string; // YYYY-MM-DD
  doctorId: string;
  doctorName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConditionCategory = 'RESPIRATORY' | 'CHRONIC' | 'DEVELOPMENTAL' | 'GASTROINTESTINAL' | 'ALLERGIC' | 'OTHER';
export type ConditionStatus = 'ACTIVE' | 'RECURRING' | 'RESOLVED' | 'UNDER_OBSERVATION';

export interface ChildCondition {
  id: string;
  childId: string;
  conditionName: string; // e.g. "Recurring Sinusitis", "Childhood Asthma"
  category: ConditionCategory;
  status: ConditionStatus;
  firstIdentifiedDate: string; // YYYY-MM-DD
  doctorId: string;
  doctorName: string;
  notes?: string;
  lastReviewedDate?: string;
  followUpRecommendation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalAlert {
  id: string;
  childId: string;
  alertType: 'CRITICAL_ALLERGY' | 'CHRONIC_CONDITION' | 'DOCTOR_WARNING';
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM';
  doctorId: string;
  createdAt: string;
}

export interface PediatricGrowthRecord {
  id: string;
  childId: string;
  recordedDate: string;
  ageYears: number;
  ageMonths: number;
  heightCm: number;
  weightKg: number;
  pediatricBmi: number;
  heightDeltaCm?: number;
  weightDeltaKg?: number;
  growthStatus: 'HEALTHY' | 'BELOW_RANGE' | 'ABOVE_RANGE' | 'REVIEW_ADVISED';
  interpretationText: string;
  doctorConfirmed: boolean;
  recordedByRole: 'DOCTOR' | 'RECEPTIONIST';
  recordedByName: string;
  notes?: string;
}

export type MedicineForm = 'SYRUP' | 'DROPS' | 'TABLET' | 'INHALER' | 'INJECTION' | 'CREAM';
export type DoseFrequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'FOUR_TIMES_DAILY' | 'SOS';
export type MealTiming = 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'AT_BEDTIME' | 'EMPTY_STOMACH';

export interface PrescriptionItem {
  id: string;
  medicineName: string; // Brand or Generic name
  genericName?: string;
  form: MedicineForm;
  strength?: string;    // e.g. "250mg/5ml"
  dosage: string;       // e.g. "5 ml", "1 tablet"
  frequency: DoseFrequency;
  timing: MealTiming;
  durationDays: number;
  timeSlots: ('Morning' | 'Afternoon' | 'Night')[];
  instructionEn: string;
  instructionTe: string;
}

export interface Prescription {
  id: string;
  encounterId: string;
  prescriptionNumber: string; // e.g. "RX-SDCH-2026-000101"
  childId: string;
  childPermanentId: string;
  childName: string;
  doctorId: string;
  doctorName: string;
  doctorRegNo: string;
  hospitalName: string;
  branchId: BranchId;
  date: string;
  version: number;
  diagnosis?: string;
  items: PrescriptionItem[];
  allergyBannerSnapshot?: string[];
  specialNotesEn?: string;
  specialNotesTe?: string;
  followUpDate?: string;
  status: 'FINALIZED' | 'SUPERSEDED';
  digitalSignatureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Encounter {
  id: string;
  appointmentId?: string;
  childId: string;
  childPermanentId: string;
  childName: string;
  parentId: string;
  parentName: string;
  parentMobile: string;
  doctorId: string;
  doctorName: string;
  branchId: BranchId;
  date: string; // YYYY-MM-DD
  visitType: 'PHYSICAL_OPD' | 'TELECONSULTATION' | 'EMERGENCY_WALKIN';
  arrivalTime?: string;
  startTime?: string;
  endTime?: string;
  // Vitals recorded
  heightCm?: number;
  weightKg?: number;
  temperatureF?: number;
  pulseRate?: number;
  pediatricBmi?: number;
  growthStatus?: string;
  // Clinical notes
  chiefComplaints: string[];
  clinicalObservations?: string;
  diagnosis?: string;
  doctorNotes?: string;
  followUpDate?: string;
  prescription?: Prescription;
  status: 'IN_PROGRESS' | 'FINALIZED' | 'AMENDED';
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalCorrectionRequest {
  id: string;
  childId: string;
  parentId: string;
  parentName: string;
  parentMobile: string;
  entityType: 'ALLERGY' | 'CONDITION' | 'RECORD';
  entityId?: string;
  requestNote: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  doctorReviewNotes?: string;
  reviewedByDoctorId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ClinicalAuditLog {
  id: string;
  actorId: string;
  actorRole: 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  actorName: string;
  action: 'CREATE' | 'UPDATE' | 'RESOLVE' | 'ENTER_ERROR' | 'FINALIZE_PRESCRIPTION';
  entityType: 'ALLERGY' | 'CONDITION' | 'ENCOUNTER' | 'PRESCRIPTION' | 'GROWTH';
  entityId: string;
  childId: string;
  details: string;
  timestamp: string;
}

