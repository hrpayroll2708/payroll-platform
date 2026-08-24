import { PrismaClient, PerformanceCycleStatus, AppraisalStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class PerformanceService {
  public static async createCycle(params: {
    companyId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const cycle = await tx.performanceCycle.create({
        data: {
          companyId: params.companyId,
          name: params.name,
          description: params.description,
          startDate: params.startDate,
          endDate: params.endDate,
          status: PerformanceCycleStatus.DRAFT,
          createdById: params.actorUserId || 'system',
        },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'PERFORMANCE_CYCLE_CREATED',
        entity: 'PerformanceCycle',
        entityId: cycle.id,
        afterState: { name: params.name, status: 'DRAFT' },
      });

      return cycle;
    });
  }

  public static async updateCycleStatus(params: {
    companyId: string;
    cycleId: string;
    status: PerformanceCycleStatus;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: params.cycleId, companyId: params.companyId },
    });
    if (!cycle) throw new Error('Performance cycle not found');
    if (cycle.status === PerformanceCycleStatus.LOCKED) {
      throw new Error('A LOCKED performance cycle is strictly immutable');
    }

    // Validate state transition
    const validTransitions: Record<PerformanceCycleStatus, PerformanceCycleStatus[]> = {
      DRAFT: [PerformanceCycleStatus.ACTIVE],
      ACTIVE: [PerformanceCycleStatus.APPRAISAL_PHASE, PerformanceCycleStatus.DRAFT],
      APPRAISAL_PHASE: [PerformanceCycleStatus.REVIEW_PHASE],
      REVIEW_PHASE: [PerformanceCycleStatus.LOCKED],
      LOCKED: [],
    };

    if (!validTransitions[cycle.status].includes(params.status)) {
      throw new Error(`Invalid performance cycle transition from ${cycle.status} to ${params.status}`);
    }

    const updated = await prisma.performanceCycle.update({
      where: { id: cycle.id },
      data: { status: params.status },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'PERFORMANCE_CYCLE_STATUS_UPDATED',
      entity: 'PerformanceCycle',
      entityId: cycle.id,
      beforeState: { status: cycle.status },
      afterState: { status: params.status },
    });

    return updated;
  }

  public static async createGoal(params: {
    companyId: string;
    cycleId: string;
    employeeId: string;
    title: string;
    description?: string;
    category?: string;
    weightage?: number;
    target: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: params.cycleId, companyId: params.companyId },
    });
    if (!cycle) throw new Error('Performance cycle not found');
    if (cycle.status === PerformanceCycleStatus.LOCKED) {
      throw new Error('Cannot add goals to a locked cycle');
    }

    return prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          companyId: params.companyId,
          cycleId: params.cycleId,
          employeeId: params.employeeId,
          title: params.title,
          description: params.description,
          category: params.category || 'OKRs',
          weightage: params.weightage || 100,
          target: params.target,
        },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'PERFORMANCE_GOAL_CREATED',
        entity: 'Goal',
        entityId: goal.id,
        afterState: { title: params.title, weightage: goal.weightage },
      });

      return goal;
    });
  }

  public static async submitSelfAppraisal(params: {
    companyId: string;
    appraisalId: string;
    employeeId: string;
    selfRating: number;
    qualitativeFeedback: string;
    strengths?: string;
    improvementAreas?: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const appraisal = await prisma.appraisal.findFirst({
      where: { id: params.appraisalId, companyId: params.companyId },
    });
    if (!appraisal) throw new Error('Appraisal record not found');
    if (appraisal.employeeId !== params.employeeId) {
      throw new Error('IDOR Protection: Access denied to other employee appraisal');
    }
    if (appraisal.status !== AppraisalStatus.DRAFT) {
      throw new Error('Self appraisal has already been submitted and is immutable');
    }

    const updated = await prisma.appraisal.update({
      where: { id: appraisal.id },
      data: {
        selfRating: params.selfRating,
        qualitativeFeedback: params.qualitativeFeedback,
        strengths: params.strengths,
        improvementAreas: params.improvementAreas,
        status: AppraisalStatus.SELF_SUBMITTED,
        submittedAt: new Date(),
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'SELF_APPRAISAL_SUBMITTED',
      entity: 'Appraisal',
      entityId: appraisal.id,
      afterState: { selfRating: params.selfRating, status: 'SELF_SUBMITTED' },
    });

    return updated;
  }

  public static async managerReview(params: {
    companyId: string;
    appraisalId: string;
    managerEmployeeId: string;
    managerRating: number;
    finalScore: number;
    strengths?: string;
    improvementAreas?: string;
    meritRecommendation?: boolean;
    recommendedIncrementPct?: number;
    recommendedIncrementAmt?: number;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
    isHrAdmin?: boolean;
  }) {
    const appraisal = await prisma.appraisal.findFirst({
      where: { id: params.appraisalId, companyId: params.companyId },
      include: { employee: true },
    });
    if (!appraisal) throw new Error('Appraisal record not found');

    if (!params.isHrAdmin && appraisal.employee.managerId !== params.managerEmployeeId) {
      throw new Error('Reporting Hierarchy Violation: Manager can only review direct reports');
    }
    if (appraisal.employeeId === params.managerEmployeeId) {
      throw new Error('Conflict of Interest: Managers cannot review themselves');
    }

    const updated = await prisma.appraisal.update({
      where: { id: appraisal.id },
      data: {
        reviewerId: params.managerEmployeeId,
        managerRating: params.managerRating,
        finalScore: params.finalScore,
        strengths: params.strengths,
        improvementAreas: params.improvementAreas,
        meritRecommendation: !!params.meritRecommendation,
        recommendedIncrementPct: params.recommendedIncrementPct || 0,
        recommendedIncrementAmt: params.recommendedIncrementAmt || 0,
        status: AppraisalStatus.MANAGER_REVIEWED,
        reviewedAt: new Date(),
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'MANAGER_REVIEW_SUBMITTED',
      entity: 'Appraisal',
      entityId: appraisal.id,
      afterState: { managerRating: params.managerRating, status: 'MANAGER_REVIEWED' },
    });

    return updated;
  }

  public static async lockAppraisal(params: {
    companyId: string;
    appraisalId: string;
    approverUserId: string;
    approverEmployeeId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const appraisal = await prisma.appraisal.findFirst({
      where: { id: params.appraisalId, companyId: params.companyId },
    });
    if (!appraisal) throw new Error('Appraisal record not found');
    if (appraisal.status !== AppraisalStatus.MANAGER_REVIEWED) {
      throw new Error('Appraisal must be in MANAGER_REVIEWED state before locking');
    }
    if (appraisal.reviewerId && appraisal.reviewerId === params.approverEmployeeId) {
      throw new Error('Maker-Checker Violation: Reviewing manager cannot execute final approval and lock');
    }

    return prisma.$transaction(async (tx) => {
      const locked = await tx.appraisal.update({
        where: { id: appraisal.id },
        data: {
          approverId: params.approverEmployeeId,
          status: AppraisalStatus.LOCKED,
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
      });

      // Handoff to SalaryRevision if merit recommendation is active
      if (locked.meritRecommendation && locked.recommendedIncrementAmt && locked.recommendedIncrementAmt > 0) {
        const emp = await tx.employee.findUnique({ where: { id: locked.employeeId } });
        if (emp && emp.basicSalary) {
          const proposedCtc = (emp.monthlyGross || 50000) * 12 + locked.recommendedIncrementAmt;
          await tx.salaryRevision.create({
            data: {
              companyId: params.companyId,
              employeeId: locked.employeeId,
              currentAnnualCtc: (emp.monthlyGross || 50000) * 12,
              proposedAnnualCtc: proposedCtc,
              revisionPercentage: locked.recommendedIncrementPct || 5,
              revisionAmount: locked.recommendedIncrementAmt,
              effectiveFrom: new Date(),
              reason: `Appraisal Merit Recommendation — Score: ${locked.finalScore}`,
              status: 'PENDING_APPROVAL',
              requestedById: locked.employeeId,
            },
          });
        }
      }

      await AuditService.log({
        companyId: params.companyId,
        userId: params.approverUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'APPRAISAL_LOCKED',
        entity: 'Appraisal',
        entityId: appraisal.id,
        afterState: { status: 'LOCKED', finalScore: locked.finalScore },
      });

      return locked;
    });
  }
}