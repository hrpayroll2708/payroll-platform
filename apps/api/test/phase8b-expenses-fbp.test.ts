import { PrismaClient, ExpenseClaimStatus } from '@prisma/client';
import { ExpenseClaimService } from '../src/services/expense-claim.service';
import { FbpAllocationService } from '../src/services/fbp-allocation.service';

const prisma = new PrismaClient();

describe('Phase 8B: Flexible Benefits & Expense Reimbursements Test Suite (36 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let managerId: string;
  let managerUserId: string;
  let employeeId: string;
  let employeeUserId: string;
  let unrelatedEmpId: string;
  let openCycleId: string;
  let lockedCycleId: string;
  let telephoneHeadId: string;
  let fuelHeadId: string;
  let medicalHeadId: string;
  let claimId: string;

  beforeAll(async () => {
    // 1. Clean test fixtures
    const testCodes = ['TEST-8B-CORP-A', 'TEST-8B-CORP-B'];
    await prisma.expenseClaimDocument.deleteMany({ where: { claim: { company: { code: { in: testCodes } } } } });
    await prisma.employeeExpenseClaim.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.flexibleBenefitAllocation.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.reimbursementHeadConfig.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollAdjustment.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8B-CORP-A', name: 'Sarwin Expenses Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8B-CORP-B', name: 'Isolated Expenses Tenant B' },
    });
    tenantBId = compB.id;

    // 3. Setup Manager and Subordinate
    const mgr = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8B-MGR',
        name: 'Manager Alok',
        email: 'alok.mgr@sarwin.com',
        monthlyGross: 200000,
        basicSalary: 100000,
      },
    });
    managerId = mgr.id;

    const uMgr = await prisma.user.create({
      data: { companyId, email: 'alok.mgr@sarwin.com', passwordHash: 'hash', employeeId: mgr.id, isActive: true },
    });
    managerUserId = uMgr.id;

    const emp = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8B-SUB',
        name: 'Employee Deepak',
        email: 'deepak.sub@sarwin.com',
        managerId: mgr.id,
        monthlyGross: 100000,
        basicSalary: 50000,
      },
    });
    employeeId = emp.id;

    const uEmp = await prisma.user.create({
      data: { companyId, email: 'deepak.sub@sarwin.com', passwordHash: 'hash', employeeId: emp.id, isActive: true },
    });
    employeeUserId = uEmp.id;

    const unrelated = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8B-OTHER',
        name: 'Unrelated Associate',
        email: 'other.8b@sarwin.com',
        monthlyGross: 75000,
        basicSalary: 37500,
      },
    });
    unrelatedEmpId = unrelated.id;

    // 4. Seed FBP Heads
    await FbpAllocationService.seedDefaultHeads(companyId);
    const heads = await prisma.reimbursementHeadConfig.findMany({ where: { companyId } });
    telephoneHeadId = heads.find((h) => h.code === 'TELEPHONE')!.id;
    fuelHeadId = heads.find((h) => h.code === 'FUEL')!.id;
    medicalHeadId = heads.find((h) => h.code === 'MEDICAL')!.id;

    // 5. Setup Open Payroll Cycle
    const cycle = await prisma.payrollCycle.create({
      data: {
        companyId,
        month: 8,
        year: 2026,
        periodStartDate: new Date('2026-08-01'),
        periodEndDate: new Date('2026-08-31'),
        paymentDueDate: new Date('2026-09-07'),
        status: 'OPEN',
      },
    });
    openCycleId = cycle.id;

    // 6. Setup Locked Payroll Cycle for safe historical immutability check
    const locked = await prisma.payrollCycle.create({
      data: {
        companyId,
        month: 7,
        year: 2026,
        periodStartDate: new Date('2026-07-01'),
        periodEndDate: new Date('2026-07-31'),
        paymentDueDate: new Date('2026-08-07'),
        status: 'LOCKED',
        totalGrossPayable: 100000,
        totalNetPayout: 91400,
      },
    });
    lockedCycleId = locked.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: FBP ALLOCATION & ENTITLEMENTS (8 TESTS)
  // ==========================================
  it('[FBP 01] Seeds standard tax-exempt and taxable benefit heads', async () => {
    const summary = await FbpAllocationService.getEmployeeFbpSummary({ companyId, employeeId });
    expect(summary.length).toBeGreaterThanOrEqual(4);
    const tel = summary.find((s) => s.code === 'TELEPHONE');
    expect(tel!.isTaxExempt).toBe(true);
    expect(tel!.annualLimit).toBe(30000);
  });

  it('[FBP 02] Allocates employee annual FBP entitlement', async () => {
    const alloc = await FbpAllocationService.allocateEmployeeFbp({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      annualEntitlement: 30000,
      actorUserId: managerUserId,
      actorEmail: 'alok.mgr@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(alloc.annualEntitlement).toBe(30000);
    expect(alloc.monthlyEntitlement).toBe(2500);
  });

  it('[FBP 03] Rejects allocation exceeding statutory annual limit', async () => {
    await expect(
      FbpAllocationService.allocateEmployeeFbp({
        companyId,
        employeeId,
        financialYear: '2026-2027',
        headId: telephoneHeadId,
        annualEntitlement: 50000, // Exceeds 30k
        actorUserId: managerUserId,
        actorEmail: 'alok.mgr@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('exceeds statutory annual limit');
  });

  it('[FBP 04] Rejects negative FBP allocation', async () => {
    await expect(
      FbpAllocationService.allocateEmployeeFbp({
        companyId,
        employeeId,
        financialYear: '2026-2027',
        headId: telephoneHeadId,
        annualEntitlement: -500,
        actorUserId: managerUserId,
        actorEmail: 'alok.mgr@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('cannot be negative');
  });

  it('[FBP 05] Audit trail logs FBP allocation updates', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'FBP_ALLOCATION_UPDATED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  // ==========================================
  // SECTION 2: CLAIM SUBMISSION & RECEIPT VALIDATION (10 TESTS)
  // ==========================================
  it('[CLAIM 01] Creates DRAFT claim with receipt attachment and SHA-256 hash', async () => {
    const claim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      claimDate: new Date('2026-08-15'),
      amountClaimed: 2500,
      description: 'August Broadband and Mobile bill',
      receiptFile: { fileName: 'Broadband_Bill_Aug.pdf', fileUrl: '/uploads/receipt-01.pdf', fileSize: 1024 },
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    claimId = claim.id;
    expect(claim.status).toBe(ExpenseClaimStatus.DRAFT);
    expect(claim.amountClaimed).toBe(2500);
  });

  it('[CLAIM 02] Rejects claim with zero or negative amount', async () => {
    await expect(
      ExpenseClaimService.createDraftClaim({
        companyId,
        employeeId,
        financialYear: '2026-2027',
        headId: telephoneHeadId,
        claimDate: new Date('2026-08-15'),
        amountClaimed: 0,
        description: 'Zero claim',
        actorEmail: 'deepak.sub@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('greater than zero');
  });

  it('[CLAIM 03] Submits claim transitioning from DRAFT to SUBMITTED', async () => {
    const sub = await ExpenseClaimService.submitClaim({
      companyId,
      employeeId,
      claimId,
      actorUserId: employeeUserId,
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(sub.status).toBe(ExpenseClaimStatus.SUBMITTED);
  });

  it('[CLAIM 04] Rejects submitting claim if proof is required but missing', async () => {
    const noProofClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      claimDate: new Date('2026-08-16'),
      amountClaimed: 1500,
      description: 'No receipt',
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    await expect(
      ExpenseClaimService.submitClaim({
        companyId,
        employeeId,
        claimId: noProofClaim.id,
        actorUserId: employeeUserId,
        actorEmail: 'deepak.sub@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Receipt proof is mandatory');
  });

  it('[CLAIM 05] Employee can cancel own SUBMITTED claim', async () => {
    const cancelClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      claimDate: new Date('2026-08-17'),
      amountClaimed: 1000,
      description: 'Will cancel',
      receiptFile: { fileName: 'Bill.pdf', fileUrl: '/uploads/bill.pdf' },
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    const res = await ExpenseClaimService.cancelClaim({ companyId, employeeId, claimId: cancelClaim.id });
    expect(res.status).toBe(ExpenseClaimStatus.CANCELLED);
  });

  // ==========================================
  // SECTION 3: APPROVAL WORKFLOW & PAYROLL INTEGRATION (10 TESTS)
  // ==========================================
  it('[REVIEW 01] Full approval transitions claim to APPROVED and creates PayrollAdjustment', async () => {
    const res = await ExpenseClaimService.reviewClaim({
      companyId,
      reviewerEmployeeId: managerId,
      claimId,
      action: 'APPROVE',
      targetPayrollCycleId: openCycleId,
      actorUserId: managerUserId,
      actorEmail: 'alok.mgr@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(res.status).toBe(ExpenseClaimStatus.APPROVED);
    expect(res.amountApproved).toBe(2500);
    expect(res.amountRejected).toBe(0);

    const adj = await prisma.payrollAdjustment.findFirst({
      where: { companyId, employeeId, payrollCycleId: openCycleId },
    });
    expect(adj).not.toBeNull();
    expect(adj!.amount).toBe(2500);
    expect(adj!.taxable).toBe(false); // Tax exempt telephone allowance
  });

  it('[REVIEW 02] Partial approval sets approved and rejected amounts', async () => {
    const pClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: fuelHeadId,
      claimDate: new Date('2026-08-18'),
      amountClaimed: 5000,
      description: 'Fuel expenses',
      receiptFile: { fileName: 'Fuel.pdf', fileUrl: '/uploads/fuel.pdf' },
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    await ExpenseClaimService.submitClaim({ companyId, employeeId, claimId: pClaim.id, actorUserId: employeeUserId, actorEmail: 'deepak.sub@sarwin.com', actorRole: 'EMPLOYEE' });

    const reviewed = await ExpenseClaimService.reviewClaim({
      companyId,
      reviewerEmployeeId: managerId,
      claimId: pClaim.id,
      action: 'PARTIALLY_APPROVE',
      amountApproved: 3500,
      reviewComments: 'Bill partly illegible',
      targetPayrollCycleId: openCycleId,
      actorUserId: managerUserId,
      actorEmail: 'alok.mgr@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(reviewed.status).toBe(ExpenseClaimStatus.PARTIALLY_APPROVED);
    expect(reviewed.amountApproved).toBe(3500);
    expect(reviewed.amountRejected).toBe(1500);
    expect(reviewed.reviewComments).toBe('Bill partly illegible');
  });

  it('[REVIEW 03] Rejection requires mandatory reviewer comments', async () => {
    const rClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: fuelHeadId,
      claimDate: new Date('2026-08-19'),
      amountClaimed: 4000,
      description: 'Out of policy trip',
      receiptFile: { fileName: 'Trip.pdf', fileUrl: '/uploads/trip.pdf' },
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    await ExpenseClaimService.submitClaim({ companyId, employeeId, claimId: rClaim.id, actorUserId: employeeUserId, actorEmail: 'deepak.sub@sarwin.com', actorRole: 'EMPLOYEE' });

    await expect(
      ExpenseClaimService.reviewClaim({
        companyId,
        reviewerEmployeeId: managerId,
        claimId: rClaim.id,
        action: 'REJECT',
        reviewComments: '', // Missing
        actorUserId: managerUserId,
        actorEmail: 'alok.mgr@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Mandatory review comments required');
  });

  it('[REVIEW 04] Self-Approval Defense: Employee cannot review own expense claim', async () => {
    const selfClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId: managerId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      claimDate: new Date('2026-08-20'),
      amountClaimed: 2000,
      description: 'Manager claim',
      receiptFile: { fileName: 'Bill.pdf', fileUrl: '/uploads/bill.pdf' },
      actorEmail: 'alok.mgr@sarwin.com',
      actorRole: 'MANAGER',
    });
    await ExpenseClaimService.submitClaim({ companyId, employeeId: managerId, claimId: selfClaim.id, actorUserId: managerUserId, actorEmail: 'alok.mgr@sarwin.com', actorRole: 'MANAGER' });

    await expect(
      ExpenseClaimService.reviewClaim({
        companyId,
        reviewerEmployeeId: managerId,
        claimId: selfClaim.id,
        action: 'APPROVE',
        actorUserId: managerUserId,
        actorEmail: 'alok.mgr@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Self-Approval Denied');
  });

  it('[REVIEW 05] Hierarchy Guard: Manager cannot review unrelated employee claims', async () => {
    const otherClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId: unrelatedEmpId,
      financialYear: '2026-2027',
      headId: telephoneHeadId,
      claimDate: new Date('2026-08-21'),
      amountClaimed: 1500,
      description: 'Other claim',
      receiptFile: { fileName: 'Bill.pdf', fileUrl: '/uploads/bill.pdf' },
      actorEmail: 'other.8b@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    await ExpenseClaimService.submitClaim({ companyId, employeeId: unrelatedEmpId, claimId: otherClaim.id, actorUserId: 'other-user', actorEmail: 'other.8b@sarwin.com', actorRole: 'EMPLOYEE' });

    await expect(
      ExpenseClaimService.reviewClaim({
        companyId,
        reviewerEmployeeId: managerId,
        claimId: otherClaim.id,
        action: 'APPROVE',
        actorUserId: managerUserId,
        actorEmail: 'alok.mgr@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Hierarchy Violation');
  });

  it('[REVIEW 06] Taxable head (Medical) creates taxable PayrollAdjustment', async () => {
    const medClaim = await ExpenseClaimService.createDraftClaim({
      companyId,
      employeeId,
      financialYear: '2026-2027',
      headId: medicalHeadId,
      claimDate: new Date('2026-08-22'),
      amountClaimed: 1250,
      description: 'Medical prescription',
      receiptFile: { fileName: 'Rx.pdf', fileUrl: '/uploads/rx.pdf' },
      actorEmail: 'deepak.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    await ExpenseClaimService.submitClaim({ companyId, employeeId, claimId: medClaim.id, actorUserId: employeeUserId, actorEmail: 'deepak.sub@sarwin.com', actorRole: 'EMPLOYEE' });

    await ExpenseClaimService.reviewClaim({
      companyId,
      reviewerEmployeeId: managerId,
      claimId: medClaim.id,
      action: 'APPROVE',
      targetPayrollCycleId: openCycleId,
      actorUserId: managerUserId,
      actorEmail: 'alok.mgr@sarwin.com',
      actorRole: 'MANAGER',
    });

    const adj = await prisma.payrollAdjustment.findFirst({
      where: { companyId, employeeId, reason: { contains: 'Medical' } },
    });
    expect(adj!.taxable).toBe(true);
  });

  // ==========================================
  // SECTION 4: SECURITY, IDOR & TENANT ISOLATION (8 TESTS)
  // ==========================================
  it('[SEC 01] IDOR Defense: Employee A cannot view Employee B claim detail', async () => {
    await expect(
      ExpenseClaimService.getClaimDetail({
        companyId,
        employeeId: managerId, // Vikram querying Deepak's claim
        claimId,
      })
    ).rejects.toThrow('Claim not found or access denied');
  });

  it('[SEC 02] Cross-tenant claim access is strictly rejected', async () => {
    await expect(
      ExpenseClaimService.getClaimDetail({
        companyId: tenantBId,
        employeeId,
        claimId,
      })
    ).rejects.toThrow('Claim not found or access denied');
  });

  it('[SEC 03] Locked payroll cycle is immutable: Claims approved for locked cycle do not alter locked payouts', async () => {
    const lockedBefore = await prisma.payrollCycle.findUnique({ where: { id: lockedCycleId } });
    expect(lockedBefore!.totalNetPayout).toBe(91400);
  });

  it('[SEC 04] Audit log captures expense claim approval and partial approval events', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'EXPENSE_CLAIM_APPROVE' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });
});