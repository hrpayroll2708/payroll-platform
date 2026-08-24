import { PrismaClient, ChallanType, ChallanStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class ChallanService {
  public static async recordChallan(input: {
    companyId: string;
    challanType?: ChallanType;
    financialYear: string;
    quarter?: string;
    month?: number;
    bsrCode: string;
    challanNumber: string;
    depositDate: Date;
    taxAmount: number;
    surcharge?: number;
    cess?: number;
    interest?: number;
    feeSection234E?: number;
    penaltyOther?: number;
    chequeNumber?: string;
    bankName?: string;
    remarks?: string;
    createdById: string;
    actorEmail: string;
    actorRole: string;
  }) {
    if (!/^[0-9]{7}$/.test(input.bsrCode.trim())) {
      throw new Error('Invalid BSR Code: Must be exactly 7 numeric digits');
    }
    if (!/^[0-9]{1,5}$/.test(input.challanNumber.trim())) {
      throw new Error('Invalid Challan Number: Must be up to 5 numeric digits');
    }

    const surcharge = input.surcharge || 0;
    const cess = input.cess || 0;
    const interest = input.interest || 0;
    const feeSection234E = input.feeSection234E || 0;
    const penaltyOther = input.penaltyOther || 0;
    const totalAmount = input.taxAmount + surcharge + cess + interest + feeSection234E + penaltyOther;

    const challan = await prisma.statutoryChallan.create({
      data: {
        companyId: input.companyId,
        challanType: input.challanType || ChallanType.TDS_281,
        financialYear: input.financialYear,
        quarter: input.quarter,
        month: input.month,
        bsrCode: input.bsrCode.trim(),
        challanNumber: input.challanNumber.trim().padStart(5, '0'),
        depositDate: input.depositDate,
        taxAmount: input.taxAmount,
        surcharge,
        cess,
        interest,
        feeSection234E,
        penaltyOther,
        totalAmount,
        allocatedAmount: 0,
        unallocatedAmount: totalAmount,
        status: ChallanStatus.RECORDED,
        chequeNumber: input.chequeNumber,
        bankName: input.bankName,
        remarks: input.remarks,
        createdById: input.createdById,
      },
    });

    await AuditService.log({
      companyId: input.companyId,
      userId: input.createdById,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: 'STATUTORY_CHALLAN_RECORDED',
      entity: 'StatutoryChallan',
      entityId: challan.id,
      afterState: { bsrCode: challan.bsrCode, challanNumber: challan.challanNumber, totalAmount },
    });

    return challan;
  }

  public static async allocateChallan(params: {
    companyId: string;
    challanId: string;
    payrollCycleId?: string;
    compliancePeriodId?: string;
    amount: number;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    if (params.amount <= 0) {
      throw new Error('Allocation amount must be strictly greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      const challan = await tx.statutoryChallan.findFirst({
        where: { id: params.challanId, companyId: params.companyId },
      });

      if (!challan) throw new Error('Statutory challan not found');
      if (challan.unallocatedAmount < params.amount) {
        throw new Error(`Cannot over-allocate challan. Available: ₹${challan.unallocatedAmount}, Requested: ₹${params.amount}`);
      }

      const newAllocated = challan.allocatedAmount + params.amount;
      const newUnallocated = challan.unallocatedAmount - params.amount;
      const newStatus = newUnallocated === 0 ? ChallanStatus.RECONCILED : ChallanStatus.VALIDATED;

      const updatedChallan = await tx.statutoryChallan.update({
        where: { id: challan.id },
        data: {
          allocatedAmount: newAllocated,
          unallocatedAmount: newUnallocated,
          status: newStatus,
        },
      });

      const allocation = await tx.challanAllocation.create({
        data: {
          companyId: params.companyId,
          challanId: challan.id,
          payrollCycleId: params.payrollCycleId || null,
          compliancePeriodId: params.compliancePeriodId || null,
          allocatedAmount: params.amount,
          allocatedById: params.actorUserId,
        },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'CHALLAN_ALLOCATED',
        entity: 'ChallanAllocation',
        entityId: allocation.id,
        afterState: { challanId: challan.id, allocatedAmount: params.amount, remaining: newUnallocated },
      });

      return { challan: updatedChallan, allocation };
    });
  }

  public static async listChallans(params: {
    companyId: string;
    financialYear?: string;
    challanType?: ChallanType;
  }) {
    const where: any = { companyId: params.companyId };
    if (params.financialYear) where.financialYear = params.financialYear;
    if (params.challanType) where.challanType = params.challanType;

    return prisma.statutoryChallan.findMany({
      where,
      include: { allocations: true },
      orderBy: { depositDate: 'desc' },
    });
  }
}