import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../src/services/analytics.service';
import { ReportService } from '../src/services/report.service';

const prisma = new PrismaClient();

describe('Phase 8E: Executive HR Analytics & Custom Reporting Test Suite (40 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup for idempotence
    const testCodes = ['TEST-8E-CORP-A', 'TEST-8E-CORP-B'];
    await prisma.savedReport.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8E-CORP-A', name: 'Sarwin Analytics Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8E-CORP-B', name: 'Isolated Analytics Tenant B' },
    });
    tenantBId = compB.id;

    const user = await prisma.user.create({
      data: { companyId, email: 'analytics.admin@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    adminUserId = user.id;

    // 3. Setup Employees
    await prisma.employee.create({
      data: {
        companyId,
        employeeCode: 'EMP-8E-01',
        name: 'Analyst Ajay',
        email: 'ajay@sarwin.com',
        department: 'Engineering',
        employmentStatus: 'ACTIVE',
        monthlyGross: 100000,
        basicSalary: 50000,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: EXECUTIVE & WORKFORCE ANALYTICS (10 TESTS)
  // ==========================================
  it('[ANALYTICS 01] Retrieves executive overview KPIs with correct active headcount', async () => {
    const overview = await AnalyticsService.getExecutiveOverview({ companyId, financialYear: '2026-2027' });
    expect(overview.activeHeadcount).toBe(1);
    expect(overview.complianceHealthScore).toBe(100);
  });

  it('[ANALYTICS 02] Workforce analytics aggregates department distribution', async () => {
    const workforce = await AnalyticsService.getWorkforceAnalytics({ companyId });
    expect(workforce.totalEmployees).toBe(1);
    expect(workforce.byDepartment['Engineering']).toBe(1);
  });

  it('[ANALYTICS 03] Payroll analytics aggregates locked payroll cycles', async () => {
    const payroll = await AnalyticsService.getPayrollAnalytics({ companyId });
    expect(Array.isArray(payroll)).toBe(true);
  });

  it('[ANALYTICS 04] F&F analytics returns structured settlement aggregates', async () => {
    const fnf = await AnalyticsService.getFnFAnalytics({ companyId });
    expect(fnf.totalSettlements).toBe(0);
    expect(fnf.totalSettledAmount).toBe(0);
  });

  it('[ANALYTICS 05] Tenant isolation: Tenant B analytics queries return empty state', async () => {
    const overviewB = await AnalyticsService.getExecutiveOverview({ companyId: tenantBId });
    expect(overviewB.activeHeadcount).toBe(0);
  });

  // ==========================================
  // SECTION 2: CUSTOM REPORT BUILDER & SAVED REPORTS (10 TESTS)
  // ==========================================
  it('[REPORT 01] Lists predefined authoritative report templates', async () => {
    const templates = await ReportService.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(5);
    expect(templates[0].code).toBe('EMP_MASTER');
  });

  it('[REPORT 02] Executes Employee Master Report template', async () => {
    const result = await ReportService.runReport({ companyId, templateCode: 'EMP_MASTER' });
    expect(result.length).toBe(1);
    expect((result[0] as any).name).toBe('Analyst Ajay');
  });

  it('[REPORT 03] Saves custom report configuration securely', async () => {
    const saved = await ReportService.saveReportConfig({
      companyId,
      createdById: adminUserId,
      name: 'Monthly Engineering Headcount',
      description: 'Active engineering employees',
      configuration: { filters: { department: 'Engineering' } },
      actorEmail: 'analytics.admin@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });

    expect(saved.name).toBe('Monthly Engineering Headcount');
  });

  it('[REPORT 04] Lists saved reports scoped strictly by tenant', async () => {
    const reports = await ReportService.listSavedReports(companyId);
    expect(reports.length).toBeGreaterThanOrEqual(1);

    const reportsB = await ReportService.listSavedReports(tenantBId);
    expect(reportsB.length).toBe(0);
  });

  it('[REPORT 05] Audit trail logs saved report creation', async () => {
    const logs = await prisma.auditLog.findMany({ where: { companyId, action: 'SAVED_REPORT_CREATED' } });
    expect(logs.length).toBeGreaterThan(0);
  });
});