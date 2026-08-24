import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ComplianceCalendarEvent {
  id: string;
  category: 'TDS' | 'EPF' | 'ESIC' | 'PROFESSIONAL_TAX' | 'FORM_24Q';
  title: string;
  financialYear: string;
  quarter?: string;
  month?: number;
  periodLabel: string;
  dueDate: string | null;
  status: 'PENDING' | 'PREPARED' | 'RECONCILED' | 'DEADLINE_NOT_CONFIGURED';
  actionRequired: string;
}

export class ComplianceCalendarService {
  public static async getComplianceCalendar(params: {
    companyId: string;
    financialYear: string;
  }): Promise<ComplianceCalendarEvent[]> {
    const cycles = await prisma.payrollCycle.findMany({
      where: { companyId: params.companyId, status: 'LOCKED' },
      include: { complianceDocuments: true },
      orderBy: { month: 'asc' },
    });

    const events: ComplianceCalendarEvent[] = [];
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const m of months) {
      const cycle = cycles.find((c) => c.month === m);
      const isLocked = Boolean(cycle);
      const label = `${monthNames[m]} ${m >= 4 ? params.financialYear.split('-')[0] : params.financialYear.split('-')[1]}`;

      // EPF Monthly Obligation
      events.push({
        id: `EPF_${m}`,
        category: 'EPF',
        title: `EPF Electronic Challan cum Return (ECR) - ${label}`,
        financialYear: params.financialYear,
        month: m,
        periodLabel: label,
        dueDate: null, // Transparent: Not hard-coding unverified legal deadlines
        status: isLocked ? 'PREPARED' : 'DEADLINE_NOT_CONFIGURED',
        actionRequired: isLocked ? 'Export ECR file for external submission' : 'Lock payroll cycle to enable ECR preparation',
      });

      // ESIC Monthly Obligation
      events.push({
        id: `ESIC_${m}`,
        category: 'ESIC',
        title: `ESIC Monthly Contribution Return - ${label}`,
        financialYear: params.financialYear,
        month: m,
        periodLabel: label,
        dueDate: null,
        status: isLocked ? 'PREPARED' : 'DEADLINE_NOT_CONFIGURED',
        actionRequired: isLocked ? 'Export ESIC return dataset' : 'Lock payroll cycle to enable return compilation',
      });

      // PT Monthly Obligation
      events.push({
        id: `PT_${m}`,
        category: 'PROFESSIONAL_TAX',
        title: `Professional Tax Monthly Statement - ${label}`,
        financialYear: params.financialYear,
        month: m,
        periodLabel: label,
        dueDate: null,
        status: isLocked ? 'RECONCILED' : 'DEADLINE_NOT_CONFIGURED',
        actionRequired: isLocked ? 'Verify state PT distribution' : 'Pending payroll calculation',
      });
    }

    // Quarterly Form 24Q Obligations
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach((q) => {
      events.push({
        id: `FORM24Q_${q}`,
        category: 'FORM_24Q',
        title: `Form 24Q TDS Quarterly Return (${q}) - FY ${params.financialYear}`,
        financialYear: params.financialYear,
        quarter: q,
        periodLabel: `${q} FY ${params.financialYear}`,
        dueDate: null,
        status: 'PENDING',
        actionRequired: 'Validate Challan 281 mapping and generate Annexure I & II',
      });
    });

    return events;
  }
}