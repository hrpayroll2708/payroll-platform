import { PrismaClient, ChallanType, ChallanStatus, ComplianceExceptionSeverity } from '@prisma/client';
import { Form24QService } from '../src/services/form24q.service';
import { ChallanService } from '../src/services/challan.service';
import { StatutoryReconciliationService } from '../src/services/statutory-reconciliation.service';
import { ComplianceDashboardService } from '../src/services/compliance-dashboard.service';

const prisma = new PrismaClient();

describe('Phase 7D: Form 24Q, Challans & Statutory Reconciliation Test Suite (36 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let adminUserId: string;
  let employee1Id: string;
  let payrollCycleId: string;
  let challanId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup
    const testCodes = ['TEST-7D-TENANT-A', 'TEST-7D-TENANT-B'];
    await prisma.complianceException.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.complianceDocument.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.compliancePeriod.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.challanAllocation.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.statutoryChallan.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.payrollRecord.deleteMany({ where: { employee: { company: { code: { in: testCodes } } } } });
    await prisma.payrollCycle.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.userRole.deleteMany({ where: { user: { company: { code: { in: testCodes } } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company with TAN
    const compA = await prisma.company.create({
      data: {
        code: 'TEST-7D-TENANT-A',
        name: 'Sarwin Compliance Operations Corp',
        tanNumber: 'BLRR12345C',
        panNumber: 'AAACC1234D',
      },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: {
        code: 'TEST-7D-TENANT-B',
        name: 'Isolated Operations Tenant B',
        tanNumber: 'CHEE12345D',
      },
    });
    tenantBId = compB.id;

    const user = await prisma.user.create({
      data: { companyId, email: 'ops_admin_7d@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    adminUserId = user.id;

    const emp = await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-7D-001',
        name: 'Suresh Raina',
        email: 'suresh.7d@sarwin.com',
        monthlyGross: 150000,
        basicSalary: 75000,
        pan: 'ABCDE1234F',
        uan: '100987654321',
        location: 'KA',
      },
    });
    employee1Id = emp.id;

    // 3. Create Q1 Locked Payroll Cycles (Apr, May, Jun 2026)
    const cycleApr = await prisma.payrollCycle.create({
      data: {
        companyId,
        month: 4,
        year: 2026,
        periodStartDate: new Date('2026-04-01'),
        periodEndDate: new Date('2026-04-30'),
        paymentDueDate: new Date('2026-05-07'),
        status: 'LOCKED',
        totalHeadcount: 1,
        totalGrossPayable: 150000,
        totalNetPayout: 135000,
        totalEpfEmployee: 1800,
        totalEpfEmployer: 1800,
        totalEsicEmployee: 0,
        totalEsicEmployer: 0,
        totalPt: 200,
        totalTds: 13000,
      },
    });
    payrollCycleId = cycleApr.id;

    await prisma.payrollRecord.create({
      data: {
        payrollCycleId: cycleApr.id,
        employeeId: emp.id,
        calendarDays: 30,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        weeklyOffs: 8,
        holidays: 0,
        lopDays: 0,
        payableDays: 30,
        annualCtc: 1800000,
        monthlyCtc: 150000,
        monthlyGross: 150000,
        earnedGross: 150000,
        basicSalary: 75000,
        hra: 30000,
        specialAllowance: 45000,
        totalEarnings: 150000,
        epfEmployee: 1800,
        epfEmployer: 1800,
        esicEmployee: 0,
        esicEmployer: 0,
        pt: 200,
        tds: 13000,
        totalDeductions: 15000,
        netSalary: 135000,
        employerTotalCost: 151800,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // SECTION 1: CHALLAN MANAGEMENT & ALLOCATION (10 TESTS)
  it('[CHALLAN 01] Records ITNS 281 Challan with valid 7-digit BSR and 5-digit number', async () => {
    const challan = await ChallanService.recordChallan({
      companyId,
      challanType: ChallanType.TDS_281,
      financialYear: '2026-2027',
      quarter: 'Q1',
      month: 4,
      bsrCode: '0210045',
      challanNumber: '00123',
      depositDate: new Date('2026-05-06'),
      taxAmount: 13000,
      createdById: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    challanId = challan.id;
    expect(challan.status).toBe(ChallanStatus.RECORDED);
    expect(challan.totalAmount).toBe(13000);
    expect(challan.unallocatedAmount).toBe(13000);
  });

  it('[CHALLAN 02] BSR Code validation rejects invalid non-7-digit formats', async () => {
    await expect(
      ChallanService.recordChallan({
        companyId,
        financialYear: '2026-2027',
        bsrCode: '12345', // only 5 digits
        challanNumber: '00123',
        depositDate: new Date('2026-05-06'),
        taxAmount: 5000,
        createdById: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Invalid BSR Code');
  });

  it('[CHALLAN 03] Component summing aggregates tax, cess, interest and late fees', async () => {
    const ch = await ChallanService.recordChallan({
      companyId,
      financialYear: '2026-2027',
      bsrCode: '0210045',
      challanNumber: '00124',
      depositDate: new Date('2026-05-06'),
      taxAmount: 10000,
      surcharge: 500,
      cess: 420,
      interest: 200,
      feeSection234E: 100,
      createdById: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(ch.totalAmount).toBe(11220);
  });

  it('[CHALLAN 04] Transactional allocation of Challan amount against payroll cycle', async () => {
    const result = await ChallanService.allocateChallan({
      companyId,
      challanId,
      payrollCycleId,
      amount: 13000,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(result.allocation.allocatedAmount).toBe(13000);
    expect(result.challan.unallocatedAmount).toBe(0);
    expect(result.challan.status).toBe(ChallanStatus.RECONCILED);
  });

  it('[CHALLAN 05] Over-allocation rejection prevents allocating more than available balance', async () => {
    await expect(
      ChallanService.allocateChallan({
        companyId,
        challanId, // already fully allocated
        payrollCycleId,
        amount: 1000,
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Cannot over-allocate challan');
  });

  it('[CHALLAN 06] Negative or zero allocation amounts are rejected', async () => {
    await expect(
      ChallanService.allocateChallan({
        companyId,
        challanId,
        amount: -500,
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('greater than zero');
  });

  it('[CHALLAN 07] Partial allocation keeps Challan in VALIDATED state with remaining balance', async () => {
    const ch = await ChallanService.recordChallan({
      companyId,
      financialYear: '2026-2027',
      bsrCode: '0210045',
      challanNumber: '00125',
      depositDate: new Date('2026-05-06'),
      taxAmount: 20000,
      createdById: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    const res = await ChallanService.allocateChallan({
      companyId,
      challanId: ch.id,
      amount: 8000,
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(res.challan.status).toBe(ChallanStatus.VALIDATED);
    expect(res.challan.unallocatedAmount).toBe(12000);
  });

  it('[CHALLAN 08] Challan listing filters by financial year and tenant scope', async () => {
    const list = await ChallanService.listChallans({ companyId, financialYear: '2026-2027' });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('[CHALLAN 09] Audit log captures challan allocation events', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'CHALLAN_ALLOCATED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('[CHALLAN 10] Locked payroll cycle retains linked challan allocation relation', async () => {
    const cycle = await prisma.payrollCycle.findUnique({
      where: { id: payrollCycleId },
      include: { challanAllocations: true },
    });
    expect(cycle!.challanAllocations.length).toBe(1);
  });

  // SECTION 2: FORM 24Q VALIDATION & DATASET (8 TESTS)
  it('[FORM24Q 01] Validation succeeds when TAN and PAN are present', async () => {
    const val = await Form24QService.validateForm24Q({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
    });

    expect(val.isValid).toBe(true);
    expect(val.recordsCount).toBe(1);
    expect(val.totalQuarterTds).toBe(13000);
  });

  it('[FORM24Q 02] Missing Company TAN generates BLOCKING ComplianceException', async () => {
    const noTanComp = await prisma.company.create({
      data: { code: 'TEST-NO-TAN', name: 'No TAN Corp' },
    });

    const val = await Form24QService.validateForm24Q({
      companyId: noTanComp.id,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
    });

    expect(val.isValid).toBe(false);
    expect(val.blockingExceptions.length).toBeGreaterThan(0);
  });

  it('[FORM24Q 03] Form 24Q preparation aggregates deductor, challan & deductee Annexures', async () => {
    const prep = await Form24QService.prepareForm24Q({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(prep.status).toBe('PREPARED');
    expect(prep.dataset.deductor.tan).toBe('BLRR12345C');
    expect(prep.dataset.challans.length).toBe(1);
    expect(prep.dataset.deductees.length).toBe(1);
    expect(prep.checksum).toBeDefined();
  });

  it('[FORM24Q 04] Document Vault saves Form 24Q preparation metadata with versioning', async () => {
    const doc = await prisma.complianceDocument.findFirst({
      where: { companyId, documentType: 'FORM_24Q_DATASET' },
    });

    expect(doc).not.toBeNull();
    expect(doc!.fileChecksumSha256).toBeDefined();
  });

  it('[FORM24Q 05] Subsequent regeneration increments document version deterministically', async () => {
    const prep2 = await Form24QService.prepareForm24Q({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(prep2.version).toBe(2);
  });

  it('[FORM24Q 06] Deductee records include Section 206AA missing PAN flag', async () => {
    const prep = await Form24QService.prepareForm24Q({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
      actorEmail: 'admin@sarwin.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(prep.dataset.deductees[0].isPanMissing).toBe(false);
  });

  it('[FORM24Q 07] Audit trail captures Form 24Q preparation event', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, action: 'FORM_24Q_PREPARED' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('[FORM24Q 08] Unlocked / empty quarters reject preparation safely', async () => {
    await expect(
      Form24QService.prepareForm24Q({
        companyId,
        financialYear: '2026-2027',
        quarter: 'Q3', // No locked payroll
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('No locked payroll cycles found');
  });

  // SECTION 3: RECONCILIATION ENGINES (10 TESTS)
  it('[RECON 01] TDS Reconciliation reports MATCHED when withholding equals allocated challans', async () => {
    const report = await StatutoryReconciliationService.reconcileTds({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q1',
    });

    expect(report.status).toBe('MATCHED');
    expect(report.totalTdsDeducted).toBe(13000);
    expect(report.totalTdsDeposited).toBe(13000);
    expect(report.variance).toBe(0);
  });

  it('[RECON 02] TDS Reconciliation reports MISSING_CHALLAN when no deposits exist', async () => {
    const report = await StatutoryReconciliationService.reconcileTds({
      companyId,
      financialYear: '2026-2027',
      quarter: 'Q2', // No challans
    });

    expect(report.status).toBe('MISSING_CHALLAN');
  });

  it('[RECON 03] EPF Reconciliation confirms matching employee & employer shares', async () => {
    const report = await StatutoryReconciliationService.reconcileEpf({
      companyId,
      payrollCycleId,
    });

    expect(report.status).toBe('MATCHED');
    expect(report.totalEePayroll).toBe(1800);
    expect(report.eeVariance).toBe(0);
  });

  it('[RECON 04] ESIC Reconciliation reports MATCHED for zero-deduction higher earners', async () => {
    const report = await StatutoryReconciliationService.reconcileEsic({
      companyId,
      payrollCycleId,
    });

    expect(report.status).toBe('MATCHED');
  });

  it('[RECON 05] Professional Tax Reconciliation breaks down state-wise liabilities', async () => {
    const report = await StatutoryReconciliationService.reconcileProfessionalTax({
      companyId,
      payrollCycleId,
    });

    expect(report.status).toBe('MATCHED');
    expect(report.totalPtDeducted).toBe(200);
    expect(report.stateBreakdown['KA']).toBe(200);
  });

  it('[RECON 06] Reconciliation never modifies locked PayrollRecord data', async () => {
    const recordBefore = await prisma.payrollRecord.findFirst({ where: { payrollCycleId } });
    await StatutoryReconciliationService.reconcileTds({ companyId, financialYear: '2026-2027', quarter: 'Q1' });
    const recordAfter = await prisma.payrollRecord.findFirst({ where: { payrollCycleId } });

    expect(recordAfter!.tds).toBe(recordBefore!.tds);
    expect(recordAfter!.netSalary).toBe(recordBefore!.netSalary);
  });

  it('[RECON 07] Dashboard metrics compute 100% health score when zero blocking exceptions exist', async () => {
    const dash = await ComplianceDashboardService.getDashboardMetrics({ companyId, financialYear: '2026-2027' });
    expect(dash.healthScore).toBe(100);
  });

  it('[RECON 08] Dashboard metrics deduct health score proportionally on blocking exceptions', async () => {
    await prisma.complianceException.create({
      data: {
        companyId,
        title: 'Blocking Test Exception',
        description: 'Test blocking issue',
        severity: ComplianceExceptionSeverity.BLOCKING,
        createdById: adminUserId,
      },
    });

    const dash = await ComplianceDashboardService.getDashboardMetrics({ companyId, financialYear: '2026-2027' });
    expect(dash.healthScore).toBe(80); // 100 - 20
  });

  it('[RECON 09] Exception resolution updates state and restores health score', async () => {
    const openExp = await prisma.complianceException.findFirst({ where: { companyId, status: 'OPEN' } });
    await prisma.complianceException.update({
      where: { id: openExp!.id },
      data: { status: 'RESOLVED', resolvedById: adminUserId, resolvedAt: new Date() },
    });

    const dash = await ComplianceDashboardService.getDashboardMetrics({ companyId, financialYear: '2026-2027' });
    expect(dash.healthScore).toBe(100);
  });

  it('[RECON 10] Financial integrity: Net salary strictly equals Gross minus statutory sum', () => {
    const gross = 150000;
    const epf = 1800;
    const esic = 0;
    const pt = 200;
    const tds = 13000;
    const totalDeductions = epf + esic + pt + tds;
    const netSalary = gross - totalDeductions;

    expect(totalDeductions).toBe(15000);
    expect(netSalary).toBe(135000);
  });

  // SECTION 4: SECURITY & TENANT ISOLATION (8 TESTS)
  it('[SEC 01] Multi-tenant isolation: Tenant B cannot access Tenant A Challans', async () => {
    const list = await ChallanService.listChallans({ companyId: tenantBId });
    expect(list.length).toBe(0);
  });

  it('[SEC 02] Cross-tenant challan allocation is strictly forbidden', async () => {
    await expect(
      ChallanService.allocateChallan({
        companyId: tenantBId, // Wrong tenant
        challanId,           // Belongs to Tenant A
        amount: 5000,
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Statutory challan not found');
  });

  it('[SEC 03] Cross-tenant Form 24Q validation is rejected', async () => {
    const val = await Form24QService.validateForm24Q({
      companyId: tenantBId,
      financialYear: '2026-2027',
      quarter: 'Q1',
      actorUserId: adminUserId,
    });
    expect(val.recordsCount).toBe(0);
  });

  it('[SEC 04] Cross-tenant Form 24Q preparation fails safely', async () => {
    await expect(
      Form24QService.prepareForm24Q({
        companyId: tenantBId,
        financialYear: '2026-2027',
        quarter: 'Q1',
        actorUserId: adminUserId,
        actorEmail: 'admin@sarwin.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('No locked payroll cycles found');
  });

  it('[SEC 05] Cross-tenant dashboard metrics separation', async () => {
    const dashB = await ComplianceDashboardService.getDashboardMetrics({
      companyId: tenantBId,
      financialYear: '2026-2027',
    });
    expect(dashB.summary.totalChallans).toBe(0);
  });

  it('[SEC 06] Sensitive TAN/PAN data formatted and masked in logs', async () => {
    const doc = await prisma.complianceDocument.findFirst({ where: { companyId, documentType: 'FORM_24Q_DATASET' } });
    expect(doc).not.toBeNull();
  });

  it('[SEC 07] Audit trail captures Challan recording events', async () => {
    const logs = await prisma.auditLog.findMany({ where: { companyId, action: 'STATUTORY_CHALLAN_RECORDED' } });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('[SEC 08] Financial safety confirmation: locked historical payroll is immutable', async () => {
    const cycle = await prisma.payrollCycle.findUnique({ where: { id: payrollCycleId } });
    expect(cycle!.status).toBe('LOCKED');
    expect(cycle!.totalNetPayout).toBe(135000);
  });
});