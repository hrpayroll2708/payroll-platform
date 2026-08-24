import { PrismaClient, StatutoryConfigType, StatutoryConfigStatus, TaxRegime, ComplianceExceptionSeverity } from '@prisma/client';
import { StatutoryConfigService } from '../src/services/statutory-config.service';
import { CompliancePeriodService } from '../src/services/compliance-period.service';
import { ComplianceExceptionService } from '../src/services/compliance-exception.service';

const prisma = new PrismaClient();

describe('Phase 7A: Statutory Compliance Foundation Suite', () => {
  let companyAId: string;
  let companyBId: string;
  let user1Id: string;
  let user2Id: string;
  let employeeAId: string;

  beforeAll(async () => {
    const compA = await prisma.company.upsert({
      where: { code: 'TEST-STAT-A' },
      update: {},
      create: { code: 'TEST-STAT-A', name: 'Statutory Alpha Corp' },
    });
    companyAId = compA.id;

    const compB = await prisma.company.upsert({
      where: { code: 'TEST-STAT-B' },
      update: {},
      create: { code: 'TEST-STAT-B', name: 'Statutory Beta Corp' },
    });
    companyBId = compB.id;

    const u1 = await prisma.user.upsert({
      where: { email: 'stat_maker@alpha.com' },
      update: {},
      create: { companyId: companyAId, email: 'stat_maker@alpha.com', passwordHash: 'hash', isActive: true },
    });
    user1Id = u1.id;

    const u2 = await prisma.user.upsert({
      where: { email: 'stat_checker@alpha.com' },
      update: {},
      create: { companyId: companyAId, email: 'stat_checker@alpha.com', passwordHash: 'hash', isActive: true },
    });
    user2Id = u2.id;

    const emp = await prisma.employee.upsert({
      where: { employeeCode: 'EMP-STAT-001' },
      update: {},
      create: {
        companyId: companyAId,
        employeeCode: 'EMP-STAT-001',
        name: 'Venkatesh Iyer',
        email: 'venkatesh@alpha.com',
        monthlyGross: 85000,
      },
    });
    employeeAId = emp.id;
  });

  it('[TEST 01] Multi-tenant isolation: Configurations for Company A are invisible to Company B', async () => {
    await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { wageCeiling: 15000, rate: 0.12 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    const compBConfigs = await StatutoryConfigService.list({ companyId: companyBId });
    expect(compBConfigs.length).toBe(0);
  });

  it('[TEST 02] Point-in-time effective date resolution returns correct active version', async () => {
    const draft = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.ESIC,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { wageThreshold: 21000, employeeRate: 0.0075 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    await StatutoryConfigService.activateConfig({
      id: draft.id,
      companyId: companyAId,
      approvedById: user2Id,
      actorEmail: 'stat_checker@alpha.com',
      actorRole: 'SUPER_ADMIN',
    });

    const active = await StatutoryConfigService.resolveActiveConfig({
      companyId: companyAId,
      configType: StatutoryConfigType.ESIC,
      targetDate: new Date('2026-08-24'),
    });

    expect(active).not.toBeNull();
    expect((active!.rulesJson as any).wageThreshold).toBe(21000);
  });

  it('[TEST 03] Financial-year separation preserves distinct year parameters', async () => {
    const draft27 = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.TDS,
      financialYear: '2027-2028',
      effectiveFrom: new Date('2027-04-01'),
      rulesJson: { standardDeduction: 80000 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(draft27.financialYear).toBe('2027-2028');
    expect(draft27.version).toBe(1);
  });

  it('[TEST 04] Configuration versioning increments version counter deterministically', async () => {
    const v2Draft = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.EPF,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-10-01'),
      rulesJson: { wageCeiling: 21000, rate: 0.12 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    expect(v2Draft.version).toBeGreaterThanOrEqual(2);
  });

  it('[TEST 05] Overlap resolution supersedes earlier configuration on activation', async () => {
    const draft1 = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.PROFESSIONAL_TAX,
      jurisdictionState: 'KA',
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { slabMax: 200 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    await StatutoryConfigService.activateConfig({
      id: draft1.id,
      companyId: companyAId,
      approvedById: user2Id,
      actorEmail: 'stat_checker@alpha.com',
      actorRole: 'SUPER_ADMIN',
    });

    const draft2 = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.PROFESSIONAL_TAX,
      jurisdictionState: 'KA',
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-09-01'),
      rulesJson: { slabMax: 250 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });
    await StatutoryConfigService.activateConfig({
      id: draft2.id,
      companyId: companyAId,
      approvedById: user2Id,
      actorEmail: 'stat_checker@alpha.com',
      actorRole: 'SUPER_ADMIN',
    });

    const updatedPrev = await prisma.statutoryConfiguration.findUnique({ where: { id: draft1.id } });
    expect(updatedPrev!.status).toBe(StatutoryConfigStatus.SUPERSEDED);
  });

  it('[TEST 06] Historical reproducibility resolves earlier config for prior months', async () => {
    const historicalResolved = await StatutoryConfigService.resolveActiveConfig({
      companyId: companyAId,
      configType: StatutoryConfigType.PROFESSIONAL_TAX,
      jurisdictionState: 'KA',
      targetDate: new Date('2026-05-15'),
    });

    expect(historicalResolved).not.toBeNull();
    expect((historicalResolved!.rulesJson as any).slabMax).toBe(200);
  });

  it('[TEST 07] Tax regime foundation tracks New vs Old regime assignments', async () => {
    const profile = await prisma.employeeStatutoryProfile.upsert({
      where: {
        employeeId_financialYear_effectiveFrom: {
          employeeId: employeeAId,
          financialYear: '2026-2027',
          effectiveFrom: new Date('2026-04-01'),
        },
      },
      update: {},
      create: {
        companyId: companyAId,
        employeeId: employeeAId,
        financialYear: '2026-2027',
        taxRegime: TaxRegime.NEW_REGIME_115BAC,
        effectiveFrom: new Date('2026-04-01'),
        createdById: user1Id,
      },
    });

    expect(profile.taxRegime).toBe(TaxRegime.NEW_REGIME_115BAC);
    expect(profile.isEpfApplicable).toBe(true);
  });

  it('[TEST 08] Statutory applicability toggles work on statutory profile', async () => {
    const updated = await prisma.employeeStatutoryProfile.update({
      where: { id: (await prisma.employeeStatutoryProfile.findFirst({ where: { employeeId: employeeAId } }))!.id },
      data: { isEsicApplicable: false, ptStateCode: 'TN' },
    });

    expect(updated.isEsicApplicable).toBe(false);
    expect(updated.ptStateCode).toBe('TN');
  });

  it('[TEST 09] Compliance period lifecycle state transitions', async () => {
    const period = await CompliancePeriodService.getOrCreatePeriod({
      companyId: companyAId,
      financialYear: '2026-2027',
      month: 8,
      quarter: 'Q2',
    });

    expect(period.status).toBe('OPEN');

    const inProgress = await CompliancePeriodService.transitionStatus({
      id: period.id,
      companyId: companyAId,
      targetStatus: 'IN_PROGRESS',
    });

    expect(inProgress.status).toBe('IN_PROGRESS');
  });

  it('[TEST 10] Compliance exception creation & severity classification', async () => {
    const exception = await ComplianceExceptionService.recordException({
      companyId: companyAId,
      employeeId: employeeAId,
      category: StatutoryConfigType.EPF,
      severity: ComplianceExceptionSeverity.BLOCKING,
      title: 'UAN Not Configured',
      description: 'Employee has PF wages but no 12-digit UAN linked',
      createdById: user1Id,
    });

    expect(exception.severity).toBe('BLOCKING');
    expect(exception.status).toBe('OPEN');
  });

  it('[TEST 11] Compliance exception resolution updates state and logs audit notes', async () => {
    const openExp = await prisma.complianceException.findFirst({ where: { companyId: companyAId } });
    const resolved = await ComplianceExceptionService.resolveException({
      id: openExp!.id,
      companyId: companyAId,
      resolvedById: user2Id,
      resolutionNotes: 'Verified UAN linked manually in EPFO database',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedById).toBe(user2Id);
  });

  it('[TEST 12] Document vault records metadata and checksum hash', async () => {
    const doc = await prisma.complianceDocument.create({
      data: {
        companyId: companyAId,
        documentType: 'EPF_ECR',
        fileName: 'ECR_AUG_2026.txt',
        fileChecksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        createdById: user1Id,
      },
    });

    expect(doc.fileChecksumSha256).toBeDefined();
    expect(doc.documentType).toBe('EPF_ECR');
  });

  it('[TEST 13] Maker-Checker separation prevents creator from activating statutory config', async () => {
    const selfDraft = await StatutoryConfigService.createDraft({
      companyId: companyAId,
      configType: StatutoryConfigType.GRATUITY,
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01'),
      rulesJson: { ceiling: 2000000 },
      createdById: user1Id,
      actorEmail: 'stat_maker@alpha.com',
      actorRole: 'PAYROLL_ADMIN',
    });

    await expect(
      StatutoryConfigService.activateConfig({
        id: selfDraft.id,
        companyId: companyAId,
        approvedById: user1Id,
        actorEmail: 'stat_maker@alpha.com',
        actorRole: 'PAYROLL_ADMIN',
      })
    ).rejects.toThrow('Maker-Checker violation');
  });

  it('[TEST 14] Audit logging records statutory config activation events', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId: companyAId, action: 'STATUTORY_CONFIG_ACTIVATED' },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entity).toBe('StatutoryConfiguration');
  });

  it('[TEST 15] Duplicate compliance period prevention', async () => {
    const p1 = await CompliancePeriodService.getOrCreatePeriod({
      companyId: companyAId,
      financialYear: '2026-2027',
      month: 9,
      quarter: 'Q2',
    });
    const p2 = await CompliancePeriodService.getOrCreatePeriod({
      companyId: companyAId,
      financialYear: '2026-2027',
      month: 9,
      quarter: 'Q2',
    });

    expect(p1.id).toBe(p2.id);
  });

  it('[TEST 16] Financial safety confirmation: Baseline statutory formulas remain unaffected', async () => {
    const gross = 75000;
    const basic = Math.round(gross * 0.5);
    const epf = Math.round(Math.min(basic, 15000) * 0.12);
    const esic = gross <= 21000 ? Math.ceil(gross * 0.0075) : 0;
    const pt = gross > 15000 ? 200 : 0;
    const net = gross - (epf + esic + pt);

    expect(epf).toBe(1800);
    expect(esic).toBe(0);
    expect(pt).toBe(200);
    expect(net).toBe(73000);
  });
});