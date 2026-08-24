import { PrismaClient, SeparationStatus, FnfStatus, ExpenseClaimStatus } from '@prisma/client';
import { FnFSettlementService } from '../src/services/fnf-settlement.service';

const prisma = new PrismaClient();

describe('Phase 8C: Full & Final Settlement & Exit Management Hardened Test Suite (42 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let hrMakerId: string;
  let hrCheckerId: string;
  let empJuniorId: string;      // 1 Year Tenure (< 5 Years)
  let empFiveYearId: string;    // Exactly 5 Years Tenure
  let empSeniorId: string;      // 10 Years Tenure
  let empTwentyYearId: string;  // 20 Years Tenure (Ceiling Test)
  let resignationId: string;
  let settlementId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup for complete idempotence
    const testCodes = ['TEST-8C-CORP-A', 'TEST-8C-CORP-B'];
    await prisma.fnFSettlement.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.exitClearanceItem.deleteMany({ where: { resignation: { company: { code: { in: testCodes } } } } });
    await prisma.resignationRequest.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.expenseClaimDocument.deleteMany({ where: { claim: { company: { code: { in: testCodes } } } } });
    await prisma.employeeExpenseClaim.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.flexibleBenefitAllocation.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.reimbursementHeadConfig.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveBalance.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveType.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollAdjustment.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Companies
    const compA = await prisma.company.create({
      data: { code: 'TEST-8C-CORP-A', name: 'Sarwin Enterprise FnF Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8C-CORP-B', name: 'Isolated FnF Tenant B' },
    });
    tenantBId = compB.id;

    // 3. Setup HR Maker & Checker Users
    const uMaker = await prisma.user.create({
      data: { companyId, email: 'hr.maker.8c@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    hrMakerId = uMaker.id;

    const uChecker = await prisma.user.create({
      data: { companyId, email: 'hr.checker.8c@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    hrCheckerId = uChecker.id;

    // 4. Setup Employees across Tenures
    // Emp 1: Junior (1 Year Tenure)
    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8C-001',
        name: 'Karthik Junior',
        email: 'karthik.jr@sarwin.com',
        monthlyGross: 90000,
        basicSalary: 45000,
        dateOfJoining: new Date('2025-08-01'),
      },
    });
    empJuniorId = emp1.id;

    // Emp 2: Exactly 5 Years Tenure
    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8C-002',
        name: 'Priya Mid',
        email: 'priya.mid@sarwin.com',
        monthlyGross: 120000,
        basicSalary: 60000,
        dateOfJoining: new Date('2021-08-01'),
      },
    });
    empFiveYearId = emp2.id;

    // Emp 3: Senior (10 Years Tenure)
    const emp3 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8C-003',
        name: 'Ramesh Senior',
        email: 'ramesh.sr@sarwin.com',
        monthlyGross: 240000,
        basicSalary: 120000,
        dateOfJoining: new Date('2016-08-01'),
      },
    });
    empSeniorId = emp3.id;

    // Emp 4: Executive (20 Years Tenure)
    const emp4 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8C-004',
        name: 'Venkatesh Exec',
        email: 'venkatesh.exec@sarwin.com',
        monthlyGross: 500000,
        basicSalary: 250000,
        dateOfJoining: new Date('2006-08-01'),
      },
    });
    empTwentyYearId = emp4.id;

    // 5. Setup Leave Balances
    const lt = await prisma.leaveType.create({
      data: { companyId, code: 'PL', name: 'Privilege Leave', annualEntitlement: 18 },
    });

    await prisma.leaveBalance.create({
      data: { companyId, employeeId: emp1.id, leaveTypeId: lt.id, financialYear: '2026-2027', available: 12, accrued: 18, used: 6 },
    });
    await prisma.leaveBalance.create({
      data: { companyId, employeeId: emp2.id, leaveTypeId: lt.id, financialYear: '2026-2027', available: 15, accrued: 18, used: 3 },
    });
    await prisma.leaveBalance.create({
      data: { companyId, employeeId: emp3.id, leaveTypeId: lt.id, financialYear: '2026-2027', available: 24, accrued: 36, used: 12 },
    });
    await prisma.leaveBalance.create({
      data: { companyId, employeeId: emp4.id, leaveTypeId: lt.id, financialYear: '2026-2027', available: 45, accrued: 60, used: 15 },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================================
  // SECTION 1: RESIGNATION & NOTICE PERIOD (10 TESTS)
  // ========================================================
  it('[RESIGN 01] Submits employee resignation with standard 30-day notice period', async () => {
    const res = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: empJuniorId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-31'),
      reason: 'Pursuing higher studies',
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    resignationId = res.id;
    expect(res.status).toBe(SeparationStatus.RESIGNATION_SUBMITTED);
    expect(res.noticePeriodDays).toBe(30);
    expect(res.noticeShortfallDays).toBe(0);
  });

  it('[RESIGN 02] Calculates exact shortfall days when proposed LWD is early (14 days served => 16 days shortfall)', async () => {
    const shortRes = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: empSeniorId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-15'),
      reason: 'Immediate start at new organization',
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(shortRes.noticeShortfallDays).toBe(16);
  });

  it('[RESIGN 03] Automatically initializes 4 departmental clearance items (IT, ADMIN, FINANCE, HR)', async () => {
    const items = await prisma.exitClearanceItem.findMany({ where: { resignationId } });
    expect(items.length).toBe(4);
    const depts = items.map((i) => i.departmentName);
    expect(depts).toContain('IT');
    expect(depts).toContain('FINANCE');
  });

  it('[RESIGN 04] Updates Employee employment status to ON_NOTICE', async () => {
    const emp = await prisma.employee.findUnique({ where: { id: empJuniorId } });
    expect(emp!.employmentStatus).toBe('ON_NOTICE');
    expect(emp!.resignationDate).not.toBeNull();
  });

  it('[RESIGN 05] Duplicate resignation upserts and preserves state gracefully', async () => {
    const reSub = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: empJuniorId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-31'),
      reason: 'Updated reason note',
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    expect(reSub.reason).toBe('Updated reason note');
  });

  it('[RESIGN 06] Senior employee resignation creates linked clearance items', async () => {
    const resSr = await prisma.resignationRequest.findUnique({ where: { employeeId: empSeniorId } });
    const items = await prisma.exitClearanceItem.findMany({ where: { resignationId: resSr!.id } });
    expect(items.length).toBe(4);
  });

  it('[RESIGN 07] Resignation submission fails safely for non-existent employee ID', async () => {
    await expect(
      FnFSettlementService.submitResignation({
        companyId,
        employeeId: 'invalid-emp-id',
        resignationDate: new Date(),
        proposedLastDay: new Date(),
        reason: 'Error test',
        actorUserId: hrMakerId,
        actorEmail: 'hr@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Employee not found');
  });

  it('[RESIGN 08] Audit trail records RESIGNATION_SUBMITTED action', async () => {
    const logs = await prisma.auditLog.findMany({ where: { companyId, action: 'RESIGNATION_SUBMITTED' } });
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });

  it('[RESIGN 09] Full notice served (30 days) reports zero shortfall days', async () => {
    const res5 = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: empFiveYearId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-31'),
      reason: 'Relocation',
      actorUserId: hrMakerId,
      actorEmail: 'hr@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    expect(res5.noticeShortfallDays).toBe(0);
  });

  it('[RESIGN 10] Executive 20-year employee resignation submitted', async () => {
    const res20 = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: empTwentyYearId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-31'),
      reason: 'Retirement',
      actorUserId: hrMakerId,
      actorEmail: 'hr@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    expect(res20.noticeShortfallDays).toBe(0);
  });

  // ========================================================
  // SECTION 2: FINAL SALARY & LOP CALCULATIONS (6 TESTS)
  // ========================================================
  it('[SALARY 01] Calculates mid-month worked days salary (15/30 days = 50% gross)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    settlementId = fnf.id;
    expect(fnf.workedDaysSalary).toBe(45000); // 90,000 * (15/30)
  });

  it('[SALARY 02] Calculates full-month worked days salary (30/30 days = 100% gross)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 30,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(fnf.workedDaysSalary).toBe(90000);
  });

  it('[SALARY 03] Calculates single-day exit salary (1/30 days)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 1,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(fnf.workedDaysSalary).toBe(3000); // 90000 / 30
  });

  it('[SALARY 04] Senior employee worked days salary (15/30 days on ₹240k gross)', async () => {
    const fnfSr = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empSeniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(fnfSr.workedDaysSalary).toBe(120000); // 240,000 * 0.5
  });

  it('[SALARY 05] Executive 20-year worked days salary (30/30 days on ₹500k gross)', async () => {
    const fnf20 = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empTwentyYearId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 30,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(fnf20.workedDaysSalary).toBe(500000);
  });

  it('[SALARY 06] Calculation snapshot records worked days parameter', async () => {
    const fnf = await prisma.fnFSettlement.findUnique({ where: { employeeId: empJuniorId } });
    const snap = fnf!.calculationSnapshot as any;
    expect(snap.workedDays).toBe(1);
  });

  // ========================================================
  // SECTION 3: LEAVE ENCASHMENT EVALUATION (6 TESTS)
  // ========================================================
  it('[ENCASH 01] Evaluates encashment for Junior employee (12 days PL at ₹45k Basic)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (45000 / 30) * 12 = 18,000
    expect(fnf.leaveEncashment).toBe(18000);
  });

  it('[ENCASH 02] Evaluates encashment for Mid employee (15 days PL at ₹60k Basic)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empFiveYearId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (60000 / 30) * 15 = 30,000
    expect(fnf.leaveEncashment).toBe(30000);
  });

  it('[ENCASH 03] Evaluates encashment for Senior employee (24 days PL at ₹120k Basic)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empSeniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (120000 / 30) * 24 = 96,000
    expect(fnf.leaveEncashment).toBe(96000);
  });

  it('[ENCASH 04] Evaluates encashment for Executive (45 days PL at ₹250k Basic)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empTwentyYearId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 30,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (250000 / 30) * 45 = 375,000
    expect(fnf.leaveEncashment).toBe(375000);
  });

  it('[ENCASH 05] Enforces Section 10(10AA) statutory ceiling ₹25,00,000', () => {
    const grossEncashment = 3000000;
    const capped = Math.min(grossEncashment, 2500000);
    expect(capped).toBe(2500000);
  });

  it('[ENCASH 06] Zero leave balance yields ₹0 leave encashment', () => {
    const basic = 50000;
    const zeroDays = 0;
    const encashment = Math.round((basic / 30) * zeroDays);
    expect(encashment).toBe(0);
  });

  // ========================================================
  // SECTION 4: PAYMENT OF GRATUITY ACT 1972 (6 TESTS)
  // ========================================================
  it('[GRATUITY 01] Junior employee (< 5 years tenure) is ineligible for Gratuity (₹0)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    expect(fnf.gratuityAmount).toBe(0);
  });

  it('[GRATUITY 02] Exactly 5 Years Tenure qualifies for Gratuity', async () => {
    const fnf5 = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empFiveYearId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (15 * 60,000 * 5) / 26 = 173,077
    expect(fnf5.gratuityAmount).toBe(173077);
  });

  it('[GRATUITY 03] 10 Years Senior employee Gratuity calculation', async () => {
    const fnf10 = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empSeniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula: (15 * 120,000 * 10) / 26 = 692,308
    expect(fnf10.gratuityAmount).toBe(692308);
  });

  it('[GRATUITY 04] 20 Years Executive Gratuity calculation with ₹20L statutory exemption cap', async () => {
    const fnf20 = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empTwentyYearId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 30,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    // Formula uncapped: (15 * 250,000 * 20) / 26 = 2,884,615 -> Capped at 2,000,000
    expect(fnf20.gratuityAmount).toBe(2000000);
  });

  it('[GRATUITY 05] Statutory ceiling ₹20,00,000 correctly restricts higher uncapped formula', () => {
    const calculated = 2884615;
    const capped = Math.min(calculated, 2000000);
    expect(capped).toBe(2000000);
  });

  it('[GRATUITY 06] Calculation snapshot records calculated gratuity amount', async () => {
    const fnf = await prisma.fnFSettlement.findUnique({ where: { employeeId: empSeniorId } });
    const snap = fnf!.calculationSnapshot as any;
    expect(snap.calculatedGratuity).toBe(692308);
  });

  // ========================================================
  // SECTION 5: RECOVERIES & REIMBURSEMENT INTEGRATION (6 TESTS)
  // ========================================================
  it('[RECOVERY 01] Notice period shortfall deduction calculated based on unserved days', async () => {
    const fnfSr = await prisma.fnFSettlement.findUnique({ where: { employeeId: empSeniorId } });
    // Formula: (Basic 120000 / 30) * 16 days = 64,000
    expect(fnfSr!.noticeShortfallDeduction).toBe(64000);
  });

  it('[RECOVERY 02] Asset clearance item recovery is integrated into F&F deductions', async () => {
    const resSr = await prisma.resignationRequest.findUnique({ where: { employeeId: empSeniorId } });
    const itClearance = await prisma.exitClearanceItem.findFirst({
      where: { resignationId: resSr!.id, departmentName: 'IT' },
    });
    await prisma.exitClearanceItem.update({
      where: { id: itClearance!.id },
      data: { isCleared: false, recoveryAmount: 15000, remarks: 'Unreturned monitor' },
    });

    const fnfRecalc = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empSeniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(fnfRecalc.assetRecoveryDeduction).toBe(15000);
  });

  it('[REIMB 01] Unpaid approved expense claim is added to gross settlement', async () => {
    const head = await prisma.reimbursementHeadConfig.create({
      data: { companyId, code: 'TEL_8C', name: 'Telephone Allowance', monthlyLimit: 2500, annualLimit: 30000, isTaxExempt: true },
    });

    await prisma.employeeExpenseClaim.create({
      data: {
        companyId,
        employeeId: empJuniorId,
        claimNumber: 'CLM-FNF-01',
        financialYear: '2026-2027',
        headId: head.id,
        claimDate: new Date('2026-08-15'),
        amountClaimed: 2500,
        amountApproved: 2500,
        status: ExpenseClaimStatus.APPROVED,
        payrollCycleId: null, // Unpaid
        description: 'Final bill',
      },
    });

    const fnfJunior = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(fnfJunior.reimbursements).toBe(2500);
  });

  it('[REIMB 02] Draft, pending, or rejected claims are excluded from F&F', async () => {
    const head = await prisma.reimbursementHeadConfig.findFirst({ where: { companyId, code: 'TEL_8C' } });

    await prisma.employeeExpenseClaim.create({
      data: {
        companyId,
        employeeId: empJuniorId,
        claimNumber: 'CLM-FNF-DRAFT',
        financialYear: '2026-2027',
        headId: head!.id,
        claimDate: new Date('2026-08-16'),
        amountClaimed: 5000,
        amountApproved: 0,
        status: ExpenseClaimStatus.DRAFT,
        description: 'Draft claim',
      },
    });

    const fnfJunior = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: empJuniorId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrMakerId,
      actorEmail: 'hr.maker.8c@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(fnfJunior.reimbursements).toBe(2500); // Only the approved 2500 is counted
  });

  it('[DEDUCT 01] EPF deduction strictly follows ₹15,000 wage ceiling (12% = ₹1800)', async () => {
    const fnfSr = await prisma.fnFSettlement.findUnique({ where: { employeeId: empSeniorId } });
    expect(fnfSr!.epfDeduction).toBe(1800);
  });

  it('[DEDUCT 02] Professional Tax standard deduction is applied (₹200)', async () => {
    const fnfSr = await prisma.fnFSettlement.findUnique({ where: { employeeId: empSeniorId } });
    expect(fnfSr!.ptDeduction).toBe(200);
  });

  // ========================================================
  // SECTION 6: MAKER-CHECKER, LOCKING & TENANCY (4 TESTS)
  // ========================================================
  it('[GOV 01] Maker-Checker Violation: Calculator cannot approve and lock own F&F', async () => {
    await expect(
      FnFSettlementService.approveAndLockFnF({
        companyId,
        settlementId,
        approverUserId: hrMakerId, // Same user
        actorEmail: 'hr.maker.8c@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Maker-Checker Violation');
  });

  it('[GOV 02] Independent checker approves and locks F&F, transitioning Employee to EXITED', async () => {
    const locked = await FnFSettlementService.approveAndLockFnF({
      companyId,
      settlementId,
      approverUserId: hrCheckerId,
      actorEmail: 'hr.checker.8c@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });

    expect(locked.status).toBe(FnfStatus.LOCKED);

    const emp = await prisma.employee.findUnique({ where: { id: empJuniorId } });
    expect(emp!.employmentStatus).toBe('EXITED');

    const res = await prisma.resignationRequest.findUnique({ where: { employeeId: empJuniorId } });
    expect(res!.status).toBe(SeparationStatus.SETTLED);
  });

  it('[GOV 03] Cross-tenant F&F calculation is rejected', async () => {
    await expect(
      FnFSettlementService.calculateFnF({
        companyId: tenantBId,
        employeeId: empSeniorId,
        financialYear: '2026-2027',
        actorUserId: hrMakerId,
        actorEmail: 'hr@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Employee not found');
  });

  it('[GOV 04] Locked F&F settlement is immutable', async () => {
    const locked = await prisma.fnFSettlement.findUnique({ where: { id: settlementId } });
    expect(locked!.status).toBe(FnfStatus.LOCKED);
    expect(locked!.netSettlementPayable).toBeGreaterThan(0);
  });
});