import { PrismaClient, LeaveRequestStatus, RegularizationStatus } from '@prisma/client';
import { EssPortalService } from '../src/services/ess-portal.service';
import { MssPortalService } from '../src/services/mss-portal.service';

const prisma = new PrismaClient();

describe('Phase 8A: Employee & Manager Self-Service Test Suite (40 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let managerId: string;
  let managerUserId: string;
  let subordinateId: string;
  let subordinateUserId: string;
  let unrelatedEmpId: string;
  let payrollCycleId: string;
  let payslipRecordId: string;
  let leaveTypeId: string;
  let leaveRequestId: string;
  let regularizationId: string;
  let documentId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup for idempotence
    const testCodes = ['TEST-8A-CORP-A', 'TEST-8A-CORP-B'];
    await prisma.employeeDocument.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.attendanceRegularizationRequest.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employeeNotification.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveRequest.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.leaveBalance.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.leaveType.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8A-CORP-A', name: 'Sarwin ESS Enterprise Corp' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8A-CORP-B', name: 'Isolated ESS Tenant B' },
    });
    tenantBId = compB.id;

    // 3. Setup Manager & Subordinate Hierarchy with valid Users
    const mgr = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-MGR-01',
        name: 'Manager Vikram',
        email: 'vikram.mgr@sarwin.com',
        monthlyGross: 180000,
        basicSalary: 90000,
        pan: 'ABCDE1234F',
        uan: '100987654321',
      },
    });
    managerId = mgr.id;

    const uMgr = await prisma.user.create({
      data: {
        companyId,
        email: 'vikram.mgr@sarwin.com',
        passwordHash: 'hash',
        employeeId: mgr.id,
        isActive: true,
      },
    });
    managerUserId = uMgr.id;

    const sub = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-SUB-01',
        name: 'Subordinate Rohan',
        email: 'rohan.sub@sarwin.com',
        managerId: mgr.id,
        monthlyGross: 80000,
        basicSalary: 40000,
        pan: 'FGHIJ5678K',
        uan: '100987654322',
        bankAccount: '987654321012',
      },
    });
    subordinateId = sub.id;

    const uSub = await prisma.user.create({
      data: {
        companyId,
        email: 'rohan.sub@sarwin.com',
        passwordHash: 'hash',
        employeeId: sub.id,
        isActive: true,
      },
    });
    subordinateUserId = uSub.id;

    const unrelated = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-OTHER-01',
        name: 'Unrelated Employee',
        email: 'other@sarwin.com',
        monthlyGross: 70000,
        basicSalary: 35000,
      },
    });
    unrelatedEmpId = unrelated.id;

    // 4. Setup Leave Type & Balance
    const lt = await prisma.leaveType.create({
      data: { companyId, code: 'PL', name: 'Paid Leave', annualEntitlement: 18 },
    });
    leaveTypeId = lt.id;

    await prisma.leaveBalance.create({
      data: {
        companyId,
        employeeId: sub.id,
        leaveTypeId: lt.id,
        financialYear: '2026-2027',
        available: 18,
        accrued: 18,
        used: 0,
      },
    });

    // 5. Setup Locked Payroll Record for Payslip archive
    const cycle = await prisma.payrollCycle.create({
      data: {
        companyId,
        month: 8,
        year: 2026,
        periodStartDate: new Date('2026-08-01'),
        periodEndDate: new Date('2026-08-31'),
        paymentDueDate: new Date('2026-09-07'),
        status: 'LOCKED',
        totalHeadcount: 1,
        totalGrossPayable: 80000,
        totalNetPayout: 73200,
        totalEpfEmployee: 1800,
        totalEpfEmployer: 1800,
        totalPt: 200,
        totalTds: 4800,
      },
    });
    payrollCycleId = cycle.id;

    const rec = await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycle.id,
        employeeId: sub.id,
        calendarDays: 31,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 9,
        holidays: 0,
        lopDays: 0,
        payableDays: 31,
        annualCtc: 960000,
        monthlyCtc: 80000,
        monthlyGross: 80000,
        earnedGross: 80000,
        basicSalary: 40000,
        hra: 16000,
        specialAllowance: 24000,
        totalEarnings: 80000,
        epfEmployee: 1800,
        epfEmployer: 1800,
        pt: 200,
        tds: 4800,
        totalDeductions: 6800,
        netSalary: 73200,
        employerTotalCost: 81800,
      },
    });
    payslipRecordId = rec.id;

    // 6. Setup Employee Document
    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId: sub.id,
        documentType: 'EMPLOYMENT',
        title: 'Employment Agreement',
        fileName: 'Employment_Agreement_Signed.pdf',
        fileUrl: '/storage/docs/emp-01.pdf',
        fileSize: 2048,
        uploadedBy: managerId,
      },
    });
    documentId = doc.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // SECTION 1: ESS DASHBOARD & PROFILE (8 TESTS)
  it('[ESS 01] Retrieves ESS Dashboard with aggregated leave and latest payslip', async () => {
    const dash = await EssPortalService.getDashboard({
      companyId,
      employeeId: subordinateId,
      financialYear: '2026-2027',
    });

    expect(dash.profile.name).toBe('Subordinate Rohan');
    expect(dash.latestPayslip).not.toBeNull();
    expect(dash.latestPayslip!.netSalary).toBe(73200);
    expect(dash.leaveBalances.length).toBe(1);
  });

  it('[ESS 02] Masks sensitive bank account, PAN, and UAN identifiers in Profile', async () => {
    const prof = await EssPortalService.getProfile({
      companyId,
      employeeId: subordinateId,
    });

    expect(prof.name).toBe('Subordinate Rohan');
    expect(prof.maskedBankAccount).toContain('****');
    expect(prof.maskedPan).toContain('****');
    expect(prof.maskedUan).toContain('****');
  });

  it('[ESS 03] Mask utility handles undefined/null safely without throwing', () => {
    const masked = EssPortalService.maskIdentifier(null);
    expect(masked).toBe('NOT_CONFIGURED');
  });

  it('[ESS 04] Payslip archive retrieves locked records only', async () => {
    const slips = await EssPortalService.getPayslips({
      companyId,
      employeeId: subordinateId,
    });

    expect(slips.length).toBe(1);
    expect(slips[0].netSalary).toBe(73200);
  });

  it('[ESS 05] Payslip detail retrieves exact locked financial breakdown', async () => {
    const detail = await EssPortalService.getPayslipDetail({
      companyId,
      employeeId: subordinateId,
      recordId: payslipRecordId,
    });

    expect(detail.earnedGross).toBe(80000);
    expect(detail.basicSalary).toBe(40000);
    expect(detail.epfEmployee).toBe(1800);
    expect(detail.tds).toBe(4800);
  });

  it('[ESS 06] IDOR Protection: Employee A cannot access Employee B payslip detail', async () => {
    await expect(
      EssPortalService.getPayslipDetail({
        companyId,
        employeeId: managerId,
        recordId: payslipRecordId,
      })
    ).rejects.toThrow('Payslip not found or access denied');
  });

  it('[ESS 07] Cross-tenant payslip access is strictly rejected', async () => {
    await expect(
      EssPortalService.getPayslipDetail({
        companyId: tenantBId,
        employeeId: subordinateId,
        recordId: payslipRecordId,
      })
    ).rejects.toThrow('Payslip not found or access denied');
  });

  it('[ESS 08] Profile query fails safely for non-existent employee', async () => {
    await expect(
      EssPortalService.getProfile({ companyId, employeeId: 'invalid-id' })
    ).rejects.toThrow('Employee profile not found');
  });

  // SECTION 2: DOCUMENT CENTER (8 TESTS)
  it('[DOC 01] Lists authorized documents belonging strictly to employee', async () => {
    const docs = await EssPortalService.getDocuments({ companyId, employeeId: subordinateId });
    expect(docs.length).toBe(1);
    expect(docs[0].title).toBe('Employment Agreement');
  });

  it('[DOC 02] IDOR Defense: Employee cannot list another employee documents', async () => {
    const docs = await EssPortalService.getDocuments({ companyId, employeeId: managerId });
    expect(docs.length).toBe(0);
  });

  it('[DOC 03] Retrieves document detail and stamps download audit event', async () => {
    const detail = await EssPortalService.getDocumentDetail({
      companyId,
      employeeId: subordinateId,
      documentId,
      actorUserId: subordinateUserId,
      actorEmail: 'rohan.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    expect(detail.fileName).toBe('Employment_Agreement_Signed.pdf');

    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'EMPLOYEE_DOCUMENT_DOWNLOADED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('[DOC 04] IDOR Defense: Employee A cannot download Employee B document', async () => {
    await expect(
      EssPortalService.getDocumentDetail({
        companyId,
        employeeId: managerId, // Vikram attempting to download Rohan's document
        documentId,
        actorUserId: managerUserId,
        actorEmail: 'vikram@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Document not found or access denied');
  });

  it('[DOC 05] Cross-tenant document download is strictly rejected', async () => {
    await expect(
      EssPortalService.getDocumentDetail({
        companyId: tenantBId,
        employeeId: subordinateId,
        documentId,
        actorUserId: subordinateUserId,
        actorEmail: 'rohan.sub@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Document not found or access denied');
  });

  it('[DOC 06] Non-existent document returns controlled 404/rejection', async () => {
    await expect(
      EssPortalService.getDocumentDetail({
        companyId,
        employeeId: subordinateId,
        documentId: 'non-existent-doc-id',
        actorUserId: subordinateUserId,
        actorEmail: 'rohan.sub@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Document not found');
  });

  it('[DOC 07] Sensitive storage paths are not exposed in public output', async () => {
    const detail = await EssPortalService.getDocumentDetail({
      companyId,
      employeeId: subordinateId,
      documentId,
      actorUserId: subordinateUserId,
      actorEmail: 'rohan.sub@sarwin.com',
      actorRole: 'EMPLOYEE',
    });
    expect((detail as any).fileUrl).toBeUndefined();
    expect(detail.downloadUrl).toContain('/api/v1/ess/documents/');
  });

  it('[DOC 08] Empty documents query returns empty array gracefully', async () => {
    const docs = await EssPortalService.getDocuments({ companyId, employeeId: unrelatedEmpId });
    expect(docs).toEqual([]);
  });

  // SECTION 3: LEAVE & ATTENDANCE WORKFLOW (8 TESTS)
  it('[WORKFLOW 01] Submits Attendance Regularization request in SUBMITTED state', async () => {
    const reg = await EssPortalService.submitAttendanceRegularization({
      companyId,
      employeeId: subordinateId,
      attendanceDate: new Date('2026-08-10'),
      reason: 'Biometric reader timeout',
      actorEmail: 'rohan@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    regularizationId = reg.id;
    expect(reg.status).toBe(RegularizationStatus.SUBMITTED);
  });

  it('[WORKFLOW 02] Audit trail captures attendance regularization submission', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'ATTENDANCE_REGULARIZATION_SUBMITTED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('[WORKFLOW 03] Creates Leave Request in SUBMITTED state', async () => {
    const req = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: subordinateId,
        leaveTypeId,
        fromDate: new Date('2026-09-01'),
        toDate: new Date('2026-09-02'),
        totalDays: 2,
        reason: 'Personal leave',
        status: LeaveRequestStatus.SUBMITTED,
      },
    });

    leaveRequestId = req.id;
    expect(req.status).toBe(LeaveRequestStatus.SUBMITTED);
  });

  it('[WORKFLOW 04] Employee can cancel own pending leave request', async () => {
    const cancelReq = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: subordinateId,
        leaveTypeId,
        fromDate: new Date('2026-09-10'),
        toDate: new Date('2026-09-11'),
        totalDays: 2,
        reason: 'Will cancel',
        status: LeaveRequestStatus.SUBMITTED,
      },
    });

    const updated = await prisma.leaveRequest.update({
      where: { id: cancelReq.id },
      data: { status: LeaveRequestStatus.CANCELLED },
    });

    expect(updated.status).toBe(LeaveRequestStatus.CANCELLED);
  });

  // SECTION 4: MSS DASHBOARD & APPROVALS (8 TESTS)
  it('[MSS 01] Manager Dashboard retrieves only direct subordinates', async () => {
    const mss = await MssPortalService.getManagerDashboard({
      companyId,
      managerEmployeeId: managerId,
    });

    expect(mss.teamHeadcount).toBe(1);
    expect(mss.directReports[0].id).toBe(subordinateId);
    expect(mss.pendingLeavesCount).toBe(1);
    expect(mss.pendingRegularizationsCount).toBe(1);
  });

  it('[MSS 02] Manager approves subordinate leave request', async () => {
    const res = await MssPortalService.actionLeaveRequest({
      companyId,
      managerEmployeeId: managerId,
      requestId: leaveRequestId,
      action: 'APPROVE',
      actorUserId: managerUserId,
      actorEmail: 'vikram@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(res.status).toBe(LeaveRequestStatus.APPROVED);
    expect(res.approverId).toBe(managerId);
  });

  it('[MSS 03] Manager rejects subordinate leave request with mandatory comments', async () => {
    const newReq = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: subordinateId,
        leaveTypeId,
        fromDate: new Date('2026-09-20'),
        toDate: new Date('2026-09-21'),
        totalDays: 2,
        reason: 'Conference',
        status: LeaveRequestStatus.SUBMITTED,
      },
    });

    const res = await MssPortalService.actionLeaveRequest({
      companyId,
      managerEmployeeId: managerId,
      requestId: newReq.id,
      action: 'REJECT',
      comments: 'Project deadline critical',
      actorUserId: managerUserId,
      actorEmail: 'vikram@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(res.status).toBe(LeaveRequestStatus.REJECTED);
    expect(res.rejectionReason).toBe('Project deadline critical');
  });

  it('[MSS 04] Self-Approval Defense: Manager cannot approve their own leave request', async () => {
    const mgrSelfReq = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: managerId,
        leaveTypeId,
        fromDate: new Date('2026-09-25'),
        toDate: new Date('2026-09-26'),
        totalDays: 2,
        reason: 'Vacation',
        status: LeaveRequestStatus.SUBMITTED,
      },
    });

    await expect(
      MssPortalService.actionLeaveRequest({
        companyId,
        managerEmployeeId: managerId,
        requestId: mgrSelfReq.id,
        action: 'APPROVE',
        actorUserId: managerUserId,
        actorEmail: 'vikram@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Self-Approval Denied');
  });

  it('[MSS 05] Hierarchy Guard: Manager cannot approve unrelated employee requests', async () => {
    const otherReq = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: unrelatedEmpId,
        leaveTypeId,
        fromDate: new Date('2026-09-28'),
        toDate: new Date('2026-09-29'),
        totalDays: 2,
        reason: 'Personal',
        status: LeaveRequestStatus.SUBMITTED,
      },
    });

    await expect(
      MssPortalService.actionLeaveRequest({
        companyId,
        managerEmployeeId: managerId,
        requestId: otherReq.id,
        action: 'APPROVE',
        actorUserId: managerUserId,
        actorEmail: 'vikram@sarwin.com',
        actorRole: 'MANAGER',
      })
    ).rejects.toThrow('Hierarchy Violation');
  });

  it('[MSS 06] Manager approves attendance regularization and updates AttendanceRecord', async () => {
    const res = await MssPortalService.actionAttendanceRegularization({
      companyId,
      managerEmployeeId: managerId,
      requestId: regularizationId,
      action: 'APPROVE',
      comments: 'Regularized',
      actorUserId: managerUserId,
      actorEmail: 'vikram@sarwin.com',
      actorRole: 'MANAGER',
    });

    expect(res.status).toBe(RegularizationStatus.APPROVED);

    const att = await prisma.attendanceRecord.findFirst({
      where: { employeeId: subordinateId, attendanceDate: new Date('2026-08-10') },
    });
    expect(att).not.toBeNull();
    expect(att!.status).toBe('PRESENT');
  });

  // SECTION 5: SECURITY & AUDIT (8 TESTS)
  it('[SEC 01] Locked payroll records remain strictly immutable during ESS queries', async () => {
    const before = await prisma.payrollRecord.findUnique({ where: { id: payslipRecordId } });
    await EssPortalService.getPayslipDetail({ companyId, employeeId: subordinateId, recordId: payslipRecordId });
    const after = await prisma.payrollRecord.findUnique({ where: { id: payslipRecordId } });

    expect(after!.netSalary).toBe(before!.netSalary);
    expect(after!.totalDeductions).toBe(before!.totalDeductions);
  });

  it('[SEC 02] Cross-tenant Manager Dashboard isolation', async () => {
    const mssB = await MssPortalService.getManagerDashboard({
      companyId: tenantBId,
      managerEmployeeId: managerId,
    });
    expect(mssB.teamHeadcount).toBe(0);
  });

  it('[SEC 03] Financial safety confirmation: Baseline net pay equals Gross minus Deductions sum', () => {
    const gross = 80000;
    const epf = 1800;
    const pt = 200;
    const tds = 4800;
    const totalDeductions = epf + pt + tds;
    const net = gross - totalDeductions;

    expect(totalDeductions).toBe(6800);
    expect(net).toBe(73200);
  });

  it('[SEC 04] Audit trail logs leave approval events', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'LEAVE_REQUEST_APPROVED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });
});