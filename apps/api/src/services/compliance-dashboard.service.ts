import { PrismaClient, ComplianceExceptionStatus, ComplianceExceptionSeverity } from '@prisma/client';

const prisma = new PrismaClient();

export class ComplianceDashboardService {
  public static async getDashboardMetrics(params: {
    companyId: string;
    financialYear: string;
  }) {
    const openExceptionsCount = await prisma.complianceException.count({
      where: { companyId: params.companyId, status: ComplianceExceptionStatus.OPEN },
    });

    const blockingExceptionsCount = await prisma.complianceException.count({
      where: {
        companyId: params.companyId,
        status: ComplianceExceptionStatus.OPEN,
        severity: ComplianceExceptionSeverity.BLOCKING,
      },
    });

    const totalChallans = await prisma.statutoryChallan.count({
      where: { companyId: params.companyId, financialYear: params.financialYear },
    });

    const totalDocuments = await prisma.complianceDocument.count({
      where: { companyId: params.companyId },
    });

    // Health score: 100 base, -20 per blocking exception, -5 per warning
    const healthScore = Math.max(0, 100 - (blockingExceptionsCount * 20) - ((openExceptionsCount - blockingExceptionsCount) * 5));

    return {
      financialYear: params.financialYear,
      healthScore,
      summary: {
        openExceptions: openExceptionsCount,
        blockingExceptions: blockingExceptionsCount,
        totalChallans,
        documentsInVault: totalDocuments,
      },
      status: {
        epf: 'ACTIVE_PREPARED',
        esic: 'ACTIVE_PREPARED',
        professionalTax: 'RECONCILED',
        form24Q: 'READY_FOR_VALIDATION',
      },
    };
  }
}