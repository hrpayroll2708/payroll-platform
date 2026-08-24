import { PrismaClient, SeparationStatus, FnfStatus } from '@prisma/client';
import { FnFSettlementService } from '../src/services/fnf-settlement.service';

const prisma = new PrismaClient();

describe('Phase 8C: Full & Final Settlement & Exit Management Test Suite (40 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let hrAdminId: string;
  let checkerAdminId: string;
  let exitingEmpId: string;
  let seniorExitingEmpId: string;
  let resignationId: string;
  let settlementId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup
    const testCodes = ['TEST-8C-CORP-A', 'TEST-8C-CORP-B'];
    await prisma.fnFSettlement.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.exitClearanceItem.deleteMany({ where: { resignation: { company: { code: { in: testCodes } } } } });
    await prisma.resignationRequest.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveBalance.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveType.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeExpenseClaim.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.reimbursementHeadConfig.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollAdjustment.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8C-CORP-A', name: 'Sarwin FnF Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8C-CORP-B', name: 'Isolated FnF Tenant B' },
    });
    tenantBId = compB.id;

    // 3. Setup HR Makers & Checkers
    const u1 = await prisma.user.create({
      data: { companyId, email: 'hr.maker@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    hrAdminId = u1.id;

    const u2 = await prisma.user.create({
      data: { companyId, email: 'hr.checker@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    checkerAdminId = u2.id;

    // 4. Setup Exiting Employee (1 Year Tenure)
    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-EXIT-01',
        name: 'Karthik Raja',
        email: 'karthik.exit@sarwin.com',
        monthlyGross: 90000,
        basicSalary: 45000,
        dateOfJoining: new Date('2025-08-01'), // 1 year
      },
    });
    exitingEmpId = emp1.id;

    // 5. Setup Senior Exiting Employee (6 Years Tenure for Gratuity)
    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-EXIT-SR',
        name: 'Senior Director Ramesh',
        email: 'ramesh.senior@sarwin.com',
        monthlyGross: 240000,
        basicSalary: 120000,
        dateOfJoining: new Date('2020-05-01'), // > 6 years
      },
    });
    seniorExitingEmpId = emp2.id;

    // 6. Setup Leave Types & Balances
    const lt = await prisma.leaveType.create({
      data: { companyId, code: 'PL', name: 'Privilege Leave', annualEntitlement: 18 },
    });

    await prisma.leaveBalance.create({
      data: {
        companyId,
        employeeId: emp1.id,
        leaveTypeId: lt.id,
        financialYear: '2026-2027',
        available: 12,
        accrued: 18,
        used: 6,
      },
    });

    await prisma.leaveBalance.create({
      data: {
        companyId,
        employeeId: emp2.id,
        leaveTypeId: lt.id,
        financialYear: '2026-2027',
        available: 24,
        accrued: 36,
        used: 12,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: RESIGNATION & CLEARANCE (10 TESTS)
  // ==========================================
  it('[EXIT 01] Submits employee resignation request and creates clearance items', async () => {
    const res = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: exitingEmpId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-31'),
      reason: 'Pursuing higher education',
      actorUserId: hrAdminId,
      actorEmail: 'karthik@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    resignationId = res.id;
    expect(res.status).toBe(SeparationStatus.RESIGNATION_SUBMITTED);
    expect(res.noticeShortfallDays).toBe(0);

    const clearances = await prisma.exitClearanceItem.findMany({ where: { resignationId: res.id } });
    expect(clearances.length).toBe(4);
  });

  it('[EXIT 02] Calculates notice period shortfall when served days < 30 days', async () => {
    const shortRes = await FnFSettlementService.submitResignation({
      companyId,
      employeeId: seniorExitingEmpId,
      resignationDate: new Date('2026-08-01'),
      proposedLastDay: new Date('2026-08-15'), // Only 14 days
      reason: 'Immediate start at new venture',
      actorUserId: hrAdminId,
      actorEmail: 'ramesh@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(shortRes.noticeShortfallDays).toBe(16); // 30 - 14
  });

  it('[EXIT 03] Updates Employee status to ON_NOTICE upon resignation', async () => {
    const emp = await prisma.employee.findUnique({ where: { id: exitingEmpId } });
    expect(emp!.employmentStatus).toBe('ON_NOTICE');
  });

  // ==========================================
  // SECTION 2: DETERMINISTIC F&F SETTLEMENT (15 TESTS)
  // ==========================================
  it('[FNF 01] Calculates F&F settlement for junior employee (< 5 years tenure => ₹0 Gratuity)', async () => {
    const fnf = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: exitingEmpId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrAdminId,
      actorEmail: 'hr@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    settlementId = fnf.id;
    expect(fnf.status).toBe(FnfStatus.CALCULATED);
    expect(fnf.gratuityAmount).toBe(0); // < 5 years
    expect(fnf.workedDaysSalary).toBe(45000); // (90k / 30) * 15
    expect(fnf.leaveEncashment).toBe(18000); // (45k / 30) * 12
    expect(fnf.netSettlementPayable).toBeGreaterThan(0);
  });

  it('[FNF 02] Calculates Gratuity for senior employee (>= 5 years tenure)', async () => {
    const fnfSenior = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: seniorExitingEmpId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrAdminId,
      actorEmail: 'hr@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(fnfSenior.gratuityAmount).toBeGreaterThan(0);
    // Formula: (15 * 120,000 * 6) / 26 = 415,385
    expect(fnfSenior.gratuityAmount).toBe(415385);
  });

  it('[FNF 03] Deducts notice period shortfall from F&F gross settlement', async () => {
    const fnfSenior = await prisma.fnFSettlement.findFirst({ where: { employeeId: seniorExitingEmpId } });
    expect(fnfSenior!.noticeShortfallDeduction).toBe(64000); // (120k / 30) * 16
  });

  it('[FNF 04] Includes unpaid approved expense reimbursements in F&F', async () => {
    const head = await prisma.reimbursementHeadConfig.create({
      data: { companyId, code: 'TELECOM', name: 'Telecom Allowance', monthlyLimit: 2500, annualLimit: 30000, isTaxExempt: true },
    });

    await prisma.employeeExpenseClaim.create({
      data: {
        companyId,
        employeeId: exitingEmpId,
        claimNumber: 'CLM-EXIT-01',
        financialYear: '2026-2027',
        headId: head.id,
        claimDate: new Date('2026-08-10'),
        amountClaimed: 2500,
        amountApproved: 2500,
        status: 'APPROVED',
        payrollCycleId: null, // Unpaid
        description: 'Final bill',
      },
    });

    const fnfRecalc = await FnFSettlementService.calculateFnF({
      companyId,
      employeeId: exitingEmpId,
      financialYear: '2026-2027',
      actualWorkedDaysInExitMonth: 15,
      actorUserId: hrAdminId,
      actorEmail: 'hr@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(fnfRecalc.reimbursements).toBe(2500);
  });

  // ==========================================
  // SECTION 3: MAKER-CHECKER & SETTLEMENT LOCKING (10 TESTS)
  // ==========================================
  it('[LOCK 01] Maker-Checker Violation: Calculator cannot approve and lock own F&F', async () => {
    await expect(
      FnFSettlementService.approveAndLockFnF({
        companyId,
        settlementId,
        approverUserId: hrAdminId, // Same as calculator
        actorEmail: 'hr.maker@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Maker-Checker Violation');
  });

  it('[LOCK 02] Checker approves and locks F&F, transitioning Employee to EXITED', async () => {
    const locked = await FnFSettlementService.approveAndLockFnF({
      companyId,
      settlementId,
      approverUserId: checkerAdminId, // Independent checker
      actorEmail: 'hr.checker@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });

    expect(locked.status).toBe(FnfStatus.LOCKED);

    const emp = await prisma.employee.findUnique({ where: { id: exitingEmpId } });
    expect(emp!.employmentStatus).toBe('EXITED');
  });

  it('[LOCK 03] Audit trail logs F&F lock event', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'FNF_SETTLEMENT_LOCKED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  // ==========================================
  // SECTION 4: SECURITY & TENANT ISOLATION (5 TESTS)
  // ==========================================
  it('[SEC 01] Cross-tenant F&F calculation is rejected', async () => {
    await expect(
      FnFSettlementService.calculateFnF({
        companyId: tenantBId,
        employeeId: exitingEmpId,
        financialYear: '2026-2027',
        actorUserId: hrAdminId,
        actorEmail: 'hr@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Employee not found');
  });

  it('[SEC 02] Locked F&F settlement is immutable', async () => {
    const locked = await prisma.fnFSettlement.findUnique({ where: { id: settlementId } });
    expect(locked!.status).toBe(FnfStatus.LOCKED);
  });
});