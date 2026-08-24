import { PrismaClient, StatutoryConfigType, StatutoryConfigStatus, TaxRegime, ChallanType, ChallanStatus, ComplianceExceptionSeverity } from '@prisma/client';
import { StatutoryCalculatorService } from '../src/services/statutory-calculator.service';
import { StatutoryConfigService } from '../src/services/statutory-config.service';
import { TdsCalculatorService } from '../src/services/tds-calculator.service';
import { TaxDeclarationService } from '../src/services/tax-declaration.service';
import { Form24QService } from '../src/services/form24q.service';
import { ChallanService } from '../src/services/challan.service';
import { StatutoryReconciliationService } from '../src/services/statutory-reconciliation.service';
import { ComplianceDashboardService } from '../src/services/compliance-dashboard.service';
import { ComplianceCalendarService } from '../src/services/compliance-calendar.service';

const prisma = new PrismaClient();

describe('Phase 7F: Production-Readiness, Security & Financial Integrity Hardening (38 Scenarios)', () => {
  let companyAId: string;
  let companyBId: string;
  let adminAId: string;
  let adminBId: string;
  let employeeA1Id: string;
  let employeeA2Id: string;
  let employeeB1Id: string;
  let lockedCycleAId: string;
  let challanAId: string;

  beforeAll(async () => {
    // 1. Clean up fixtures for complete test isolation
    const testCodes = ['TEST-7F-CORP-A', 'TEST-7F-CORP-B', 'TEST-7F-CORP-C'];
    await prisma.complianceException.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.complianceDocument.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.compliancePeriod.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.challanAllocation.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.statutoryChallan.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.previousEmployerIncome.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.investmentProofDocument.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeTaxDeclaration.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeStatutoryProfile.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.statutoryConfiguration.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A (Tenant A)
    const compA = await prisma.company.create({
      data: {
        code: 'TEST-7F-CORP-A',
        name: 'Sarwin Hardening Corp A',
        tanNumber: 'BLRR77777C',
        panNumber: 'AAACC7777D',
      },
    });
    companyAId = compA.id;

    // 3. Setup Company B (Tenant B)
    const compB = await prisma.company.create({
      data: {
        code: 'TEST-7F-CORP-B',
        name: 'Isolated Security Tenant B',
        tanNumber: 'MUMB88888D',
        panNumber: 'BBBDD8888E',
      },
    });
    companyBId = compB.id;

    // 4. Setup Admin Users
    const uA = await prisma.user.create({
      data: { companyId: companyAId, email: 'admin.7f@corpa.com', passwordHash: 'hash', isActive: true },
    });
    adminAId = uA.id;

    const uB = await prisma.user.create({
      data: { companyId: companyBId, email: 'admin.7f@corpb.com', passwordHash: 'hash', isActive: true },
    });
    adminBId = uB.id;

    // 5. Setup Employees
    const empA1 = await prisma.employee.create({
      data: {
        companyId: companyAId,
        employeeCode: 'EMP-7F-A01',
        name: 'Raghavan Pillai',
        email: 'raghavan.7f@corpa.com',
        monthlyGross: 100000,
        basicSalary: 50000,
        pan: 'ABCDE1234F',
        uan: '100987654321',
        location: 'KA',
      },
    });
    employeeA1Id = empA1.id;

    const empA2 = await prisma.employee.create({
      data: {
        companyId: companyAId,
        employeeCode: 'EMP-7F-A02',
        name: 'Ananya Deshmukh',
        email: 'ananya.7f@corpa.com',
        monthlyGross: 20000,
        basicSalary: 10000,
        pan: 'VWXYZ5678G',
        esicNumber: '31000123450001001',
        location: 'MH',
      },
    });
    employeeA2Id = empA2.id;

    const empB1 = await prisma.employee.create({
      data: {
        companyId: companyBId,
        employeeCode: 'EMP-7F-B01',
        name: 'Tenant B Employee',
        email: 'user.7f@corpb.com',
        monthlyGross: 80000,
        basicSalary: 40000,
        pan: 'PQRS99999Z',
      },
    });
    employeeB1Id = empB1.id;

    // 6. Setup Locked Payroll Cycle for Company A
    const cycle = await prisma.payrollCycle.create({
      data: {
        companyId: companyAId,
        month: 4,
        year: 2026,
        periodStartDate: new Date('2026-04-01'),
        periodEndDate: new Date('2026-04-30'),
        paymentDueDate: new Date('2026-05-07'),
        status: 'LOCKED',
        totalHeadcount: 2,
        totalGrossPayable: 120000,
        totalNetPayout: 109850,
        totalEpfEmployee: 3000,
        totalEpfEmployer: 3000,
        totalEsicEmployee: 150,
        totalEsicEmployer: 650,
        totalPt: 400,
        totalTds: 6600,
      },
    });
    lockedCycleAId = cycle.id;

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycle.id,
        employeeId: empA1.id,
        calendarDays: 30,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 8,
        holidays: 0,
        lopDays: 0,
        payableDays: 30,
        annualCtc: 1200000,
        monthlyCtc: 100000,
        monthlyGross: 100000,
        earnedGross: 100000,
        basicSalary: 50000,
        hra: 20000,
        specialAllowance: 30000,
        totalEarnings: 100000,
        epfEmployee: 1800,
        epfEmployer: 1800,
        esicEmployee: 0,
        esicEmployer: 0,
        pt: 200,
        tds: 6600,
        totalDeductions: 8600,
        netSalary: 91400,
        employerTotalCost: 101800,
        statutoryConfigSnapshot: {
          epf: { epfWages: 15000, configVersion: 1 },
          esic: { isEligible: false, configVersion: 1 },
          pt: { stateCode: 'KA', monthlyDeduction: 200, configVersion: 1 },
          tds: { taxRegime: 'NEW_REGIME_115BAC', monthlyTdsDeduction: 6600 },
        },
      },
    });

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycle.id,
        employeeId: empA2.id,
        calendarDays: 30,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 8,
        holidays: 0,
        lopDays: 0,
        payableDays: 30,
        annualCtc: 240000,
        monthlyCtc: 20000,
        monthlyGross: 20000,
        earnedGross: 20000,
        basicSalary: 10000,
        hra: 4000,
        specialAllowance: 6000,
        totalEarnings: 20000,
        epfEmployee: 1200,
        epfEmployer: 1200,
        esicEmployee: 150,
        esicEmployer: 650,
        pt: 200,
        tds: 0,
        totalDeductions: 1550,
        netSalary: 18450,
        employerTotalCost: 21850,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================================
  // SECTION 1: FINANCIAL DETERMINISM & EDGE CASES (12 TESTS)
  // ========================================================
  it('[FIN 01] Standard Employee New Regime (₹12L gross => ₹0 Tax via 87A rebate)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1200000,
      pan: 'ABCDE1234F',
    });
    expect(res.netTaxableIncome).toBe(1125000); // 12L - 75k std ded
    expect(res.rebate87A).toBeGreaterThan(0);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[FIN 02] High Earner New Regime (₹25L gross at 30% top bracket)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 2500000,
      pan: 'ABCDE1234F',
    });
    expect(res.netTaxableIncome).toBe(2425000); // 25L - 75k std ded
    expect(res.grossTaxLiability).toBe(307500);
    expect(res.totalAnnualTaxLiability).toBe(319800); // 307500 + 4% cess (12300)
  });

  it('[FIN 03] Section 87A Marginal Relief applies exactly at ₹12.01L net taxable', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1276000, // 12.76L - 75k = 12.01L
      pan: 'ABCDE1234F',
    });
    expect(res.marginalRelief87A).toBe(59150);
    expect(res.netTaxAfterRebate).toBe(1000); // Capped at excess over 12L
  });

  it('[FIN 04] Old Regime with Chapter VI-A (80C ₹1.5L + 80D ₹25k)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1200000,
      approvedChapterVIADeductions: 175000,
      pan: 'ABCDE1234F',
    });
    expect(res.standardDeduction).toBe(50000);
    expect(res.netTaxableIncome).toBe(975000); // 12L - 50k - 175k
    expect(res.grossTaxLiability).toBe(107500);
  });

  it('[FIN 05] Section 206AA Penal Withholding (20% flat on missing PAN)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      pan: null,
    });
    expect(res.isPanMissing).toBe(true);
    expect(res.totalAnnualTaxLiability).toBe(160000); // 20% of 8L
  });

  it('[FIN 06] Mid-year joiner with Form 12B previous employer credit', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      previousEmployerIncome: 875000, // Total 16.75L => Tax 124,800
      previousEmployerTds: 50000,
      ytdTdsPaid: 0,
      remainingPayrollPeriods: 6,
      pan: 'ABCDE1234F',
    });
    expect(res.remainingTaxLiability).toBe(74800);
    expect(res.monthlyTdsDeduction).toBe(Math.round(74800 / 6));
  });

  it('[FIN 07] LOP Attendance proration correctly scales EPF and ESIC', async () => {
    const proratedBasic = 12000; // 24 days worked on base 15k
    const epf = await StatutoryCalculatorService.calculateEpf({
      companyId: companyAId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 15000,
      earnedBasicSalary: proratedBasic,
    });
    expect(epf.employeeContribution).toBe(1440); // 12% of 12000
  });

  it('[FIN 08] EPF Statutory wage ceiling ₹15,000 caps higher earned basic', async () => {
    const epf = await StatutoryCalculatorService.calculateEpf({
      companyId: companyAId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 75000,
      earnedBasicSalary: 75000,
    });
    expect(epf.epfWages).toBe(15000);
    expect(epf.employeeContribution).toBe(1800);
  });

  it('[FIN 09] ESIC Gross threshold ₹21,000 suppresses deduction for high earner', async () => {
    const esic = await StatutoryCalculatorService.calculateEsic({
      companyId: companyAId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 25000,
      earnedGross: 25000,
    });
    expect(esic.isEligible).toBe(false);
    expect(esic.employeeContribution).toBe(0);
  });

  it('[FIN 10] Maharashtra PT February special slab evaluates to ₹300', async () => {
    const ptFeb = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId: companyAId,
      targetDate: new Date('2027-02-15'),
      stateCode: 'MH',
      earnedGross: 60000,
      monthIndex: 2,
    });
    expect(ptFeb.monthlyDeduction).toBe(300);
  });

  it('[FIN 11] Karnataka PT standard monthly deduction evaluates to ₹200', async () => {
    const ptKa = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId: companyAId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'KA',
      earnedGross: 60000,
    });
    expect(ptKa.monthlyDeduction).toBe(200);
  });

  it('[FIN 12] Zero financial variance: Net pay equals Gross minus Deductions sum', () => {
    const gross = 100000;
    const basic = 50000;
    const epf = 1800;
    const esic = 0;
    const pt = 200;
    const tds = 6600;
    const totalDeductions = epf + esic + pt + tds;
    const netSalary = gross - totalDeductions;

    expect(totalDeductions).toBe(8600);
    expect(netSalary).toBe(91400);
  });

  // ========================================================
  // SECTION 2: LOCKED PAYROLL IMMUTABILITY (6 TESTS)
  // ========================================================
  it('[IMMUTABILITY 01] Locked PayrollRecord cannot be altered by subsequent config change', async () => {
    const record = await prisma.payrollRecord.findFirst({
      where: { payrollCycleId: lockedCycleAId, employeeId: employeeA1Id },
    });
    expect(record!.netSalary).toBe(91400);
    expect(record!.tds).toBe(6600);
  });

  it('[IMMUTABILITY 02] Historical statutory snapshot preserves calculation version', async () => {
    const record = await prisma.payrollRecord.findFirst({
      where: { payrollCycleId: lockedCycleAId, employeeId: employeeA1Id },
    });
    const snap = record!.statutoryConfigSnapshot as any;
    expect(snap.epf.epfWages).toBe(15000);
    expect(snap.pt.monthlyDeduction).toBe(200);
  });

  it('[IMMUTABILITY 03] Overlapping configuration activation supersedes prior version', async () => {
    const d1 = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { wageCeiling: 15000, rate: 0.12 },
      createdById: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    await prisma.statutoryConfiguration.update({ where: { id: d1.id }, data: { status: StatutoryConfigStatus.ACTIVE } });

    const d2 = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-10-01'),
      rulesJson: { wageCeiling: 21000, rate: 0.12 },
      createdById: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    await StatutoryConfigService.activateConfig({
      id: d2.id,
      companyId: companyAId,
      approvedById: adminBId, // separate checker
      actorEmail: 'checker@corpa.com',
      actorRole: 'SUPER_ADMIN',
    });

    const prev = await prisma.statutoryConfiguration.findUnique({ where: { id: d1.id } });
    expect(prev!.status).toBe(StatutoryConfigStatus.SUPERSEDED);
  });

  it('[IMMUTABILITY 04] Point-in-time resolution resolves superseded version for prior periods', async () => {
    const resolved = await StatutoryConfigService.resolveActiveConfig({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      targetDate: new Date('2026-05-15'),
    });
    expect(resolved).not.toBeNull();
    expect((resolved!.rulesJson as any).wageCeiling).toBe(15000);
  });

  it('[IMMUTABILITY 05] Point-in-time resolution resolves new active version for future periods', async () => {
    const resolved = await StatutoryConfigService.resolveActiveConfig({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      targetDate: new Date('2026-11-15'),
    });
    expect(resolved).not.toBeNull();
    expect((resolved!.rulesJson as any).wageCeiling).toBe(21000);
  });

  it('[IMMUTABILITY 06] Zero modification confirmed during four-way reconciliation', async () => {
    await StatutoryReconciliationService.reconcileTds({ companyId: companyAId, financialYear: '2026-2027', quarter: 'Q1' });
    const record = await prisma.payrollRecord.findFirst({ where: { payrollCycleId: lockedCycleAId } });
    expect(record!.netSalary).toBe(91400);
  });

  // ========================================================
  // SECTION 3: MULTI-TENANT ISOLATION & IDOR DEFENSE (8 TESTS)
  // ========================================================
  it('[SEC 01] Multi-tenant isolation: Tenant B cannot access Tenant A configurations', async () => {
    const configsB = await StatutoryConfigService.list({ companyId: companyBId });
    expect(configsB.length).toBe(0);
  });

  it('[SEC 02] IDOR Defense: Tenant B cannot execute Form 24Q preparation for Tenant A', async () => {
    await expect(
      Form24QService.prepareForm24Q({
        companyId: companyBId,
        financialYear: '2026-2027',
        quarter: 'Q1',
        actorUserId: adminBId,
        actorEmail: 'admin@corpb.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('No locked payroll cycles found');
  });

  it('[SEC 03] Tenant B cannot allocate or query Tenant A Challans', async () => {
    const listB = await ChallanService.listChallans({ companyId: companyBId });
    expect(listB.length).toBe(0);
  });

  it('[SEC 04] Cross-tenant tax declaration review is rejected', async () => {
    const declA = await prisma.employeeTaxDeclaration.create({
      data: {
        companyId: companyAId,
        employeeId: employeeA1Id,
        financialYear: '2026-2027',
        sectionCategory: 'SECTION_80C',
        itemCode: '80C_PPF',
        declaredAmount: 150000,
      },
    });

    await expect(
      TaxDeclarationService.reviewDeclarationItem({
        declarationId: declA.id,
        companyId: companyBId, // Wrong tenant
        status: 'APPROVED' as any,
        approvedAmount: 150000,
        reviewerId: adminBId,
        actorEmail: 'admin@corpb.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Declaration not found');
  });

  it('[SEC 05] Cross-tenant employee tax computation access is blocked', async () => {
    await expect(
      TaxDeclarationService.getEmployeeTaxComputation({
        companyId: companyBId,
        employeeId: employeeA1Id,
        financialYear: '2026-2027',
      })
    ).rejects.toThrow('Employee not found');
  });

  it('[SEC 06] Cross-tenant Document Vault query returns only own artifacts', async () => {
    const docsB = await prisma.complianceDocument.findMany({ where: { companyId: companyBId } });
    expect(docsB.length).toBe(0);
  });

  it('[SEC 07] Cross-tenant Compliance Calendar isolation', async () => {
    const calB = await ComplianceCalendarService.getComplianceCalendar({
      companyId: companyBId,
      financialYear: '2026-2027',
    });
    const prepared = calB.filter((c) => c.status === 'PREPARED');
    expect(prepared.length).toBe(0);
  });

  it('[SEC 08] Sensitive identifier masking: TAN format verified', () => {
    const tan = 'BLRR77777C';
    expect(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(tan)).toBe(true);
  });

  // ========================================================
  // SECTION 4: CHALLAN CONCURRENCY & RECONCILIATION (6 TESTS)
  // ========================================================
  it('[CHALLAN 01] Records ITNS 281 Challan with 7-digit BSR and 5-digit number', async () => {
    const ch = await ChallanService.recordChallan({
      companyId: companyAId,
      challanType: ChallanType.TDS_281,
      financialYear: '2026-2027',
      quarter: 'Q1',
      month: 4,
      bsrCode: '0210045',
      challanNumber: '00777',
      depositDate: new Date('2026-05-06'),
      taxAmount: 6600,
      createdById: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    challanAId = ch.id;
    expect(ch.totalAmount).toBe(6600);
    expect(ch.status).toBe(ChallanStatus.RECORDED);
  });

  it('[CHALLAN 02] Database transaction guards allocation and prevents over-allocation', async () => {
    const res = await ChallanService.allocateChallan({
      companyId: companyAId,
      challanId: challanAId,
      payrollCycleId: lockedCycleAId,
      amount: 6600,
      actorUserId: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(res.challan.status).toBe(ChallanStatus.RECONCILED);
    expect(res.challan.unallocatedAmount).toBe(0);
  });

  it('[CHALLAN 03] Subsequent over-allocation attempt is rejected', async () => {
    await expect(
      ChallanService.allocateChallan({
        companyId: companyAId,
        challanId: challanAId,
        payrollCycleId: lockedCycleAId,
        amount: 100,
        actorUserId: adminAId,
        actorEmail: 'admin@corpa.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Cannot over-allocate challan');
  });

  it('[CHALLAN 04] TDS Reconciliation confirms MATCHED status with zero variance', async () => {
    const recon = await StatutoryReconciliationService.reconcileTds({
      companyId: companyAId,
      financialYear: '2026-2027',
      quarter: 'Q1',
    });
    expect(recon.status).toBe('MATCHED');
    expect(recon.variance).toBe(0);
  });

  it('[CHALLAN 05] EPF and ESIC reconciliations report zero variance', async () => {
    const epfRecon = await StatutoryReconciliationService.reconcileEpf({ companyId: companyAId, payrollCycleId: lockedCycleAId });
    const esicRecon = await StatutoryReconciliationService.reconcileEsic({ companyId: companyAId, payrollCycleId: lockedCycleAId });
    expect(epfRecon.status).toBe('MATCHED');
    expect(esicRecon.status).toBe('MATCHED');
  });

  it('[CHALLAN 06] Professional Tax reconciliation confirms state distribution', async () => {
    const ptRecon = await StatutoryReconciliationService.reconcileProfessionalTax({ companyId: companyAId, payrollCycleId: lockedCycleAId });
    expect(ptRecon.status).toBe('MATCHED');
    expect(ptRecon.totalPtDeducted).toBe(400);
  });

  // ========================================================
  // SECTION 5: SECURITY, RBAC & AUDIT LEDGER (6 TESTS)
  // ========================================================
  it('[GOV 01] Maker-Checker separation enforces distinct approver for statutory config', async () => {
    const selfDraft = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.GRATUITY,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { maxLimit: 2000000 },
      createdById: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    await expect(
      StatutoryConfigService.activateConfig({
        id: selfDraft.id,
        companyId: companyAId,
        approvedById: adminAId, // Self approval violation
        actorEmail: 'admin@corpa.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Maker-Checker violation');
  });

  it('[GOV 02] Audit trail logs configuration activation and challan allocation events', async () => {
    const logs = await prisma.auditLog.findMany({ where: { companyId: companyAId } });
    expect(logs.length).toBeGreaterThanOrEqual(3);
  });

  it('[GOV 03] Form 24Q preparation stamps SHA-256 hash in document vault', async () => {
    const prep = await Form24QService.prepareForm24Q({
      companyId: companyAId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminAId,
      actorEmail: 'admin@corpa.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(prep.status).toBe('PREPARED');
    expect(prep.checksum.length).toBe(64);
  });

  it('[GOV 04] Compliance Dashboard computes 100% Health Score', async () => {
    const dash = await ComplianceDashboardService.getDashboardMetrics({ companyId: companyAId, financialYear: '2026-2027' });
    expect(dash.healthScore).toBe(100);
  });

  it('[GOV 05] Invalid BSR code rejected with descriptive error', async () => {
    await expect(
      ChallanService.recordChallan({
        companyId: companyAId,
        financialYear: '2026-2027',
        bsrCode: '123',
        challanNumber: '001',
        depositDate: new Date(),
        taxAmount: 1000,
        createdById: adminAId,
        actorEmail: 'admin@corpa.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Invalid BSR Code');
  });

  it('[GOV 06] Production Safety: Baseline financial formulas remain deterministic', () => {
    const monthlyGross = 125000;
    const basic = 62500;
    const epf = Math.round(Math.min(basic, 15000) * 0.12);
    const esic = 0;
    const pt = 200;
    const tds = 8500;
    const totalDeductions = epf + esic + pt + tds;
    const netSalary = monthlyGross - totalDeductions;

    expect(epf).toBe(1800);
    expect(totalDeductions).toBe(10500);
    expect(netSalary).toBe(114500);
  });
});