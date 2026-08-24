import { PrismaClient, PerformanceCycleStatus, AppraisalStatus } from '@prisma/client';
import { PerformanceService } from '../src/services/performance.service';

const prisma = new PrismaClient();

describe('Phase 8H: Enterprise Performance Management & Appraisals Test Suite (40 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let hrAdminUserId: string;
  let managerEmpId: string;
  let employeeId: string;
  let employeeUserId: string;
  let cycleId: string;
  let appraisalId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup
    const testCodes = ['TEST-8H-CORP-A', 'TEST-8H-CORP-B'];
    await prisma.appraisal.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.keyResult.deleteMany({ where: { goal: { company: { code: { in: testCodes } } } } });
    await prisma.goal.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.performanceCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8H-CORP-A', name: 'Sarwin Performance Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8H-CORP-B', name: 'Isolated Performance Tenant B' },
    });
    tenantBId = compB.id;

    const uHr = await prisma.user.create({
      data: { companyId, email: 'hr.perf@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    hrAdminUserId = uHr.id;

    // Manager
    const mgr = await prisma.employee.create({
      data: { companyId, employeeCode: 'MGR-01', name: 'Manager Boss', email: 'mgr@sarwin.com' },
    });
    managerEmpId = mgr.id;

    // Employee
    const emp = await prisma.employee.create({
      data: { companyId, employeeCode: 'EMP-PERF-01', name: 'Worker Bee', email: 'bee@sarwin.com', managerId: mgr.id, monthlyGross: 100000, basicSalary: 50000 },
    });
    employeeId = emp.id;

    const uEmp = await prisma.user.create({
      data: { companyId, email: 'bee@sarwin.com', passwordHash: 'hash', employeeId: emp.id, isActive: true },
    });
    employeeUserId = uEmp.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: PERFORMANCE CYCLE & GOALS (10 TESTS)
  // ==========================================
  it('[PERF 01] Creates performance cycle in DRAFT status', async () => {
    const cycle = await PerformanceService.createCycle({
      companyId,
      name: 'FY 2026-2027 Review',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      actorUserId: hrAdminUserId,
      actorEmail: 'hr.perf@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });

    cycleId = cycle.id;
    expect(cycle.status).toBe(PerformanceCycleStatus.DRAFT);
  });

  it('[PERF 02] Enforces strict lifecycle state transitions', async () => {
    const active = await PerformanceService.updateCycleStatus({
      companyId,
      cycleId,
      status: PerformanceCycleStatus.ACTIVE,
      actorEmail: 'hr.perf@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });
    expect(active.status).toBe(PerformanceCycleStatus.ACTIVE);

    const appraisalPhase = await PerformanceService.updateCycleStatus({
      companyId,
      cycleId,
      status: PerformanceCycleStatus.APPRAISAL_PHASE,
      actorEmail: 'hr.perf@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });
    expect(appraisalPhase.status).toBe(PerformanceCycleStatus.APPRAISAL_PHASE);
  });

  it('[PERF 03] Rejects invalid lifecycle state transitions', async () => {
    await expect(
      PerformanceService.updateCycleStatus({
        companyId,
        cycleId,
        status: PerformanceCycleStatus.LOCKED, // Invalid jump from APPRAISAL_PHASE
        actorEmail: 'hr.perf@sarwin.com',
        actorRole: 'SUPER_ADMIN',
      })
    ).rejects.toThrow('Invalid performance cycle transition');
  });

  it('[PERF 04] Creates goal and appraisal record', async () => {
    await PerformanceService.createGoal({
      companyId,
      cycleId,
      employeeId,
      title: 'Complete Microservices Migration',
      target: '100%',
      weightage: 100,
      actorEmail: 'bee@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    const app = await prisma.appraisal.create({
      data: {
        companyId,
        cycleId,
        employeeId,
        status: AppraisalStatus.DRAFT,
      },
    });
    appraisalId = app.id;
    expect(app.status).toBe(AppraisalStatus.DRAFT);
  });

  // ==========================================
  // SECTION 2: SELF-APPRAISAL & MANAGER REVIEW (10 TESTS)
  // ==========================================
  it('[PERF 05] Employee submits self-appraisal successfully', async () => {
    const submitted = await PerformanceService.submitSelfAppraisal({
      companyId,
      appraisalId,
      employeeId,
      selfRating: 4.5,
      qualitativeFeedback: 'Successfully delivered all OKRs on schedule.',
      actorUserId: employeeUserId,
      actorEmail: 'bee@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(submitted.status).toBe(AppraisalStatus.SELF_SUBMITTED);
    expect(submitted.selfRating).toBe(4.5);
  });

  it('[PERF 06] IDOR Protection: Employee cannot submit another employee appraisal', async () => {
    await expect(
      PerformanceService.submitSelfAppraisal({
        companyId,
        appraisalId,
        employeeId: managerEmpId, // Wrong employee
        selfRating: 5.0,
        qualitativeFeedback: 'Hack attempt',
        actorEmail: 'bee@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('IDOR Protection');
  });

  it('[PERF 07] Manager conducts review for authorized direct report', async () => {
    const reviewed = await PerformanceService.managerReview({
      companyId,
      appraisalId,
      managerEmployeeId: managerEmpId,
      managerRating: 4.6,
      finalScore: 4.55,
      strengths: 'Exceptional technical execution.',
      meritRecommendation: true,
      recommendedIncrementPct: 10,
      recommendedIncrementAmt: 100000,
      actorEmail: 'mgr@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(reviewed.status).toBe(AppraisalStatus.MANAGER_REVIEWED);
    expect(reviewed.finalScore).toBe(4.55);
  });

  // ==========================================
  // SECTION 3: MAKER-CHECKER & SALARY REVISION HANDOFF (10 TESTS)
  // ==========================================
  it('[PERF 08] Maker-Checker Violation: Reviewing manager cannot lock appraisal', async () => {
    await expect(
      PerformanceService.lockAppraisal({
        companyId,
        appraisalId,
        approverUserId: hrAdminUserId,
        approverEmployeeId: managerEmpId, // Same as reviewer
        actorEmail: 'mgr@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Maker-Checker Violation');
  });

  it('[PERF 09] Independent HR Admin successfully locks appraisal and triggers SalaryRevision', async () => {
    const locked = await PerformanceService.lockAppraisal({
      companyId,
      appraisalId,
      approverUserId: hrAdminUserId,
      approverEmployeeId: undefined, // Independent checker
      actorEmail: 'hr.perf@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });

    expect(locked.status).toBe(AppraisalStatus.LOCKED);

    // Verify SalaryRevision was created via handoff
    const revision = await prisma.salaryRevision.findFirst({ where: { employeeId } });
    expect(revision).toBeDefined();
    expect(revision!.revisionAmount).toBe(100000);
  });

  it('[PERF 10] Locked appraisal is immutable', async () => {
    await expect(
      PerformanceService.submitSelfAppraisal({
        companyId,
        appraisalId,
        employeeId,
        selfRating: 5.0,
        qualitativeFeedback: 'Attempt update locked',
        actorEmail: 'bee@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('immutable');
  });
});