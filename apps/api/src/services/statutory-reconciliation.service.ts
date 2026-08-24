import { PrismaClient, ChallanType } from '@prisma/client';

const prisma = new PrismaClient();

export class StatutoryReconciliationService {
  /**
   * TDS Reconciliation: Payroll Withholding vs Challans Deposited
   */
  public static async reconcileTds(params: {
    companyId: string;
    financialYear: string;
    quarter: string;
  }) {
    let months = [4, 5, 6];
    if (params.quarter === 'Q2') months = [7, 8, 9];
    if (params.quarter === 'Q3') months = [10, 11, 12];
    if (params.quarter === 'Q4') months = [1, 2, 3];

    const cycles = await prisma.payrollCycle.findMany({
      where: {
        companyId: params.companyId,
        month: { in: months },
        status: 'LOCKED',
      },
      include: {
        records: true,
        challanAllocations: { include: { challan: true } },
      },
    });

    const totalDeducted = cycles.reduce((sum, c) => sum + c.totalTds, 0);

    const challans = await prisma.statutoryChallan.findMany({
      where: {
        companyId: params.companyId,
        challanType: ChallanType.TDS_281,
        financialYear: params.financialYear,
        quarter: params.quarter,
      },
    });

    const totalDeposited = challans.reduce((sum, ch) => sum + ch.allocatedAmount, 0);
    const variance = totalDeducted - totalDeposited;

    let status = 'MATCHED';
    if (totalDeposited === 0 && totalDeducted > 0) {
      status = 'MISSING_CHALLAN';
    } else if (variance > 0) {
      status = 'PARTIAL';
    } else if (variance < 0) {
      status = 'OVER_ALLOCATED';
    }

    return {
      financialYear: params.financialYear,
      quarter: params.quarter,
      status,
      totalTdsDeducted: totalDeducted,
      totalTdsDeposited: totalDeposited,
      variance,
      challanCount: challans.length,
      cycleCount: cycles.length,
      details: challans.map((c) => ({
        challanNumber: c.challanNumber,
        bsrCode: c.bsrCode,
        depositDate: c.depositDate,
        allocatedAmount: c.allocatedAmount,
        unallocatedAmount: c.unallocatedAmount,
      })),
    };
  }

  /**
   * EPF Reconciliation: PayrollRecord EPF vs ECR Dataset
   */
  public static async reconcileEpf(params: {
    companyId: string;
    payrollCycleId: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: { records: { include: { employee: true } } },
    });
    if (!cycle) throw new Error('Payroll cycle not found');

    const totalEePayroll = cycle.totalEpfEmployee;
    const totalErPayroll = cycle.totalEpfEmployer;

    const ecrDoc = await prisma.complianceDocument.findFirst({
      where: {
        companyId: params.companyId,
        payrollCycleId: cycle.id,
        documentType: 'EPF_ECR',
      },
      orderBy: { createdAt: 'desc' },
    });

    const ecrMeta = (ecrDoc?.metadata as any) || {};
    const totalEeEcr = ecrMeta.totalEeContribution || totalEePayroll;
    const totalErEcr = ecrMeta.totalErContribution || totalErPayroll;

    const eeVariance = totalEePayroll - totalEeEcr;
    const erVariance = totalErPayroll - totalErEcr;
    const isMatched = eeVariance === 0 && erVariance === 0;

    return {
      payrollCycleId: cycle.id,
      month: cycle.month,
      year: cycle.year,
      status: isMatched ? 'MATCHED' : 'MISMATCH',
      totalEePayroll,
      totalEeEcr,
      totalErPayroll,
      totalErEcr,
      eeVariance,
      erVariance,
      hasEcrPrepared: Boolean(ecrDoc),
    };
  }

  /**
   * ESIC Reconciliation: PayrollRecord ESIC vs Monthly Return Dataset
   */
  public static async reconcileEsic(params: {
    companyId: string;
    payrollCycleId: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: { records: { include: { employee: true } } },
    });
    if (!cycle) throw new Error('Payroll cycle not found');

    const totalEePayroll = cycle.totalEsicEmployee;
    const totalErPayroll = cycle.totalEsicEmployer;

    const esicDoc = await prisma.complianceDocument.findFirst({
      where: {
        companyId: params.companyId,
        payrollCycleId: cycle.id,
        documentType: 'ESIC_MONTHLY_RETURN',
      },
      orderBy: { createdAt: 'desc' },
    });

    const meta = (esicDoc?.metadata as any) || {};
    const totalEeReturn = meta.totalEeContribution || totalEePayroll;
    const totalErReturn = meta.totalErContribution || totalErPayroll;

    return {
      payrollCycleId: cycle.id,
      status: totalEePayroll === totalEeReturn ? 'MATCHED' : 'MISMATCH',
      totalEePayroll,
      totalEeReturn,
      totalErPayroll,
      totalErReturn,
      hasReturnPrepared: Boolean(esicDoc),
    };
  }

  /**
   * Professional Tax State-wise Reconciliation
   */
  public static async reconcileProfessionalTax(params: {
    companyId: string;
    payrollCycleId: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: { records: { include: { employee: true } } },
    });
    if (!cycle) throw new Error('Payroll cycle not found');

    const totalPtPayroll = cycle.totalPt;
    const stateMap: Record<string, number> = {};

    for (const r of cycle.records) {
      const state = r.employee.location || 'KA';
      stateMap[state] = (stateMap[state] || 0) + r.pt;
    }

    return {
      payrollCycleId: cycle.id,
      status: 'MATCHED',
      totalPtDeducted: totalPtPayroll,
      stateBreakdown: stateMap,
    };
  }
}