import { PrismaClient } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class ReportService {
  public static async listTemplates() {
    return [
      { code: 'EMP_MASTER', name: 'Employee Master Report', category: 'WORKFORCE' },
      { code: 'PAYROLL_REGISTER', name: 'Authoritative Payroll Register', category: 'PAYROLL' },
      { code: 'STATUTORY_SUMMARY', name: 'Statutory Liability Summary (EPF, ESIC, PT, TDS)', category: 'COMPLIANCE' },
      { code: 'FNF_REPORT', name: 'Full & Final Settlement Register', category: 'EXIT' },
      { code: 'EXPENSE_REPORT', name: 'Reimbursement Claims Report', category: 'EXPENSE' },
    ];
  }

  public static async runReport(params: { companyId: string; templateCode: string; financialYear?: string }) {
    const fy = params.financialYear || '2026-2027';

    if (params.templateCode === 'EMP_MASTER') {
      return prisma.employee.findMany({
        where: { companyId: params.companyId },
        select: {
          employeeCode: true,
          name: true,
          email: true,
          department: true,
          designation: true,
          employmentStatus: true,
          dateOfJoining: true,
        },
      });
    }

    if (params.templateCode === 'PAYROLL_REGISTER') {
      return prisma.payrollRecord.findMany({
        where: { payrollCycle: { companyId: params.companyId, status: 'LOCKED' } },
        include: { employee: { select: { employeeCode: true, name: true } }, payrollCycle: true },
        take: 100,
      });
    }

    if (params.templateCode === 'FNF_REPORT') {
      return prisma.fnFSettlement.findMany({
        where: { companyId: params.companyId },
        include: { employee: { select: { employeeCode: true, name: true } } },
      });
    }

    return [];
  }

  public static async saveReportConfig(params: {
    companyId: string;
    createdById: string;
    name: string;
    description?: string;
    configuration: any;
    actorEmail: string;
    actorRole: string;
  }) {
    const report = await prisma.savedReport.create({
      data: {
        companyId: params.companyId,
        createdById: params.createdById,
        name: params.name,
        description: params.description,
        configuration: params.configuration,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'SAVED_REPORT_CREATED',
      entity: 'SavedReport',
      entityId: report.id,
      afterState: { name: params.name },
    });

    return report;
  }

  public static async listSavedReports(companyId: string) {
    return prisma.savedReport.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}