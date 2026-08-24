import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { AnalyticsService } from '../services/analytics.service';
import { ReportService } from '../services/report.service';

const router = Router();

router.get('/executive', requireAuth, requirePermission('ANALYTICS_EXECUTIVE_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await AnalyticsService.getExecutiveOverview({
      companyId: req.user!.companyId,
      financialYear: req.query.financialYear as string,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load executive analytics' });
  }
});

router.get('/workforce', requireAuth, requirePermission('ANALYTICS_WORKFORCE_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await AnalyticsService.getWorkforceAnalytics({ companyId: req.user!.companyId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load workforce analytics' });
  }
});

router.get('/payroll', requireAuth, requirePermission('ANALYTICS_PAYROLL_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await AnalyticsService.getPayrollAnalytics({ companyId: req.user!.companyId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load payroll analytics' });
  }
});

router.get('/fnf', requireAuth, requirePermission('ANALYTICS_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await AnalyticsService.getFnFAnalytics({ companyId: req.user!.companyId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load F&F analytics' });
  }
});

// Custom Reports
router.get('/reports/templates', requireAuth, requirePermission('REPORT_CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await ReportService.listTemplates();
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load report templates' });
  }
});

router.post('/reports/run', requireAuth, requirePermission('REPORT_CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateCode, financialYear } = req.body;
    const result = await ReportService.runReport({
      companyId: req.user!.companyId,
      templateCode,
      financialYear,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Report execution failed' });
  }
});

router.get('/reports/saved', requireAuth, requirePermission('REPORT_CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await ReportService.listSavedReports(req.user!.companyId);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load saved reports' });
  }
});

router.post('/reports/saved', requireAuth, requirePermission('REPORT_CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, configuration } = req.body;
    const saved = await ReportService.saveReportConfig({
      companyId: req.user!.companyId,
      createdById: req.user!.id,
      name,
      description,
      configuration,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save report' });
  }
});

export default router;