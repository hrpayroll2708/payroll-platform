import { PrismaClient, CompliancePeriodStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class CompliancePeriodService {
  static async getOrCreatePeriod(params: {
    companyId: string;
    financialYear: string;
    month: number;
    quarter: string;
  }) {
    const year = parseInt(params.financialYear.split('-')[0], 10) + (params.month >= 4 ? 0 : 1);
    const startDate = new Date(Date.UTC(year, params.month - 1, 1));
    const endDate = new Date(Date.UTC(year, params.month, 0));

    return prisma.compliancePeriod.upsert({
      where: {
        companyId_financialYear_month: {
          companyId: params.companyId,
          financialYear: params.financialYear,
          month: params.month,
        },
      },
      update: {},
      create: {
        companyId: params.companyId,
        financialYear: params.financialYear,
        month: params.month,
        quarter: params.quarter,
        startDate,
        endDate,
        status: CompliancePeriodStatus.OPEN,
      },
    });
  }

  static async transitionStatus(params: {
    id: string;
    companyId: string;
    targetStatus: CompliancePeriodStatus;
    remarks?: string;
  }) {
    return prisma.compliancePeriod.update({
      where: { id: params.id },
      data: {
        status: params.targetStatus,
        remarks: params.remarks,
      },
    });
  }
}