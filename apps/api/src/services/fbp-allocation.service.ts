import { PrismaClient } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class FbpAllocationService {
  public static async seedDefaultHeads(companyId: string) {
    const heads = [
      { code: 'FUEL', name: 'Fuel & Conveyance Allowance', monthlyLimit: 5000, annualLimit: 60000, isTaxExempt: true },
      { code: 'TELEPHONE', name: 'Telephone & Internet Reimbursement', monthlyLimit: 2500, annualLimit: 30000, isTaxExempt: true },
      { code: 'BOOKS', name: 'Books & Periodicals', monthlyLimit: 1500, annualLimit: 18000, isTaxExempt: true },
      { code: 'MEDICAL', name: 'Medical Domiciliary Allowance', monthlyLimit: 1250, annualLimit: 15000, isTaxExempt: false },
      { code: 'LTA', name: 'Leave Travel Allowance (LTA)', monthlyLimit: 8333, annualLimit: 100000, isTaxExempt: true },
    ];

    for (const h of heads) {
      await prisma.reimbursementHeadConfig.upsert({
        where: { companyId_code: { companyId, code: h.code } },
        update: {},
        create: {
          companyId,
          code: h.code,
          name: h.name,
          monthlyLimit: h.monthlyLimit,
          annualLimit: h.annualLimit,
          isTaxExempt: h.isTaxExempt,
          proofRequired: true,
          isActive: true,
        },
      });
    }
  }

  public static async allocateEmployeeFbp(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    headId: string;
    annualEntitlement: number;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    if (params.annualEntitlement < 0) {
      throw new Error('Allocation amount cannot be negative');
    }

    const head = await prisma.reimbursementHeadConfig.findFirst({
      where: { id: params.headId, companyId: params.companyId },
    });
    if (!head) throw new Error('Benefit head not found');

    if (params.annualEntitlement > head.annualLimit) {
      throw new Error(`Allocation ₹${params.annualEntitlement} exceeds statutory annual limit of ₹${head.annualLimit}`);
    }

    const monthlyEntitlement = Math.round(params.annualEntitlement / 12);

    const alloc = await prisma.flexibleBenefitAllocation.upsert({
      where: {
        employeeId_headId_financialYear: {
          employeeId: params.employeeId,
          headId: params.headId,
          financialYear: params.financialYear,
        },
      },
      update: {
        annualEntitlement: params.annualEntitlement,
        monthlyEntitlement,
        allocatedAmount: params.annualEntitlement,
      },
      create: {
        companyId: params.companyId,
        employeeId: params.employeeId,
        financialYear: params.financialYear,
        headId: params.headId,
        annualEntitlement: params.annualEntitlement,
        monthlyEntitlement,
        allocatedAmount: params.annualEntitlement,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'FBP_ALLOCATION_UPDATED',
      entity: 'FlexibleBenefitAllocation',
      entityId: alloc.id,
      afterState: { head: head.code, annualEntitlement: params.annualEntitlement },
    });

    return alloc;
  }

  public static async getEmployeeFbpSummary(params: { companyId: string; employeeId: string; financialYear?: string }) {
    const fy = params.financialYear || '2026-2027';
    await this.seedDefaultHeads(params.companyId);

    const heads = await prisma.reimbursementHeadConfig.findMany({
      where: { companyId: params.companyId, isActive: true },
      include: {
        allocations: { where: { employeeId: params.employeeId, financialYear: fy } },
        claims: { where: { employeeId: params.employeeId, financialYear: fy, status: { in: ['APPROVED', 'PARTIALLY_APPROVED'] } } },
      },
    });

    return heads.map((h) => {
      const alloc = h.allocations[0];
      const annualEntitlement = alloc?.annualEntitlement || h.annualLimit;
      const claimedApproved = h.claims.reduce((sum, c) => sum + c.amountApproved, 0);
      const remainingEntitlement = Math.max(0, annualEntitlement - claimedApproved);

      return {
        headId: h.id,
        code: h.code,
        name: h.name,
        monthlyLimit: h.monthlyLimit,
        annualLimit: h.annualLimit,
        annualEntitlement,
        claimedApproved,
        remainingEntitlement,
        isTaxExempt: h.isTaxExempt,
      };
    });
  }
}