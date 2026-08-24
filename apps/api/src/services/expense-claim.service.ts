import { PrismaClient, ExpenseClaimStatus, AdjustmentType } from '@prisma/client';
import crypto from 'crypto';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class ExpenseClaimService {
  public static async createDraftClaim(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    headId: string;
    claimDate: Date;
    amountClaimed: number;
    description: string;
    receiptFile?: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string };
    actorEmail: string;
    actorRole: string;
  }) {
    if (params.amountClaimed <= 0) {
      throw new Error('Claim amount must be strictly greater than zero');
    }

    const head = await prisma.reimbursementHeadConfig.findFirst({
      where: { id: params.headId, companyId: params.companyId, isActive: true },
    });
    if (!head) throw new Error('Invalid or inactive reimbursement head');

    const claimNumber = `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.$transaction(async (tx) => {
      const claim = await tx.employeeExpenseClaim.create({
        data: {
          companyId: params.companyId,
          employeeId: params.employeeId,
          claimNumber,
          financialYear: params.financialYear,
          headId: params.headId,
          claimDate: params.claimDate,
          amountClaimed: params.amountClaimed,
          amountApproved: 0,
          amountRejected: 0,
          isTaxExempt: head.isTaxExempt,
          description: params.description,
          status: ExpenseClaimStatus.DRAFT,
        },
      });

      if (params.receiptFile) {
        const fileHash = crypto.createHash('sha256').update(params.receiptFile.fileName + Date.now()).digest('hex');
        await tx.expenseClaimDocument.create({
          data: {
            claimId: claim.id,
            fileName: params.receiptFile.fileName,
            fileUrl: params.receiptFile.fileUrl,
            fileSize: params.receiptFile.fileSize || 1024,
            mimeType: params.receiptFile.mimeType || 'application/pdf',
            fileChecksumSha256: fileHash,
          },
        });
      }

      return claim;
    });
  }

  public static async submitClaim(params: {
    companyId: string;
    employeeId: string;
    claimId: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const claim = await prisma.employeeExpenseClaim.findFirst({
      where: { id: params.claimId, employeeId: params.employeeId, companyId: params.companyId },
      include: { head: true, documents: true },
    });

    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ExpenseClaimStatus.DRAFT) throw new Error('Only DRAFT claims can be submitted');
    if (claim.head.proofRequired && claim.documents.length === 0) {
      throw new Error(`Receipt proof is mandatory for ${claim.head.name} claims`);
    }

    const updated = await prisma.employeeExpenseClaim.update({
      where: { id: claim.id },
      data: { status: ExpenseClaimStatus.SUBMITTED },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'EXPENSE_CLAIM_SUBMITTED',
      entity: 'EmployeeExpenseClaim',
      entityId: claim.id,
      afterState: { claimNumber: claim.claimNumber, amountClaimed: claim.amountClaimed },
    });

    return updated;
  }

  public static async cancelClaim(params: {
    companyId: string;
    employeeId: string;
    claimId: string;
  }) {
    const claim = await prisma.employeeExpenseClaim.findFirst({
      where: { id: params.claimId, employeeId: params.employeeId, companyId: params.companyId },
    });
    if (!claim) throw new Error('Claim not found');
    if (![ExpenseClaimStatus.DRAFT, ExpenseClaimStatus.SUBMITTED].includes(claim.status)) {
      throw new Error('Only DRAFT or SUBMITTED claims can be cancelled');
    }

    return prisma.employeeExpenseClaim.update({
      where: { id: claim.id },
      data: { status: ExpenseClaimStatus.CANCELLED },
    });
  }

  /**
   * Review claim: Supports full approval, partial approval, and rejection with payroll integration
   */
  public static async reviewClaim(params: {
    companyId: string;
    reviewerEmployeeId: string;
    claimId: string;
    action: 'APPROVE' | 'PARTIALLY_APPROVE' | 'REJECT';
    amountApproved?: number;
    reviewComments?: string;
    targetPayrollCycleId?: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const claim = await prisma.employeeExpenseClaim.findFirst({
      where: { id: params.claimId, companyId: params.companyId },
      include: { employee: true, head: true },
    });

    if (!claim) throw new Error('Expense claim not found');

    // Self-Approval Defense
    if (claim.employeeId === params.reviewerEmployeeId) {
      throw new Error('Self-Approval Denied: Employees cannot approve their own expense claims');
    }

    // Hierarchy check: Reviewer must be manager or have admin permission
    if (params.actorRole !== 'PAYROLL_ADMIN' && params.actorRole !== 'SUPER_ADMIN') {
      if (claim.employee.managerId !== params.reviewerEmployeeId) {
        throw new Error('Hierarchy Violation: You can only review claims for your direct subordinates');
      }
    }

    let approvedAmount = 0;
    let rejectedAmount = 0;
    let newStatus: ExpenseClaimStatus = ExpenseClaimStatus.REJECTED;

    if (params.action === 'APPROVE') {
      approvedAmount = claim.amountClaimed;
      rejectedAmount = 0;
      newStatus = ExpenseClaimStatus.APPROVED;
    } else if (params.action === 'PARTIALLY_APPROVE') {
      approvedAmount = params.amountApproved || 0;
      if (approvedAmount <= 0 || approvedAmount >= claim.amountClaimed) {
        throw new Error('Partial approval amount must be strictly between 0 and claimed amount');
      }
      rejectedAmount = claim.amountClaimed - approvedAmount;
      newStatus = ExpenseClaimStatus.PARTIALLY_APPROVED;
    } else {
      approvedAmount = 0;
      rejectedAmount = claim.amountClaimed;
      newStatus = ExpenseClaimStatus.REJECTED;
      if (!params.reviewComments) {
        throw new Error('Mandatory review comments required for claim rejection');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Find open or provided payroll cycle for integration
      let cycle = null;
      if (params.targetPayrollCycleId) {
        cycle = await tx.payrollCycle.findFirst({
          where: { id: params.targetPayrollCycleId, companyId: params.companyId },
        });
      } else {
        cycle = await tx.payrollCycle.findFirst({
          where: { companyId: params.companyId, status: { in: ['DRAFT', 'OPEN', 'CALCULATED', 'UNDER_REVIEW'] } },
        });
      }

      const updatedClaim = await tx.employeeExpenseClaim.update({
        where: { id: claim.id },
        data: {
          status: newStatus,
          amountApproved: approvedAmount,
          amountRejected: rejectedAmount,
          reviewerId: params.reviewerEmployeeId,
          reviewedAt: new Date(),
          reviewComments: params.reviewComments,
          payrollCycleId: approvedAmount > 0 && cycle ? cycle.id : null,
        },
      });

      // Payroll Integration: Inject non-taxable / taxable reimbursement as PayrollAdjustment
      if (approvedAmount > 0 && cycle && cycle.status !== 'LOCKED') {
        await tx.payrollAdjustment.create({
          data: {
            companyId: params.companyId,
            payrollCycleId: cycle.id,
            employeeId: claim.employeeId,
            type: AdjustmentType.BONUS_PAYOUT,
            amount: approvedAmount,
            taxable: !claim.isTaxExempt,
            reason: `Reimbursement Claim ${claim.claimNumber} (${claim.head.name})`,
            createdById: params.actorUserId,
            approvedById: params.reviewerEmployeeId,
            approvedAt: new Date(),
          },
        });
      }

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: `EXPENSE_CLAIM_${params.action}`,
        entity: 'EmployeeExpenseClaim',
        entityId: claim.id,
        afterState: { status: newStatus, amountApproved: approvedAmount, amountRejected: rejectedAmount },
      });

      return updatedClaim;
    });
  }

  public static async listEmployeeClaims(params: { companyId: string; employeeId: string; financialYear?: string }) {
    const where: any = { companyId: params.companyId, employeeId: params.employeeId };
    if (params.financialYear) where.financialYear = params.financialYear;

    return prisma.employeeExpenseClaim.findMany({
      where,
      include: { head: true, documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getClaimDetail(params: { companyId: string; employeeId: string; claimId: string }) {
    const claim = await prisma.employeeExpenseClaim.findFirst({
      where: { id: params.claimId, employeeId: params.employeeId, companyId: params.companyId },
      include: { head: true, documents: true, reviewer: true },
    });
    if (!claim) throw new Error('Claim not found or access denied');
    return claim;
  }
}