import { PrismaClient, StatutoryConfigType, ComplianceExceptionSeverity } from '@prisma/client';
import crypto from 'crypto';
import { ComplianceExceptionService } from './compliance-exception.service';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class CompliancePreparationService {
  /**
   * Prepares EPFO ECR (Electronic Challan cum Return) Dataset
   */
  public static async prepareEcrDataset(params: {
    companyId: string;
    payrollCycleId: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: {
        records: {
          include: { employee: true },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
      },
    });

    if (!cycle) throw new Error('Payroll cycle not found');

    const ecrRows: any[] = [];
    let totalEpfWages = 0;
    let totalEpsWages = 0;
    let totalEeContribution = 0;
    let totalErContribution = 0;
    let totalEpsContribution = 0;

    for (const record of cycle.records) {
      const emp = record.employee;
      const snapshot = (record.statutoryConfigSnapshot as any)?.epf || {};
      const epfWages = snapshot.epfWages || (record.basicSalary > 0 ? Math.min(record.basicSalary, 15000) : 0);
      const epsWages = snapshot.epsWages || epfWages;
      const eeShare = record.epfEmployee;
      const erShare = record.epfEmployer;
      const epsShare = snapshot.epsContribution || Math.round(epsWages * 0.0833);
      const erEpfShare = Math.max(0, erShare - epsShare);
      const ncpDays = Math.round(record.lopDays || 0);

      // Exception Check: Missing UAN
      if (eeShare > 0 && (!emp.uan || emp.uan.trim().length !== 12)) {
        await ComplianceExceptionService.recordException({
          companyId: params.companyId,
          employeeId: emp.id,
          payrollCycleId: cycle.id,
          category: StatutoryConfigType.EPF,
          severity: ComplianceExceptionSeverity.BLOCKING,
          title: `Missing or Invalid UAN for ${emp.name}`,
          description: `Employee ${emp.employeeCode} has ₹${eeShare} EPF deduction but lacks a valid 12-digit UAN.`,
          detectedValue: emp.uan || 'NONE',
          expectedValue: '12-digit UAN',
          createdById: params.actorUserId,
        });
      }

      totalEpfWages += epfWages;
      totalEpsWages += epsWages;
      totalEeContribution += eeShare;
      totalErContribution += erShare;
      totalEpsContribution += epsShare;

      ecrRows.push({
        uan: emp.uan || 'NOT_CONFIGURED',
        memberId: emp.employeeCode,
        memberName: emp.name,
        grossWages: record.earnedGross,
        epfWages,
        epsWages,
        edliWages: epsWages,
        eeContribution: eeShare,
        epsContribution: epsShare,
        erEpfContribution: erEpfShare,
        ncpDays,
        refundOfAdvances: 0,
      });
    }

    const payloadString = JSON.stringify(ecrRows);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

    const document = await prisma.complianceDocument.create({
      data: {
        companyId: params.companyId,
        payrollCycleId: cycle.id,
        documentType: 'EPF_ECR',
        fileName: `ECR_${cycle.year}_${String(cycle.month).padStart(2, '0')}.json`,
        fileChecksumSha256: checksum,
        status: 'PREPARED',
        metadata: {
          totalRecords: ecrRows.length,
          totalEpfWages,
          totalEpsWages,
          totalEeContribution,
          totalErContribution,
          totalEpsContribution,
        },
        createdById: params.actorUserId,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'EPF_ECR_PREPARED',
      entity: 'ComplianceDocument',
      entityId: document.id,
      afterState: { totalRecords: ecrRows.length, checksum },
    });

    return {
      documentId: document.id,
      fileName: document.fileName,
      status: 'PREPARED',
      summary: {
        totalEmployees: ecrRows.length,
        totalEpfWages,
        totalEeContribution,
        totalErContribution,
        checksum,
      },
      records: ecrRows,
    };
  }

  /**
   * Prepares ESIC Monthly Return Dataset
   */
  public static async prepareEsicDataset(params: {
    companyId: string;
    payrollCycleId: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: {
        records: {
          include: { employee: true },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
      },
    });

    if (!cycle) throw new Error('Payroll cycle not found');

    const esicRows: any[] = [];
    let totalWages = 0;
    let totalEeContribution = 0;
    let totalErContribution = 0;

    for (const record of cycle.records) {
      if (record.esicEmployee > 0 || record.esicEmployer > 0) {
        const emp = record.employee;

        // Exception Check: Missing ESIC Number
        if (!emp.esicNumber || emp.esicNumber.trim().length < 10) {
          await ComplianceExceptionService.recordException({
            companyId: params.companyId,
            employeeId: emp.id,
            payrollCycleId: cycle.id,
            category: StatutoryConfigType.ESIC,
            severity: ComplianceExceptionSeverity.WARNING,
            title: `Missing ESIC IP Number for ${emp.name}`,
            description: `Employee ${emp.employeeCode} has ESIC deduction of ₹${record.esicEmployee} but no valid 10/17-digit IP number.`,
            detectedValue: emp.esicNumber || 'NONE',
            expectedValue: '17-digit ESIC IP',
            createdById: params.actorUserId,
          });
        }

        totalWages += record.earnedGross;
        totalEeContribution += record.esicEmployee;
        totalErContribution += record.esicEmployer;

        esicRows.push({
          ipNumber: emp.esicNumber || 'NOT_CONFIGURED',
          ipName: emp.name,
          employeeCode: emp.employeeCode,
          numDaysWorked: record.payableDays,
          monthlyWages: record.earnedGross,
          eeContribution: record.esicEmployee,
          erContribution: record.esicEmployer,
          reasonCode: record.payableDays === 0 ? '01' : null,
        });
      }
    }

    const payloadString = JSON.stringify(esicRows);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

    const document = await prisma.complianceDocument.create({
      data: {
        companyId: params.companyId,
        payrollCycleId: cycle.id,
        documentType: 'ESIC_MONTHLY_RETURN',
        fileName: `ESIC_RETURN_${cycle.year}_${String(cycle.month).padStart(2, '0')}.json`,
        fileChecksumSha256: checksum,
        status: 'PREPARED',
        metadata: {
          totalEligibleEmployees: esicRows.length,
          totalWages,
          totalEeContribution,
          totalErContribution,
        },
        createdById: params.actorUserId,
      },
    });

    return {
      documentId: document.id,
      fileName: document.fileName,
      status: 'PREPARED',
      summary: {
        totalEligibleEmployees: esicRows.length,
        totalWages,
        totalEeContribution,
        totalErContribution,
        checksum,
      },
      records: esicRows,
    };
  }

  /**
   * Prepares State-wise Professional Tax Summary Statement
   */
  public static async preparePtSummary(params: {
    companyId: string;
    payrollCycleId: string;
    actorUserId: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: {
        records: {
          include: { employee: true },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
      },
    });

    if (!cycle) throw new Error('Payroll cycle not found');

    const stateMap: Record<string, { employeeCount: number; totalGross: number; totalPt: number; records: any[] }> = {};

    for (const record of cycle.records) {
      const snapshot = (record.statutoryConfigSnapshot as any)?.pt || {};
      const state = snapshot.stateCode || record.employee.location || 'KA';

      if (!stateMap[state]) {
        stateMap[state] = { employeeCount: 0, totalGross: 0, totalPt: 0, records: [] };
      }

      stateMap[state].employeeCount += 1;
      stateMap[state].totalGross += record.earnedGross;
      stateMap[state].totalPt += record.pt;
      stateMap[state].records.push({
        employeeCode: record.employee.employeeCode,
        name: record.employee.name,
        earnedGross: record.earnedGross,
        ptDeduction: record.pt,
      });
    }

    const stateSummaries = Object.keys(stateMap).map((state) => ({
      stateCode: state,
      employeeCount: stateMap[state].employeeCount,
      totalGross: stateMap[state].totalGross,
      totalPtDeducted: stateMap[state].totalPt,
    }));

    return {
      payrollCycleId: cycle.id,
      period: `${cycle.month}/${cycle.year}`,
      totalPtDeducted: cycle.totalPt,
      stateSummaries,
      breakdownByState: stateMap,
    };
  }
}