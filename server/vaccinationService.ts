import {
  VaccineMilestoneDef,
  VaccinationDose,
  ChildVaccinationProgram,
  VaccineCallReminderLog,
  UpcomingVaccineReminderItem,
  BranchId,
} from '../src/types/index.js';
import { db } from './db.js';
import { IAP_2018_SCHEDULE_MASTER, addDays, daysDiff } from './vaccineScheduleData.js';

export class VaccinationService {
  /**
   * Helper to add days to a YYYY-MM-DD string
   */
  public addDaysToDate(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calculate date difference in days (targetDate - fromDate)
   */
  public daysBetween(fromDateStr: string, targetDateStr: string): number {
    const from = new Date(fromDateStr);
    const target = new Date(targetDateStr);
    const diffMs = target.getTime() - from.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Generates the personalized IAP 2018 schedule for a child based on first vaccine anchor
   */
  public generateChildSchedule(
    firstVaccineDate: string,
    firstMilestoneId: string = 'birth',
    currentSimulatedDate?: string
  ): { baselineBirthDate: string; doses: VaccinationDose[] } {
    const today = currentSimulatedDate || db.getState().config.simulatedDate;
    const firstDef =
      IAP_2018_SCHEDULE_MASTER.find((m) => m.id === firstMilestoneId) ||
      IAP_2018_SCHEDULE_MASTER[0];

    // Impute birth baseline: firstVaccineDate - offsetDays of that milestone
    const baselineBirthDate = this.addDaysToDate(firstVaccineDate, -firstDef.offsetDays);

    const doses: VaccinationDose[] = IAP_2018_SCHEDULE_MASTER.map((m) => {
      const dueDate = this.addDaysToDate(baselineBirthDate, m.offsetDays);
      const isPast = dueDate < today;
      const isDueSoon = !isPast && this.daysBetween(today, dueDate) <= 14;

      return {
        id: `dose-${m.id}-${Date.now().toString(36)}`,
        milestoneId: m.id,
        ageLabel: m.ageLabel,
        vaccines: [...m.vaccines],
        dueDate,
        status: isPast ? 'OVERDUE' : isDueSoon ? 'DUE_SOON' : 'PENDING',
      };
    });

    return { baselineBirthDate, doses };
  }

  public getProgramByChildId(childId: string): ChildVaccinationProgram | undefined {
    const state = db.getState();
    return state.vaccinationPrograms.find((p) => p.childId === childId);
  }

  public getProgramsByParentId(parentId: string): ChildVaccinationProgram[] {
    const state = db.getState();
    return state.vaccinationPrograms.filter((p) => p.parentId === parentId);
  }

  /**
   * Register child for vaccination program
   */
  public registerChild(params: {
    childId: string;
    childName?: string;
    childGender?: 'Boy' | 'Girl';
    parentId: string;
    parentName?: string;
    parentMobile?: string;
    firstVaccineDate: string; // anchor date
    firstMilestoneId?: string; // defaults to 'birth' or '6-weeks'
    administeredFirstDoseToday?: boolean;
    batchNumber?: string;
    registrationFeePaid?: boolean;
    registrationAmount?: number;
    paymentAmount?: number;
    paymentReceiptNo?: string;
    registeredBy?: string;
    notes?: string;
    branchId?: BranchId;
  }): ChildVaccinationProgram {
    const state = db.getState();
    const today = state.config.simulatedDate;

    // Look up parent and child details if not explicitly passed
    const parent = state.parents.find((p) => p.id === params.parentId);
    const child = parent?.children.find((c) => c.id === params.childId);

    const childName = params.childName || child?.name || 'Child Patient';
    const childGender = (params.childGender || child?.gender || 'Boy') as 'Boy' | 'Girl';
    const parentName = params.parentName || parent?.name || 'Parent';
    const parentMobile = params.parentMobile || parent?.mobile || '';
    const branchId: BranchId = params.branchId || 'kakinada';

    // Check if program already exists for this child
    const existingIndex = state.vaccinationPrograms.findIndex((p) => p.childId === params.childId);

    const firstMilestoneId = params.firstMilestoneId || 'birth';
    const { baselineBirthDate, doses } = this.generateChildSchedule(
      params.firstVaccineDate,
      firstMilestoneId,
      today
    );

    // If first dose was administered at registration, mark it as GIVEN
    if (params.administeredFirstDoseToday) {
      const firstDose = doses.find((d) => d.milestoneId === firstMilestoneId);
      if (firstDose) {
        firstDose.status = 'GIVEN';
        firstDose.givenDate = params.firstVaccineDate;
        firstDose.administeredBy = params.registeredBy || 'Dr. Subba Rao Vadarevu';
        firstDose.batchNumber = params.batchNumber || 'SRI-VAC-2026';
        firstDose.notes = params.notes || 'Administered at Sri Devi Children Hospital during registration.';
        firstDose.updatedAt = `${today} 10:30:00`;
      }
    }

    const program: ChildVaccinationProgram = {
      id: `vac-prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      childId: params.childId,
      childName,
      childGender,
      parentId: params.parentId,
      parentName,
      parentMobile,
      registeredDate: today,
      firstVaccineDate: params.firstVaccineDate,
      firstMilestoneId,
      baselineBirthDate,
      registrationFeePaid: params.registrationFeePaid ?? true,
      registrationAmount: params.paymentAmount || params.registrationAmount || 500,
      registeredByBranchId: branchId,
      doses,
      createdAt: `${today} 10:30:00`,
      updatedAt: `${today} 10:30:00`,
    };

    if (existingIndex >= 0) {
      state.vaccinationPrograms[existingIndex] = program;
    } else {
      state.vaccinationPrograms.push(program);
    }

    db.persistState();
    return program;
  }

  /**
   * Mark a specific milestone dose as administered / given
   */
  public markDoseGiven(params: {
    programId?: string;
    doseId: string;
    administeredDate?: string;
    givenDate?: string;
    administeredBy?: string;
    batchNumber?: string;
    branchId?: BranchId;
    weightKg?: number;
    heightCm?: number;
    headCircumferenceCm?: number;
    notes?: string;
  }): { success: boolean; program?: ChildVaccinationProgram; message?: string } {
    const state = db.getState();
    let program = params.programId
      ? state.vaccinationPrograms.find((p) => p.id === params.programId)
      : state.vaccinationPrograms.find((p) => p.doses.some((d) => d.id === params.doseId));

    if (!program) return { success: false, message: 'Vaccination program not found.' };

    const dose = program.doses.find((d) => d.id === params.doseId);
    if (!dose) return { success: false, message: 'Vaccine dose not found in program.' };

    const today = state.config.simulatedDate;
    dose.status = 'GIVEN';
    dose.givenDate = params.administeredDate || params.givenDate || today;
    dose.administeredBy = params.administeredBy || 'Dr. Subba Rao Vadarevu';
    dose.batchNumber = params.batchNumber || 'VAC-B2026';
    if (params.weightKg) dose.weightKg = params.weightKg;
    if (params.heightCm) dose.heightCm = params.heightCm;
    if (params.headCircumferenceCm) dose.headCircumferenceCm = params.headCircumferenceCm;
    if (params.notes) dose.notes = params.notes;
    dose.updatedAt = `${today} 11:00:00`;
    program.updatedAt = `${today} 11:00:00`;

    db.persistState();
    return { success: true, program };
  }

  /**
   * Returns list of children who are due for vaccine in the next N days (default 15 days) or overdue
   */
  public getUpcomingDueReminders(
    daysAhead: number = 15,
    simulatedToday?: string
  ): UpcomingVaccineReminderItem[] {
    const state = db.getState();
    const today = simulatedToday || state.config.simulatedDate;

    const items: UpcomingVaccineReminderItem[] = [];

    state.vaccinationPrograms.forEach((prog) => {
      // Find the first non-given dose
      const nextPendingDose = prog.doses.find(
        (d) => d.status === 'PENDING' || d.status === 'DUE_SOON' || d.status === 'OVERDUE'
      );

      if (!nextPendingDose) return;

      const daysRemaining = this.daysBetween(today, nextPendingDose.dueDate);

      // We show children who are overdue (daysRemaining < 0) or due within the next N days (daysRemaining <= daysAhead)
      if (daysRemaining <= daysAhead) {
        let urgency: UpcomingVaccineReminderItem['urgency'] = 'DUE_WITHIN_15_DAYS';
        if (daysRemaining < 0) {
          urgency = 'OVERDUE';
        } else if (daysRemaining === 0) {
          urgency = 'DUE_TODAY';
        } else if (daysRemaining <= 7) {
          urgency = 'DUE_WITHIN_7_DAYS';
        }

        // Find last reminder log if any
        const lastCall = [...state.vaccineReminderLogs]
          .reverse()
          .find(
            (log) => log.programId === prog.id && log.milestoneId === nextPendingDose.milestoneId
          );

        items.push({
          programId: prog.id,
          childId: prog.childId,
          childName: prog.childName,
          childGender: prog.childGender,
          parentId: prog.parentId,
          parentName: prog.parentName,
          parentMobile: prog.parentMobile,
          doseId: nextPendingDose.id,
          milestoneId: nextPendingDose.milestoneId,
          milestoneLabel: nextPendingDose.ageLabel,
          vaccines: nextPendingDose.vaccines,
          dueDate: nextPendingDose.dueDate,
          daysRemaining,
          urgency,
          lastCallLog: lastCall,
        });
      }
    });

    // Sort by most urgent first: overdue first, then closest due date
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return items;
  }

  /**
   * Log a reminder call made by receptionist
   */
  public logReminderCall(params: {
    programId: string;
    milestoneId?: string;
    doseId?: string;
    calledBy?: string;
    receptionistName?: string;
    callOutcome: 'CONFIRMED' | 'CALL_LATER' | 'NOT_REACHABLE' | 'ALREADY_VACCINATED_ELSEWHERE';
    notes?: string;
    parentFeedback?: string;
    nextFollowUpDate?: string;
  }): VaccineCallReminderLog {
    const state = db.getState();
    const program = state.vaccinationPrograms.find((p) => p.id === params.programId);
    let dose = params.doseId
      ? program?.doses.find((d) => d.id === params.doseId)
      : program?.doses.find((d) => d.milestoneId === params.milestoneId);

    if (!dose && program) {
      dose = program.doses.find((d) => d.status !== 'GIVEN');
    }

    const today = state.config.simulatedDate;
    const milestoneId = params.milestoneId || dose?.milestoneId || 'vaccine-dose';

    const log: VaccineCallReminderLog = {
      id: `call-log-${Date.now()}`,
      programId: params.programId,
      childId: program?.childId || '',
      childName: program?.childName || 'Child Patient',
      parentId: program?.parentId || '',
      parentName: program?.parentName || 'Parent',
      parentMobile: program?.parentMobile || '',
      milestoneId,
      milestoneLabel: dose?.ageLabel || milestoneId,
      dueDate: dose?.dueDate || today,
      calledAt: `${today} ${state.config.simulatedTime || '11:00'}`,
      receptionistName: params.calledBy || params.receptionistName || 'Reception Desk',
      callOutcome: params.callOutcome,
      notes: params.notes || params.parentFeedback || '',
    };

    state.vaccineReminderLogs.push(log);
    db.persistState();
    return log;
  }
}

export const vaccinationService = new VaccinationService();
