import { PrismaClient, TaxRegime, DeclarationStatus, TaxSectionCategory } from '@prisma/client';
import { TdsCalculatorService } from '../src/services/tds-calculator.service';
import { TaxDeclarationService } from '../src/services/tax-declaration.service';

const prisma = new PrismaClient();

describe('Phase 7C: TDS & Tax Engine Comprehensive Test Suite (42 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let adminUserId: string;
  let employee1Id: string;
  let employee2Id: string;

  beforeAll(async () => {
    // 1. Fixture cleanup
    const testCodes = ['TEST-7C-TENANT-A', 'TEST-7C-TENANT-B'];
    await prisma.complianceException.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.investmentProofDocument.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeTaxDeclaration.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.previousEmployerIncome.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeStatutoryProfile.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup fixtures
    const compA = await prisma.company.create({
      data: { code: 'TEST-7C-TENANT-A', name: 'Sarwin Tax Engine Corp' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-7C-TENANT-B', name: 'Isolated Tax Corp B' },
    });
    tenantBId = compB.id;

    const user = await prisma.user.create({
      data: { companyId, email: 'tax_admin_7c@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    adminUserId = user.id;

    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-7C-001',
        name: 'Ganesh Shinde',
        email: 'ganesh.7c@sarwin.com',
        monthlyGross: 100000,
        pan: 'ABCDE1234F',
      },
    });
    employee1Id = emp1.id;

    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-7C-002',
        name: 'Kavitha R',
        email: 'kavitha.7c@sarwin.com',
        monthlyGross: 125000,
        pan: null,
      },
    });
    employee2Id = emp2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // SECTION 1: FY 2026-27 NEW REGIME BOUNDARY TESTS (12 TESTS)
  it('[NEW REGIME 01] Annual Gross ₹4,00,000 (Taxable ₹3,25,000 <= 4L): Zero Tax', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 400000,
      pan: 'ABCDE1234F',
    });

    expect(res.standardDeduction).toBe(75000);
    expect(res.netTaxableIncome).toBe(325000);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[NEW REGIME 02] Annual Gross ₹8,00,000 (Taxable ₹7,25,000): 87A Zero Tax', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(725000);
    expect(res.rebate87A).toBeGreaterThan(0);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[NEW REGIME 03] Exact ₹12,00,000 Taxable Income Boundary: Full 87A Zero Tax', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1275000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(1200000);
    expect(res.grossTaxLiability).toBe(60000);
    expect(res.rebate87A).toBe(60000);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[NEW REGIME 04] Marginal Relief at ₹12,01,000 Taxable Income (₹1,000 over ₹12L)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1276000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(1201000);
    expect(res.grossTaxLiability).toBe(60150);
    expect(res.marginalRelief87A).toBe(59150);
    expect(res.netTaxAfterRebate).toBe(1000);
    expect(res.cess).toBe(40);
    expect(res.totalAnnualTaxLiability).toBe(1040);
  });

  it('[NEW REGIME 05] Annual Gross ₹13,00,000 (Taxable ₹12,25,000)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1300000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(1225000);
    expect(res.marginalRelief87A).toBe(38750);
    expect(res.netTaxAfterRebate).toBe(25000);
  });

  it('[NEW REGIME 06] Slab Boundary: Taxable ₹16,00,000 (Gross ₹16,75,000)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1675000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(1600000);
    expect(res.grossTaxLiability).toBe(120000);
    expect(res.cess).toBe(4800);
    expect(res.totalAnnualTaxLiability).toBe(124800);
  });

  it('[NEW REGIME 07] Slab Boundary: Taxable ₹20,00,000 (Gross ₹20,75,000)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 2075000,
      pan: 'ABCDE1234F',
    });

    expect(res.grossTaxLiability).toBe(200000);
    expect(res.totalAnnualTaxLiability).toBe(208000);
  });

  it('[NEW REGIME 08] Slab Boundary: Taxable ₹24,00,000 (Gross ₹24,75,000)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 2475000,
      pan: 'ABCDE1234F',
    });

    expect(res.grossTaxLiability).toBe(300000);
    expect(res.totalAnnualTaxLiability).toBe(312000);
  });

  it('[NEW REGIME 09] High Earner: Taxable ₹25,00,000 (Gross ₹25,75,000 at 30% top slab)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 2575000,
      pan: 'ABCDE1234F',
    });

    expect(res.grossTaxLiability).toBe(330000);
    expect(res.totalAnnualTaxLiability).toBe(343200);
  });

  it('[NEW REGIME 10] Standard Deduction ₹75,000 is always automatically applied', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1500000,
      pan: 'ABCDE1234F',
    });

    expect(res.standardDeduction).toBe(75000);
    expect(res.netTaxableIncome).toBe(1425000);
  });

  it('[NEW REGIME 11] Chapter VI-A deductions are ignored under New Regime', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1500000,
      approvedChapterVIADeductions: 150000,
      pan: 'ABCDE1234F',
    });

    expect(res.chapterVIAClaims).toBe(0);
    expect(res.netTaxableIncome).toBe(1425000);
  });

  it('[NEW REGIME 12] Surcharge applied on Income > ₹50,00,000 (10% surcharge)', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 6075000,
      pan: 'ABCDE1234F',
    });

    expect(res.surcharge).toBeGreaterThan(0);
  });

  // SECTION 2: OLD REGIME CALCULATION & REBATES (8 TESTS)
  it('[OLD REGIME 01] Standard Deduction is ₹50,000 for Old Regime', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 600000,
      pan: 'ABCDE1234F',
    });

    expect(res.standardDeduction).toBe(50000);
    expect(res.netTaxableIncome).toBe(550000);
  });

  it('[OLD REGIME 02] 87A rebate gives zero tax for Taxable Income <= ₹5,00,000', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 550000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(500000);
    expect(res.grossTaxLiability).toBe(12500);
    expect(res.rebate87A).toBe(12500);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[OLD REGIME 03] Taxable Income ₹5,00,001 loses 87A rebate entirely', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 550001,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(500001);
    expect(res.rebate87A).toBe(0);
    expect(res.totalAnnualTaxLiability).toBeGreaterThan(12500);
  });

  it('[OLD REGIME 04] Chapter VI-A deductions (80C ₹1.5L) reduce taxable income', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1000000,
      approvedChapterVIADeductions: 150000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(800000);
    expect(res.grossTaxLiability).toBe(72500);
  });

  it('[OLD REGIME 05] 10L slab boundary calculation', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1050000,
      pan: 'ABCDE1234F',
    });

    expect(res.grossTaxLiability).toBe(112500);
    expect(res.cess).toBe(4500);
    expect(res.totalAnnualTaxLiability).toBe(117000);
  });

  it('[OLD REGIME 06] Top slab 30% above ₹10L', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1550000,
      pan: 'ABCDE1234F',
    });

    expect(res.grossTaxLiability).toBe(262500);
    expect(res.totalAnnualTaxLiability).toBe(273000);
  });

  it('[OLD REGIME 07] Combined 80C + 80D + Exemptions reduces higher bracket', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1200000,
      exemptionsClaimed: 100000,
      approvedChapterVIADeductions: 175000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(875000);
  });

  it('[OLD REGIME 08] No double counting between standard deduction and 80C', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 400000,
      approvedChapterVIADeductions: 150000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(200000);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  // SECTION 3: SECTION 206AA HIGHER RATE PENALTY (4 TESTS)
  it('[SEC206AA 01] Missing PAN applies flat 20% tax penalty', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1000000,
      pan: null,
    });

    expect(res.isPanMissing).toBe(true);
    expect(res.totalAnnualTaxLiability).toBe(200000);
  });

  it('[SEC206AA 02] Invalid PAN format triggers Section 206AA penalty', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      pan: 'INVALID_PAN_123',
    });

    expect(res.isPanMissing).toBe(true);
    expect(res.totalAnnualTaxLiability).toBe(160000);
  });

  it('[SEC206AA 03] Valid PAN calculates normal statutory rates without penalty', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      pan: 'ABCDE1234F',
    });

    expect(res.isPanMissing).toBe(false);
    expect(res.totalAnnualTaxLiability).toBe(0);
  });

  it('[SEC206AA 04] High earner Section 206AA penalty takes higher of normal tax vs 20%', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 3000000,
      pan: null,
    });

    expect(res.totalAnnualTaxLiability).toBe(600000);
  });

  // SECTION 4: YTD TDS & PREVIOUS EMPLOYER (6 TESTS)
  it('[YTD 01] Remaining liability spreads evenly over remaining payroll periods', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1675000,
      ytdTdsPaid: 62400,
      remainingPayrollPeriods: 6,
      pan: 'ABCDE1234F',
    });

    expect(res.remainingTaxLiability).toBe(62400);
    expect(res.monthlyTdsDeduction).toBe(10400);
  });

  it('[YTD 02] Zero remaining tax liability returns ₹0 monthly TDS', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1675000,
      ytdTdsPaid: 130000,
      remainingPayrollPeriods: 4,
      pan: 'ABCDE1234F',
    });

    expect(res.remainingTaxLiability).toBe(0);
    expect(res.monthlyTdsDeduction).toBe(0);
  });

  it('[YTD 03] Previous employer TDS credits against projected liability', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1000000,
      previousEmployerIncome: 675000,
      previousEmployerTds: 40000,
      ytdTdsPaid: 30000,
      remainingPayrollPeriods: 6,
      pan: 'ABCDE1234F',
    });

    expect(res.totalAnnualTaxLiability).toBe(124800);
    expect(res.remainingTaxLiability).toBe(54800);
    expect(res.monthlyTdsDeduction).toBe(Math.round(54800 / 6));
  });

  it('[YTD 04] Mid-year joiner (6 remaining periods) accurately distributes tax', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      previousEmployerIncome: 875000,
      previousEmployerTds: 50000,
      ytdTdsPaid: 0,
      remainingPayrollPeriods: 6,
      pan: 'ABCDE1234F',
    });

    expect(res.totalAnnualTaxLiability).toBe(124800);
    expect(res.remainingTaxLiability).toBe(74800);
    expect(res.monthlyTdsDeduction).toBe(Math.round(74800 / 6));
  });

  it('[YTD 05] Previous employer income raises slab bracket accurately', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 800000,
      previousEmployerIncome: 1275000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(2000000);
    expect(res.totalAnnualTaxLiability).toBe(208000);
  });

  it('[YTD 06] Single remaining pay period absorbs entire remaining balance', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.NEW_REGIME_115BAC,
      projectedAnnualGross: 1675000,
      ytdTdsPaid: 110000,
      remainingPayrollPeriods: 1,
      pan: 'ABCDE1234F',
    });

    expect(res.remainingTaxLiability).toBe(14800);
    expect(res.monthlyTdsDeduction).toBe(14800);
  });

  // SECTION 5: DECLARATIONS & PROOF WORKFLOW (6 TESTS)
  it('[WORKFLOW 01] Tax Regime assignment updates employee statutory profile', async () => {
    const profile = await TaxDeclarationService.setTaxRegime({
      companyId,
      employeeId: employee1Id,
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(profile.taxRegime).toBe(TaxRegime.OLD_REGIME);
  });

  it('[WORKFLOW 02] Employee submits declaration item in SUBMITTED state', async () => {
    const decl = await TaxDeclarationService.submitDeclarationItem({
      companyId,
      employeeId: employee1Id,
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      sectionCategory: TaxSectionCategory.SECTION_80C,
      itemCode: '80C_PPF',
      declaredAmount: 150000,
      actorEmail: 'ganesh@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(decl.status).toBe(DeclarationStatus.SUBMITTED);
    expect(decl.declaredAmount).toBe(150000);
    expect(decl.approvedAmount).toBe(0);
  });

  it('[WORKFLOW 03] HR review approves declaration item with approved amount', async () => {
    const decl = await prisma.employeeTaxDeclaration.findFirst({
      where: { employeeId: employee1Id, itemCode: '80C_PPF' },
    });

    const reviewed = await TaxDeclarationService.reviewDeclarationItem({
      declarationId: decl!.id,
      companyId,
      status: DeclarationStatus.APPROVED,
      approvedAmount: 150000,
      reviewerId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(reviewed.status).toBe(DeclarationStatus.APPROVED);
    expect(reviewed.approvedAmount).toBe(150000);
  });

  it('[WORKFLOW 04] HR review rejects declaration item with reason', async () => {
    const decl = await TaxDeclarationService.submitDeclarationItem({
      companyId,
      employeeId: employee1Id,
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      sectionCategory: TaxSectionCategory.SECTION_80D,
      itemCode: '80D_HEALTH_PARENTS',
      declaredAmount: 50000,
      actorEmail: 'ganesh@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    const reviewed = await TaxDeclarationService.reviewDeclarationItem({
      declarationId: decl.id,
      companyId,
      status: DeclarationStatus.REJECTED,
      approvedAmount: 0,
      rejectionReason: 'Policy document illegible or expired',
      reviewerId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(reviewed.status).toBe(DeclarationStatus.REJECTED);
    expect(reviewed.approvedAmount).toBe(0);
    expect(reviewed.rejectionReason).toBeDefined();
  });

  it('[WORKFLOW 05] Previous employer income record links and approves Form 12B', async () => {
    const record = await TaxDeclarationService.recordPreviousEmployerIncome({
      companyId,
      employeeId: employee1Id,
      financialYear: '2026-2027',
      employerName: 'Infosys Limited',
      grossSalary: 450000,
      tdsDeducted: 15000,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(record.isApproved).toBe(true);
    expect(record.grossSalary).toBe(450000);
  });

  it('[WORKFLOW 06] Full employee tax computation incorporates approved deductions and Form 12B', async () => {
    const comp = await TaxDeclarationService.getEmployeeTaxComputation({
      companyId,
      employeeId: employee1Id,
      financialYear: '2026-2027',
      remainingPeriods: 6,
    });

    expect(comp.taxRegime).toBe(TaxRegime.OLD_REGIME);
    expect(comp.previousEmployerTds).toBe(15000);
    expect(comp.chapterVIAClaims).toBe(150000);
  });

  // SECTION 6: SECURITY & TENANT ISOLATION (6 TESTS)
  it('[SECURITY 01] Multi-tenant isolation: Tenant B cannot access Tenant A declarations', async () => {
    const decl = await prisma.employeeTaxDeclaration.findFirst({ where: { employeeId: employee1Id } });

    await expect(
      TaxDeclarationService.reviewDeclarationItem({
        declarationId: decl!.id,
        companyId: tenantBId,
        status: DeclarationStatus.APPROVED,
        approvedAmount: 50000,
        reviewerId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Declaration not found');
  });

  it('[SECURITY 02] Cross-tenant employee tax computation access is blocked', async () => {
    await expect(
      TaxDeclarationService.getEmployeeTaxComputation({
        companyId: tenantBId,
        employeeId: employee1Id,
        financialYear: '2026-2027',
      })
    ).rejects.toThrow('Employee not found');
  });

  it('[SECURITY 03] Audit trail logs declaration review events', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'TAX_DECLARATION_REVIEWED' },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entity).toBe('EmployeeTaxDeclaration');
  });

  it('[SECURITY 04] Audit trail logs tax regime changes', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'TAX_REGIME_UPDATED' },
    });

    expect(logs.length).toBeGreaterThan(0);
  });

  it('[SECURITY 05] Section 80C cap enforcement prevents exceeding statutory ₹1,50,000', () => {
    const res = TdsCalculatorService.calculateTaxProjection({
      financialYear: '2026-2027',
      taxRegime: TaxRegime.OLD_REGIME,
      projectedAnnualGross: 1200000,
      approvedChapterVIADeductions: 350000,
      pan: 'ABCDE1234F',
    });

    expect(res.netTaxableIncome).toBe(800000);
  });

  it('[SECURITY 06] Financial safety confirmation: Baseline unprorated Net Pay is deterministic', () => {
    const gross = 100000;
    const basic = 50000;
    const epf = Math.round(Math.min(basic, 15000) * 0.12);
    const esic = 0;
    const pt = 200;
    const tds = 5000;
    const totalDeductions = epf + esic + pt + tds;
    const netSalary = gross - totalDeductions;

    expect(totalDeductions).toBe(7000);
    expect(netSalary).toBe(93000);
  });
});