import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { Form24QService } from '../services/form24q.service';
import { ChallanService } from '../services/challan.service';
import { StatutoryReconciliationService } from '../services/statutory-reconciliation.service';
import { ComplianceDashboardService } from '../services/compliance-dashboard.service';
import { ComplianceCalendarService } from '../services/compliance-calendar.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// 1. Form 24Q Validation
router.post('/form24q/validate', requireAuth, requirePermission('FORM24Q_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, quarter } = req.body;
    const result = await Form24QService.validateForm24Q({
      companyId: req.user!.companyId,
      financialYear: financialYear || '2026-2027',
      quarter: quarter || 'Q1',
      actorUserId: req.user!.id,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Validation failed' });
  }
});

// 2. Form 24Q Preparation
router.post('/form24q/prepare', requireAuth, requirePermission('FORM24Q_PREPARE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, quarter } = req.body;
    const result = await Form24QService.prepareForm24Q({
      companyId: req.user!.companyId,
      financialYear: financialYear || '2026-2027',
      quarter: quarter || 'Q1',
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Form 24Q preparation failed' });
  }
});

// 3. Record Challan
router.post('/challans', requireAuth, requirePermission('CHALLAN_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challan = await ChallanService.recordChallan({
      ...req.body,
      companyId: req.user!.companyId,
      createdById: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.status(201).json(challan);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record challan' });
  }
});

// 4. Allocate Challan
router.post('/challans/allocate', requireAuth, requirePermission('CHALLAN_RECONCILE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challanId, payrollCycleId, amount } = req.body;
    const result = await ChallanService.allocateChallan({
      companyId: req.user!.companyId,
      challanId,
      payrollCycleId,
      amount: Number(amount),
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Challan allocation failed' });
  }
});

// 5. List Challans
router.get('/challans', requireAuth, requirePermission('CHALLAN_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, challanType } = req.query;
    const list = await ChallanService.listChallans({
      companyId: req.user!.companyId,
      financialYear: financialYear as string,
      challanType: challanType as any,
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve challans' });
  }
});

// 6. TDS Reconciliation
router.get('/reconciliation/tds', requireAuth, requirePermission('COMPLIANCE_RECONCILE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, quarter } = req.query;
    const report = await StatutoryReconciliationService.reconcileTds({
      companyId: req.user!.companyId,
      financialYear: (financialYear as string) || '2026-2027',
      quarter: (quarter as string) || 'Q1',
    });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'TDS reconciliation failed' });
  }
});

// 7. Dashboard Metrics
router.get('/dashboard', requireAuth, requirePermission('COMPLIANCE_PERIOD_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear } = req.query;
    const metrics = await ComplianceDashboardService.getDashboardMetrics({
      companyId: req.user!.companyId,
      financialYear: (financialYear as string) || '2026-2027',
    });
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Dashboard retrieval failed' });
  }
});

// 8. Compliance Calendar Schedule
router.get('/calendar', requireAuth, requirePermission('COMPLIANCE_PERIOD_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear } = req.query;
    const schedule = await ComplianceCalendarService.getComplianceCalendar({
      companyId: req.user!.companyId,
      financialYear: (financialYear as string) || '2026-2027',
    });
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Calendar retrieval failed' });
  }
});

// 9. Document Vault
router.get('/documents', requireAuth, requirePermission('COMPLIANCE_DOCUMENT_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await prisma.complianceDocument.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Vault retrieval failed' });
  }
});

export default router;