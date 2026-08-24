import { PrismaClient, ComplianceExceptionSeverity, ComplianceExceptionStatus, StatutoryConfigType } from '@prisma/client';

const prisma = new PrismaClient();

export class ComplianceExceptionService {
  static async list(params: {
    companyId: string;
    status?: ComplianceExceptionStatus;
    severity?: ComplianceExceptionSeverity;
    category?: StatutoryConfigType;
  }) {
    const where: any = { companyId: params.companyId };
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    if (params.category) where.category = params.category;

    return prisma.complianceException.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async recordException(input: {
    companyId: string;
    employeeId?: string;
    payrollCycleId?: string;
    statutoryPeriodId?: string;
    category: StatutoryConfigType;
    severity: ComplianceExceptionSeverity;
    title: string;
    description: string;
    detectedValue?: string;
    expectedValue?: string;
    createdById: string;
  }) {
    return prisma.complianceException.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId || null,
        payrollCycleId: input.payrollCycleId || null,
        statutoryPeriodId: input.statutoryPeriodId || null,
        category: input.category,
        severity: input.severity,
        status: ComplianceExceptionStatus.OPEN,
        title: input.title,
        description: input.description,
        detectedValue: input.detectedValue,
        expectedValue: input.expectedValue,
        createdById: input.createdById,
      },
    });
  }

  static async resolveException(params: {
    id: string;
    companyId: string;
    resolvedById: string;
    resolutionNotes: string;
  }) {
    return prisma.complianceException.update({
      where: { id: params.id },
      data: {
        status: ComplianceExceptionStatus.RESOLVED,
        resolvedById: params.resolvedById,
        resolutionNotes: params.resolutionNotes,
        resolvedAt: new Date(),
      },
    });
  }
}