import { PrismaClient, StatutoryConfigType, ComplianceExceptionSeverity } from '@prisma/client';
import crypto from 'crypto';
import { ComplianceExceptionService } from './compliance-exception.service';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class Form24QService {
  private static getQuarterMonths(quarter: string): number[] {
    switch (quarter.toUpperCase()) {
      case 'Q1': return [4, 5, 6];
      case 'Q2': return [7, 8, 9];
      case 'Q3': return [10, 11, 12];
      case 'Q4': return [1, 2, 3];
      default: return [4, 5, 6];
    }
  }

  public static async validateForm24Q(params: {
    companyId: string;
    financialYear: string;
    quarter: string;
    actorUserId: string;
  }) {
    const months = this.getQuarterMonths(params.quarter);
    const startYear = parseInt(params.financialYear.split('-')[0], 10);
    const endYear = startYear + 1;

    const cycles = await prisma.payrollCycle.findMany({
      where: {
        companyId: params.companyId,
        month: { in: months },
        year: { in: [startYear, endYear] },
        status: 'LOCKED',
      },
      include: {
        records: {
          include: { employee: true },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
        challanAllocations: {
          include: { challan: true },
        },
      },
    });

    const company = await prisma.company.findUnique({ where: { id: params.companyId } });
    const exceptions: string[] = [];

    if (!company?.tanNumber || company.tanNumber.trim().length !== 10) {
      await ComplianceExceptionService.recordException({
        companyId: params.companyId,
        category: StatutoryConfigType.TDS,
        severity: ComplianceExceptionSeverity.BLOCKING,
        title: 'Missing or Invalid Company TAN',
        description: 'Valid 10-digit Tax Deduction and Collection Account Number (TAN) required for Form 24Q preparation.',
        detectedValue: company?.tanNumber || 'NONE',
        expectedValue: '10-character TAN (e.g. BLRR12345C)',
        createdById: params.actorUserId,
      });
      exceptions.push('BLOCKING: Missing Company TAN');
    }

    let totalQuarterTds = 0;
    let recordsCount = 0;

    for (const cycle of cycles) {
      for (const record of cycle.records) {
        recordsCount++;
        totalQuarterTds += record.tds;
        const emp = record.employee;

        if (record.tds > 0 && (!emp.pan || emp.pan.trim().length !== 10)) {
          await ComplianceExceptionService.recordException({
            companyId: params.companyId,
            employeeId: emp.id,
            payrollCycleId: cycle.id,
            category: StatutoryConfigType.TDS,
            severity: ComplianceExceptionSeverity.WARNING,
            title: `Missing PAN for ${emp.name}`,
            description: `Employee has ₹${record.tds} TDS deducted but lacks a valid PAN. Section 206AA penal withholding applies.`,
            detectedValue: emp.pan || 'NONE',
            expectedValue: '10-character PAN',
            createdById: params.actorUserId,
          });
        }
      }
    }

    return {
      isValid: exceptions.length === 0,
      financialYear: params.financialYear,
      quarter: params.quarter,
      cyclesFound: cycles.length,
      recordsCount,
      totalQuarterTds,
      blockingExceptions: exceptions,
    };
  }

  public static async prepareForm24Q(params: {
    companyId: string;
    financialYear: string;
    quarter: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const months = this.getQuarterMonths(params.quarter);
    const startYear = parseInt(params.financialYear.split('-')[0], 10);
    const endYear = startYear + 1;

    const cycles = await prisma.payrollCycle.findMany({
      where: {
        companyId: params.companyId,
        month: { in: months },
        year: { in: [startYear, endYear] },
        status: 'LOCKED',
      },
      include: {
        records: {
          include: { employee: true },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
        challanAllocations: {
          include: { challan: true },
        },
      },
    });

    if (cycles.length === 0) {
      throw new Error(`No locked payroll cycles found for ${params.financialYear} ${params.quarter}`);
    }

    const company = await prisma.company.findUnique({ where: { id: params.companyId } });

    // Compile Challan entries for Annexure I
    const challanMap = new Map<string, any>();
    for (const cycle of cycles) {
      for (const alloc of cycle.challanAllocations) {
        const c = alloc.challan;
        if (!challanMap.has(c.id)) {
          challanMap.set(c.id, {
            bsrCode: c.bsrCode,
            challanNumber: c.challanNumber,
            depositDate: c.depositDate.toISOString().split('T')[0],
            tdsAmount: c.taxAmount,
            surcharge: c.surcharge,
            cess: c.cess,
            interest: c.interest,
            fee234E: c.feeSection234E,
            totalAmount: c.totalAmount,
            allocatedAmount: alloc.allocatedAmount,
          });
        }
      }
    }

    // Compile Deductee/Salary entries for Annexure II
    const deducteeRecords: any[] = [];
    let totalQuarterGross = 0;
    let totalQuarterTds = 0;

    for (const cycle of cycles) {
      for (const r of cycle.records) {
        totalQuarterGross += r.earnedGross;
        totalQuarterTds += r.tds;
        deducteeRecords.push({
          employeeCode: r.employee.employeeCode,
          employeeName: r.employee.name,
          pan: r.employee.pan || 'PANNOTAVBL',
          grossSalary: r.earnedGross,
          tdsDeducted: r.tds,
          tdsDeposited: r.tds,
          payPeriod: `${cycle.month}/${cycle.year}`,
          isPanMissing: !r.employee.pan || r.employee.pan.length !== 10,
        });
      }
    }

    const payload = {
      deductor: {
        tan: company?.tanNumber || 'BLRR00000A',
        pan: company?.panNumber || 'AAACC1234D',
        name: company?.name,
        address: company?.address || company?.city,
      },
      quarterDetails: {
        financialYear: params.financialYear,
        quarter: params.quarter,
        totalCycles: cycles.length,
        totalDeductees: deducteeRecords.length,
        totalQuarterGross,
        totalQuarterTds,
      },
      challans: Array.from(challanMap.values()),
      deductees: deducteeRecords,
      complianceNote: 'PREPARATION ARTIFACT ONLY — Requires official external e-TDS FVU verification prior to filing.',
    };

    const payloadString = JSON.stringify(payload);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

    // Document Versioning: Determine next version
    const existingDocCount = await prisma.complianceDocument.count({
      where: {
        companyId: params.companyId,
        documentType: 'FORM_24Q_DATASET',
        fileName: { startsWith: `FORM24Q_${params.financialYear}_${params.quarter}` },
      },
    });

    const version = existingDocCount + 1;
    const fileName = `FORM24Q_${params.financialYear}_${params.quarter}_v${version}.json`;

    const doc = await prisma.complianceDocument.create({
      data: {
        companyId: params.companyId,
        documentType: 'FORM_24Q_DATASET',
        fileName,
        version,
        fileChecksumSha256: checksum,
        status: 'PREPARED',
        metadata: {
          financialYear: params.financialYear,
          quarter: params.quarter,
          totalRecords: deducteeRecords.length,
          totalQuarterGross,
          totalQuarterTds,
          challanCount: challanMap.size,
        },
        createdById: params.actorUserId,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'FORM_24Q_PREPARED',
      entity: 'ComplianceDocument',
      entityId: doc.id,
      afterState: { financialYear: params.financialYear, quarter: params.quarter, version, checksum },
    });

    return {
      documentId: doc.id,
      fileName: doc.fileName,
      version: doc.version,
      status: 'PREPARED',
      checksum,
      dataset: payload,
    };
  }
}