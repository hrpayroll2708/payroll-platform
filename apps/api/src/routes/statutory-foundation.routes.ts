import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { StatutoryConfigService } from '../services/statutory-config.service';
import { CompliancePeriodService } from '../services/compliance-period.service';
import { ComplianceExceptionService } from '../services/compliance-exception.service';

const router = Router();

router.get('/configurations', requireAuth, requirePermission('STATUTORY_CONFIG_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { configType, financialYear, status } = req.query;
    const configs = await StatutoryConfigService.list({
      companyId: req.user!.companyId,
      configType: configType as any,
      financialYear: financialYear as string,
      status: status as any,
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statutory configurations' });
  }
});

router.post('/configurations', requireAuth, requirePermission('STATUTORY_CONFIG_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { configType, jurisdictionState, financialYear, effectiveFrom, effectiveTo, rulesJson, description } = req.body;
    if (!configType || !financialYear || !effectiveFrom || !rulesJson) {
      return res.status(400).json({ error: 'Missing mandatory fields: configType, financialYear, effectiveFrom, rulesJson.' });
    }

    const config = await StatutoryConfigService.createDraft({
      companyId: req.user!.companyId,
      configType,
      jurisdictionState,
      financialYear,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      rulesJson,
      description,
      createdById: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });

    res.status(201).json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create statutory configuration draft' });
  }
});

router.post('/configurations/:id/activate', requireAuth, requirePermission('STATUTORY_CONFIG_APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await StatutoryConfigService.activateConfig({
      id: req.params.id,
      companyId: req.user!.companyId,
      approvedById: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'SUPER_ADMIN',
    });
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to activate statutory configuration' });
  }
});

router.post('/periods/init', requireAuth, requirePermission('COMPLIANCE_PERIOD_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, month, quarter } = req.body;
    const period = await CompliancePeriodService.getOrCreatePeriod({
      companyId: req.user!.companyId,
      financialYear,
      month: parseInt(month, 10),
      quarter,
    });
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize compliance period' });
  }
});

router.get('/exceptions', requireAuth, requirePermission('COMPLIANCE_EXCEPTION_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exceptions = await ComplianceExceptionService.list({
      companyId: req.user!.companyId,
      status: req.query.status as any,
      severity: req.query.severity as any,
      category: req.query.category as any,
    });
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve compliance exceptions' });
  }
});

router.patch('/exceptions/:id/resolve', requireAuth, requirePermission('COMPLIANCE_EXCEPTION_RESOLVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resolutionNotes } = req.body;
    const resolved = await ComplianceExceptionService.resolveException({
      id: req.params.id,
      companyId: req.user!.companyId,
      resolvedById: req.user!.id,
      resolutionNotes,
    });
    res.json(resolved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve compliance exception' });
  }
});

export default router;