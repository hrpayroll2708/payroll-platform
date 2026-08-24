import { PrismaClient, SeparationStatus, FnfStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class FnFSettlementService {
  /**
   * Submits employee resignation request
   */
  public static async submitResignation(params: {
    companyId: string;
    employeeId: string;
    resignationDate: Date;
    proposedLastDay: Date;
    reason: string;
    comments?: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
    });
    if (!emp) throw new Error('Employee not found');

    const noticePeriodDays = 30;
    const diffTime = Math.abs(params.proposedLastDay.getTime() - params.resignationDate.getTime());
    const servedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const noticeShortfallDays = Math.max(0, noticePeriodDays - servedDays);

    return prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: emp.id },
        data: { employmentStatus: 'ON_NOTICE', resignationDate: params.resignationDate, lastWorkingDay: params.proposedLastDay },
      });

      const req = await tx.resignationRequest.upsert({
        where: { employeeId: emp.id },
        update: {
          resignationDate: params.resignationDate,
          proposedLastDay: params.proposedLastDay,
          actualLastDay: params.proposedLastDay,
          noticePeriodDays,
          noticeShortfallDays,
          reason: params.reason,
          comments: params.comments,
          status: SeparationStatus.RESIGNATION_SUBMITTED,
        },
        create: {
          companyId: params.companyId,
          employeeId: emp.id,
          resignationDate: params.resignationDate,
          proposedLastDay: params.proposedLastDay,
          actualLastDay: params.proposedLastDay,
          noticePeriodDays,
          noticeShortfallDays,
          reason: params.reason,
          comments: params.comments,
          status: SeparationStatus.RESIGNATION_SUBMITTED,
        },
      });

      // Initialize clearance items
      const departments = ['IT', 'ADMIN', 'FINANCE', 'HR'];
      for (const d of departments) {
        await tx.exitClearanceItem.create({
          data: {
            resignationId: req.id,
            departmentName: d,
            itemName: `${d} Asset & Clearance Sign-off`,
            isCleared: false,
            recoveryAmount: 0,
          },
        });
      }

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'RESIGNATION_SUBMITTED',
        entity: 'ResignationRequest',
        entityId: req.id,
        afterState: { proposedLastDay: params.proposedLastDay, noticeShortfallDays },
      });

      return req;
    });
  }

  /**
   * Deterministically calculates Full & Final Settlement
   */
  public static async calculateFnF(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    actualWorkedDaysInExitMonth?: number;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
      include: {
        resignation: { include: { clearanceItems: true } },
        leaveBalances: { where: { financialYear: params.financialYear } },
        expenseClaims: { where: { status: 'APPROVED', payrollCycleId: null } },
      },
    });

    if (!emp) throw new Error('Employee not found');
    if (!emp.resignation) throw new Error('Cannot calculate F&F without an active resignation record');

    const basicSalary = emp.basicSalary || 50000;
    const monthlyGross = emp.monthlyGross || 100000;

    // 1. Worked Days Salary
    const workedDays = params.actualWorkedDaysInExitMonth !== undefined ? params.actualWorkedDaysInExitMonth : 15;
    const workedDaysSalary = Math.round((monthlyGross / 30) * workedDays);

    // 2. Leave Encashment: [(Basic / 30) * Available PL]
    const plBalance = emp.leaveBalances.find((b) => b.available > 0)?.available || 10;
    const grossLeaveEncashment = Math.round((basicSalary / 30) * plBalance);
    const leaveEncashment = Math.min(grossLeaveEncashment, 2500000); // Section 10(10AA) ceiling

    // 3. Gratuity (Payment of Gratuity Act 1972): [(15 * Last Basic * Tenure) / 26] for >= 5 years
    const diffMs = Date.now() - emp.dateOfJoining.getTime();
    const tenureYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    let gratuityAmount = 0;
    if (tenureYears >= 5) {
      gratuityAmount = Math.round((15 * basicSalary * tenureYears) / 26);
      gratuityAmount = Math.min(gratuityAmount, 2000000); // 20L tax exemption ceiling
    }

    // 4. Approved Unpaid Reimbursements
    const reimbursements = emp.expenseClaims.reduce((sum, c) => sum + c.amountApproved, 0);

    // 5. Recoveries
    const noticeShortfall = emp.resignation.noticeShortfallDays || 0;
    const noticeShortfallDeduction = Math.round((basicSalary / 30) * noticeShortfall);

    const assetRecoveryDeduction = emp.resignation.clearanceItems.reduce((sum, item) => sum + item.recoveryAmount, 0);
    const salaryAdvanceRecovery = 0;

    // 6. Deductions
    const epfDeduction = Math.round(Math.min(basicSalary, 15000) * 0.12);
    const ptDeduction = 200;
    const tdsDeduction = Math.round((workedDaysSalary + grossLeaveEncashment) * 0.05); // Standard indicative rate

    const grossSettlement = workedDaysSalary + leaveEncashment + gratuityAmount + reimbursements;
    const totalDeductions = noticeShortfallDeduction + assetRecoveryDeduction + salaryAdvanceRecovery + epfDeduction + ptDeduction + tdsDeduction;
    const netSettlementPayable = Math.max(0, grossSettlement - totalDeductions);

    const snapshot = {
      tenureYears,
      workedDays,
      plBalance,
      grossLeaveEncashment,
      calculatedGratuity: gratuityAmount,
      reimbursementsCount: emp.expenseClaims.length,
    };

    const settlement = await prisma.fnFSettlement.upsert({
      where: { employeeId: emp.id },
      update: {
        financialYear: params.financialYear,
        workedDaysSalary,
        leaveEncashment,
        gratuityAmount,
        reimbursements,
        bonusArrears: 0,
        grossSettlement,
        noticeShortfallDeduction,
        assetRecoveryDeduction,
        salaryAdvanceRecovery,
        epfDeduction,
        ptDeduction,
        tdsDeduction,
        totalDeductions,
        netSettlementPayable,
        status: FnfStatus.CALCULATED,
        calculationSnapshot: snapshot,
        calculatedById: params.actorUserId,
      },
      create: {
        companyId: params.companyId,
        employeeId: emp.id,
        resignationId: emp.resignation.id,
        financialYear: params.financialYear,
        workedDaysSalary,
        leaveEncashment,
        gratuityAmount,
        reimbursements,
        bonusArrears: 0,
        grossSettlement,
        noticeShortfallDeduction,
        assetRecoveryDeduction,
        salaryAdvanceRecovery,
        epfDeduction,
        ptDeduction,
        tdsDeduction,
        totalDeductions,
        netSettlementPayable,
        status: FnfStatus.CALCULATED,
        calculationSnapshot: snapshot,
        calculatedById: params.actorUserId,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'FNF_SETTLEMENT_CALCULATED',
      entity: 'FnFSettlement',
      entityId: settlement.id,
      afterState: { grossSettlement, totalDeductions, netSettlementPayable },
    });

    return settlement;
  }

  /**
   * Approves and locks Full & Final Settlement (Maker-Checker enforced)
   */
  public static async approveAndLockFnF(params: {
    companyId: string;
    settlementId: string;
    approverUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const settlement = await prisma.fnFSettlement.findFirst({
      where: { id: params.settlementId, companyId: params.companyId },
    });

    if (!settlement) throw new Error('Settlement record not found');
    if (settlement.calculatedById === params.approverUserId) {
      throw new Error('Maker-Checker Violation: Approver cannot be the same user who calculated F&F');
    }

    return prisma.$transaction(async (tx) => {
      const locked = await tx.fnFSettlement.update({
        where: { id: settlement.id },
        data: {
          status: FnfStatus.LOCKED,
          approvedById: params.approverUserId,
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
      });

      await tx.employee.update({
        where: { id: settlement.employeeId },
        data: { employmentStatus: 'EXITED' },
      });

      await tx.resignationRequest.update({
        where: { id: settlement.resignationId },
        data: { status: SeparationStatus.SETTLED },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.approverUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'FNF_SETTLEMENT_LOCKED',
        entity: 'FnFSettlement',
        entityId: settlement.id,
        afterState: { status: 'LOCKED', netSettlementPayable: settlement.netSettlementPayable },
      });

      return locked;
    });
  }
}