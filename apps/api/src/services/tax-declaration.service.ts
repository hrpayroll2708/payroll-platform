import { PrismaClient, TaxRegime, DeclarationStatus, ProofStatus, TaxSectionCategory } from '@prisma/client';
import { AuditService } from './audit.service';
import { TdsCalculatorService } from './tds-calculator.service';

const prisma = new PrismaClient();

export class TaxDeclarationService {
  public static async setTaxRegime(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    taxRegime: TaxRegime;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const existing = await prisma.employeeStatutoryProfile.findFirst({
      where: { employeeId: params.employeeId, financialYear: params.financialYear },
      orderBy: { effectiveFrom: 'desc' },
    });

    let profile;
    if (existing) {
      profile = await prisma.employeeStatutoryProfile.update({
        where: { id: existing.id },
        data: {
          taxRegime: params.taxRegime,
          approvedById: params.actorUserId,
        },
      });
    } else {
      profile = await prisma.employeeStatutoryProfile.create({
        data: {
          companyId: params.companyId,
          employeeId: params.employeeId,
          financialYear: params.financialYear,
          taxRegime: params.taxRegime,
          effectiveFrom: new Date(`${params.financialYear.split('-')[0]}-04-01`),
          createdById: params.actorUserId,
          approvedById: params.actorUserId,
        },
      });
    }

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'TAX_REGIME_UPDATED',
      entity: 'EmployeeStatutoryProfile',
      entityId: profile.id,
      afterState: { taxRegime: params.taxRegime, financialYear: params.financialYear },
    });

    return profile;
  }

  public static async submitDeclarationItem(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    taxRegime: TaxRegime;
    sectionCategory: TaxSectionCategory;
    itemCode: string;
    description?: string;
    declaredAmount: number;
    actorEmail: string;
    actorRole: string;
  }) {
    return prisma.employeeTaxDeclaration.create({
      data: {
        companyId: params.companyId,
        employeeId: params.employeeId,
        financialYear: params.financialYear,
        taxRegime: params.taxRegime,
        status: DeclarationStatus.SUBMITTED,
        sectionCategory: params.sectionCategory,
        itemCode: params.itemCode,
        description: params.description,
        declaredAmount: params.declaredAmount,
        submittedAt: new Date(),
      },
    });
  }

  public static async reviewDeclarationItem(params: {
    declarationId: string;
    companyId: string;
    status: DeclarationStatus;
    approvedAmount: number;
    rejectionReason?: string;
    reviewerId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const decl = await prisma.employeeTaxDeclaration.findFirst({
      where: { id: params.declarationId, companyId: params.companyId },
    });
    if (!decl) throw new Error('Declaration not found');

    const updated = await prisma.employeeTaxDeclaration.update({
      where: { id: decl.id },
      data: {
        status: params.status,
        approvedAmount: params.status === DeclarationStatus.APPROVED ? params.approvedAmount : 0,
        rejectionReason: params.rejectionReason,
        reviewedById: params.reviewerId,
        reviewedAt: new Date(),
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.reviewerId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'TAX_DECLARATION_REVIEWED',
      entity: 'EmployeeTaxDeclaration',
      entityId: decl.id,
      afterState: { status: params.status, approvedAmount: params.approvedAmount },
    });

    return updated;
  }

  public static async recordPreviousEmployerIncome(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    employerName: string;
    grossSalary: number;
    exemptions?: number;
    tdsDeducted: number;
    epfDeducted?: number;
    ptDeducted?: number;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    return prisma.previousEmployerIncome.upsert({
      where: {
        employeeId_financialYear: {
          employeeId: params.employeeId,
          financialYear: params.financialYear,
        },
      },
      update: {
        employerName: params.employerName,
        grossSalary: params.grossSalary,
        exemptions: params.exemptions || 0,
        tdsDeducted: params.tdsDeducted,
        epfDeducted: params.epfDeducted || 0,
        ptDeducted: params.ptDeducted || 0,
        isApproved: true,
        approvedById: params.actorUserId,
        approvedAt: new Date(),
      },
      create: {
        companyId: params.companyId,
        employeeId: params.employeeId,
        financialYear: params.financialYear,
        employerName: params.employerName,
        grossSalary: params.grossSalary,
        exemptions: params.exemptions || 0,
        tdsDeducted: params.tdsDeducted,
        epfDeducted: params.epfDeducted || 0,
        ptDeducted: params.ptDeducted || 0,
        isApproved: true,
        approvedById: params.actorUserId,
        approvedAt: new Date(),
      },
    });
  }

  public static async getEmployeeTaxComputation(params: {
    companyId: string;
    employeeId: string;
    financialYear: string;
    remainingPeriods?: number;
  }) {
    const employee = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
      include: {
        statutoryProfiles: {
          where: { financialYear: params.financialYear },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        taxDeclarations: {
          where: { financialYear: params.financialYear },
        },
        previousEmployerIncomes: {
          where: { financialYear: params.financialYear },
        },
        payrollRecords: {
          where: { payrollCycle: { companyId: params.companyId } },
        },
      },
    });

    if (!employee) throw new Error('Employee not found');

    const regime = employee.statutoryProfiles[0]?.taxRegime || TaxRegime.NEW_REGIME_115BAC;
    const projectedAnnualGross = (employee.monthlyGross || 0) * 12;

    let approvedChapterVIA = 0;
    for (const d of employee.taxDeclarations) {
      if (d.status === DeclarationStatus.APPROVED) {
        approvedChapterVIA += d.approvedAmount;
      }
    }
    approvedChapterVIA = Math.min(approvedChapterVIA, 150000);

    const prevIncome = employee.previousEmployerIncomes[0];
    const prevGross = prevIncome?.isApproved ? prevIncome.grossSalary : 0;
    const prevTds = prevIncome?.isApproved ? prevIncome.tdsDeducted : 0;
    const ytdTdsPaid = employee.payrollRecords.reduce((acc, curr) => acc + curr.tds, 0);

    return TdsCalculatorService.calculateTaxProjection({
      financialYear: params.financialYear,
      taxRegime: regime,
      projectedAnnualGross,
      approvedChapterVIADeductions: approvedChapterVIA,
      ytdTdsPaid,
      previousEmployerIncome: prevGross,
      previousEmployerTds: prevTds,
      remainingPayrollPeriods: params.remainingPeriods || 12,
      pan: employee.pan,
    });
  }
}