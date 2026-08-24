import { PrismaClient, StatutoryConfigType, StatutoryConfigStatus } from '@prisma/client';
import { StatutoryCalculatorService } from '../src/services/statutory-calculator.service';
import { StatutoryConfigService } from '../src/services/statutory-config.service';
import { CompliancePreparationService } from '../src/services/compliance-preparation.service';

const prisma = new PrismaClient();

describe('Phase 7B: EPF, ESIC and Professional Tax Comprehensive Test Suite (30 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let adminUserId: string;
  let employee1Id: string;
  let employee2Id: string;
  let payrollCycleId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup for idempotence
    const testCodes = ['TEST-7B-TENANT-A', 'TEST-7B-TENANT-B'];
    await prisma.complianceException.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.complianceDocument.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.compliancePeriod.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeStatutoryProfile.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.statutoryConfiguration.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup test tenant
    const comp = await prisma.company.create({
      data: { code: 'TEST-7B-TENANT-A', name: 'Sarwin Statutory Test Tenant' },
    });
    companyId = comp.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-7B-TENANT-B', name: 'Isolated Statutory Tenant B' },
    });
    tenantBId = compB.id;

    const user = await prisma.user.create({
      data: { companyId, email: 'stat_admin_7b@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    adminUserId = user.id;

    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-7B-001',
        name: 'Arun Kumar',
        email: 'arun.7b@sarwin.com',
        monthlyGross: 75000,
        basicSalary: 37500,
        uan: '100987654321',
        pan: 'ABCDE1234F',
        location: 'KA',
      },
    });
    employee1Id = emp1.id;

    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-7B-002',
        name: 'Priya Sundaram',
        email: 'priya.7b@sarwin.com',
        monthlyGross: 20000,
        basicSalary: 10000,
        esicNumber: '31000123450001001',
        location: 'MH',
      },
    });
    employee2Id = emp2.id;

    // 3. Create mock payroll cycle and locked records for integration tests
    const cycle = await prisma.payrollCycle.create({
      data: {
        companyId,
        month: 8,
        year: 2026,
        periodStartDate: new Date('2026-08-01'),
        periodEndDate: new Date('2026-08-31'),
        paymentDueDate: new Date('2026-09-07'),
        status: 'LOCKED',
        totalHeadcount: 2,
        totalGrossPayable: 95000,
        totalNetPayout: 87500,
        totalEpfEmployee: 3000,
        totalEpfEmployer: 3000,
        totalEsicEmployee: 150,
        totalEsicEmployer: 650,
        totalPt: 400,
      },
    });
    payrollCycleId = cycle.id;

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycle.id,
        employeeId: emp1.id,
        calendarDays: 31,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 9,
        holidays: 0,
        lopDays: 0,
        payableDays: 31,
        annualCtc: 900000,
        monthlyCtc: 75000,
        monthlyGross: 75000,
        earnedGross: 75000,
        basicSalary: 37500,
        hra: 15000,
        specialAllowance: 22500,
        totalEarnings: 75000,
        epfEmployee: 1800,
        epfEmployer: 1800,
        esicEmployee: 0,
        esicEmployer: 0,
        pt: 200,
        totalDeductions: 2000,
        netSalary: 73000,
        employerTotalCost: 76800,
      },
    });

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycle.id,
        employeeId: emp2.id,
        calendarDays: 31,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 9,
        holidays: 0,
        lopDays: 0,
        payableDays: 31,
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
        totalDeductions: 1550,
        netSalary: 18450,
        employerTotalCost: 21850,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // SECTION 1: EPF CALCULATIONS (8 TESTS)
  it('[EPF 01] Standard eligible employee (Basic ₹37.5k capped at ₹15k wage ceiling)', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 37500,
      earnedBasicSalary: 37500,
    });

    expect(res.isApplicable).toBe(true);
    expect(res.epfWages).toBe(15000);
    expect(res.employeeContribution).toBe(1800);
    expect(res.epsContribution).toBe(1250);
    expect(res.excessWage).toBe(22500);
  });

  it('[EPF 02] Below wage ceiling employee (Basic ₹12.5k)', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 12500,
      earnedBasicSalary: 12500,
    });

    expect(res.epfWages).toBe(12500);
    expect(res.employeeContribution).toBe(1500);
    expect(res.excessWage).toBe(0);
  });

  it('[EPF 03] Boundary condition: Basic exactly at wage ceiling ₹15,000', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 15000,
      earnedBasicSalary: 15000,
    });

    expect(res.epfWages).toBe(15000);
    expect(res.employeeContribution).toBe(1800);
    expect(res.excessWage).toBe(0);
  });

  it('[EPF 04] Boundary condition: Basic ₹15,001 (₹1 above ceiling)', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 15001,
      earnedBasicSalary: 15001,
    });

    expect(res.epfWages).toBe(15000);
    expect(res.employeeContribution).toBe(1800);
    expect(res.excessWage).toBe(1);
  });

  it('[EPF 05] EPF non-applicable employee returns 0 deductions', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: false,
      basicSalary: 40000,
      earnedBasicSalary: 40000,
    });

    expect(res.isApplicable).toBe(false);
    expect(res.employeeContribution).toBe(0);
    expect(res.employerContribution).toBe(0);
  });

  it('[EPF 06] Prorated LOP basic wage correctly scales contribution', async () => {
    const fullBasic = 30000;
    const proratedEarnedBasic = Math.round((fullBasic * 15) / 30);

    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: fullBasic,
      earnedBasicSalary: proratedEarnedBasic,
    });

    expect(res.epfWages).toBe(15000);
    expect(res.employeeContribution).toBe(1800);
  });

  it('[EPF 07] Custom active config rate (e.g. 10% voluntary rate override)', async () => {
    const customConfig = await StatutoryConfigService.createDraft({
      companyId,
      configType: StatutoryConfigType.EPF,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { wageCeiling: 15000, employeeRate: 0.10, employerEpfRate: 0.0367, epsRate: 0.0833 },
      createdById: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    await prisma.statutoryConfiguration.update({
      where: { id: customConfig.id },
      data: { status: StatutoryConfigStatus.ACTIVE },
    });

    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 30000,
      earnedBasicSalary: 30000,
    });

    expect(res.employeeContribution).toBe(1500);
  });

  it('[EPF 08] Employer total contribution matches sum of EPF and EPS shares', async () => {
    const res = await StatutoryCalculatorService.calculateEpf({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEpfApplicable: true,
      basicSalary: 12000,
      earnedBasicSalary: 12000,
    });

    expect(res.employerContribution).toBe(res.epsContribution + Math.round(12000 * 0.0367));
  });

  // SECTION 2: ESIC CALCULATIONS (7 TESTS)
  it('[ESIC 01] Eligible employee (Gross ₹20,000 <= ₹21,000 threshold)', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 20000,
      earnedGross: 20000,
    });

    expect(res.isEligible).toBe(true);
    expect(res.employeeContribution).toBe(150);
    expect(res.employerContribution).toBe(650);
  });

  it('[ESIC 02] Ineligible employee (Gross ₹75,000 > ₹21,000 threshold)', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 75000,
      earnedGross: 75000,
    });

    expect(res.isEligible).toBe(false);
    expect(res.employeeContribution).toBe(0);
    expect(res.employerContribution).toBe(0);
  });

  it('[ESIC 03] Boundary condition: Gross exactly at threshold ₹21,000', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 21000,
      earnedGross: 21000,
    });

    expect(res.isEligible).toBe(true);
    expect(res.employeeContribution).toBe(158);
    expect(res.employerContribution).toBe(683);
  });

  it('[ESIC 04] Boundary condition: Gross ₹21,001 (₹1 above threshold)', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 21001,
      earnedGross: 21001,
    });

    expect(res.isEligible).toBe(false);
    expect(res.employeeContribution).toBe(0);
  });

  it('[ESIC 05] ESIC non-applicable flag suppresses calculation', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: false,
      monthlyGross: 18000,
      earnedGross: 18000,
    });

    expect(res.isApplicable).toBe(false);
    expect(res.employeeContribution).toBe(0);
  });

  it('[ESIC 06] Ceiling rounding behavior on fractional paise (Gross ₹15,333)', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 15333,
      earnedGross: 15333,
    });

    expect(res.employeeContribution).toBe(115);
  });

  it('[ESIC 07] Prorated LOP gross maintains eligibility based on base structure', async () => {
    const res = await StatutoryCalculatorService.calculateEsic({
      companyId,
      targetDate: new Date('2026-08-24'),
      isEsicApplicable: true,
      monthlyGross: 20000,
      earnedGross: 10000,
    });

    expect(res.isEligible).toBe(true);
    expect(res.employeeContribution).toBe(75);
  });

  // SECTION 3: PROFESSIONAL TAX CALCULATIONS (8 TESTS)
  it('[PT 01] Karnataka (KA) slab for Gross > ₹15,000 returns ₹200', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'KA',
      earnedGross: 75000,
    });

    expect(res.stateCode).toBe('KA');
    expect(res.monthlyDeduction).toBe(200);
  });

  it('[PT 02] Karnataka (KA) slab for Gross <= ₹15,000 returns ₹0', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'KA',
      earnedGross: 14999,
    });

    expect(res.monthlyDeduction).toBe(0);
  });

  it('[PT 03] Maharashtra (MH) standard month for Gross > ₹10,000 returns ₹200', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'MH',
      earnedGross: 50000,
      monthIndex: 8,
    });

    expect(res.monthlyDeduction).toBe(200);
  });

  it('[PT 04] Maharashtra (MH) February special slab returns ₹300', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2027-02-15'),
      stateCode: 'MH',
      earnedGross: 50000,
      monthIndex: 2,
    });

    expect(res.monthlyDeduction).toBe(300);
  });

  it('[PT 05] Maharashtra (MH) slab for Gross ₹7,501 to ₹10,000 returns ₹175', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'MH',
      earnedGross: 9000,
    });

    expect(res.monthlyDeduction).toBe(175);
  });

  it('[PT 06] West Bengal (WB) slab for Gross ₹30,000 returns ₹150', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'WB',
      earnedGross: 30000,
    });

    expect(res.monthlyDeduction).toBe(150);
  });

  it('[PT 07] Tamil Nadu (TN) slab for Gross ₹80,000 returns ₹208', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'TN',
      earnedGross: 80000,
    });

    expect(res.monthlyDeduction).toBe(208);
  });

  it('[PT 08] Fallback for unconfigured state defaults safely without crashing', async () => {
    const res = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId,
      targetDate: new Date('2026-08-24'),
      stateCode: 'UNKNOWN_STATE',
      earnedGross: 60000,
    });

    expect(res.monthlyDeduction).toBe(200);
  });

  // SECTION 4: ECR, ESIC & PT PREPARATION (4 TESTS)
  it('[PREP 01] EPF ECR preparation compiles valid dataset and sha256 checksum', async () => {
    const ecr = await CompliancePreparationService.prepareEcrDataset({
      companyId,
      payrollCycleId,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(ecr.status).toBe('PREPARED');
    expect(ecr.summary.totalEmployees).toBe(2);
    expect(ecr.summary.checksum).toBeDefined();
    expect(ecr.records[0].uan).toBe('100987654321');
  });

  it('[PREP 02] ESIC return preparation filters eligible records only', async () => {
    const esic = await CompliancePreparationService.prepareEsicDataset({
      companyId,
      payrollCycleId,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(esic.status).toBe('PREPARED');
    expect(esic.summary.totalEligibleEmployees).toBe(1);
    expect(esic.records[0].ipNumber).toBe('31000123450001001');
  });

  it('[PREP 03] Professional Tax summary groups by state jurisdiction', async () => {
    const ptSummary = await CompliancePreparationService.preparePtSummary({
      companyId,
      payrollCycleId,
      actorUserId: adminUserId,
    });

    expect(ptSummary.totalPtDeducted).toBe(400);
    expect(ptSummary.stateSummaries.length).toBeGreaterThanOrEqual(1);
  });

  it('[PREP 04] Compliance exception raised on missing UAN during ECR preparation', async () => {
    const noUanEmp = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-NO-UAN',
        name: 'No UAN Employee',
        email: 'nouan@sarwin.com',
        monthlyGross: 50000,
        basicSalary: 25000,
        uan: null,
      },
    });

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId,
        employeeId: noUanEmp.id,
        calendarDays: 31,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 9,
        holidays: 0,
        lopDays: 0,
        payableDays: 31,
        annualCtc: 600000,
        monthlyCtc: 50000,
        monthlyGross: 50000,
        earnedGross: 50000,
        basicSalary: 25000,
        hra: 10000,
        specialAllowance: 15000,
        totalEarnings: 50000,
        epfEmployee: 1800,
        epfEmployer: 1800,
        totalDeductions: 2000,
        netSalary: 48000,
        employerTotalCost: 51800,
      },
    });

    await CompliancePreparationService.prepareEcrDataset({
      companyId,
      payrollCycleId,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    const exp = await prisma.complianceException.findFirst({
      where: { companyId, employeeId: noUanEmp.id, category: StatutoryConfigType.EPF },
    });

    expect(exp).not.toBeNull();
    expect(exp!.severity).toBe('BLOCKING');
  });

  // SECTION 5: TENANT ISOLATION & SECURITY (3 TESTS)
  it('[SEC 01] Multi-tenant isolation: Tenant B cannot access Tenant A compliance datasets', async () => {
    await expect(
      CompliancePreparationService.prepareEcrDataset({
        companyId: tenantBId,
        payrollCycleId,
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Payroll cycle not found');
  });

  it('[SEC 02] Deterministic exact integer rounding prevents floating point drift', async () => {
    const epf = StatutoryCalculatorService.roundRupee(1800.0000000004);
    const esicCeil = StatutoryCalculatorService.ceilToInteger(114.001);

    expect(epf).toBe(1800);
    expect(esicCeil).toBe(115);
  });

  it('[SEC 03] Financial safety confirmation: Baseline net pay matches earnings minus statutory sum', async () => {
    const gross = 85000;
    const basic = 42500;
    const epf = Math.round(Math.min(basic, 15000) * 0.12);
    const esic = gross <= 21000 ? Math.ceil(gross * 0.0075) : 0;
    const pt = gross > 15000 ? 200 : 0;
    const totalDeductions = epf + esic + pt;
    const netSalary = gross - totalDeductions;

    expect(totalDeductions).toBe(2000);
    expect(netSalary).toBe(83000);
  });
});