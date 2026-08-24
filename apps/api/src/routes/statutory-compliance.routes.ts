import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { StatutoryCalculatorService } from '../services/statutory-calculator.service';
import { CompliancePreparationService } from '../services/compliance-preparation.service';

const router = Router();

// 1. Interactive Preview Calculation
router.post('/calculate-preview', requireAuth, requirePermission('STATUTORY_CONFIG_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { basicSalary, monthlyGross, earnedBasicSalary, earnedGross, isEpfApplicable, isEsicApplicable, ptStateCode, targetDate } = req.body;
    const date = targetDate ? new Date(targetDate) : new Date();

    const epf = await StatutoryCalculatorService.calculateEpf({
      companyId: req.user!.companyId,
      targetDate: date,
      isEpfApplicable: isEpfApplicable ?? true,
      basicSalary: basicSalary || 0,
      earnedBasicSalary: earnedBasicSalary || basicSalary || 0,
    });

    const esic = await StatutoryCalculatorService.calculateEsic({
      companyId: req.user!.companyId,
      targetDate: date,
      isEsicApplicable: isEsicApplicable ?? true,
      monthlyGross: monthlyGross || 0,
      earnedGross: earnedGross || monthlyGross || 0,
    });

    const pt = await StatutoryCalculatorService.calculateProfessionalTax({
      companyId: req.user!.companyId,
      targetDate: date,
      stateCode: ptStateCode || 'KA',
      earnedGross: earnedGross || monthlyGross || 0,
    });

    res.json({
      timestamp: new Date().toISOString(),
      epf,
      esic,
      pt,
      totalStatutoryDeductions: epf.employeeContribution + esic.employeeContribution + pt.monthlyDeduction,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate statutory preview' });
  }
});

// 2. EPF ECR Preparation & Summary
router.post('/epf/prepare-ecr', requireAuth, requirePermission('EPF_PREPARE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payrollCycleId } = req.body;
    if (!payrollCycleId) return res.status(400).json({ error: 'Missing payrollCycleId parameter' });

    const result = await CompliancePreparationService.prepareEcrDataset({
      companyId: req.user!.companyId,
      payrollCycleId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to prepare EPF ECR dataset' });
  }
});

// 3. ESIC Return Preparation
router.post('/esic/prepare-return', requireAuth, requirePermission('ESIC_PREPARE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payrollCycleId } = req.body;
    if (!payrollCycleId) return res.status(400).json({ error: 'Missing payrollCycleId parameter' });

    const result = await CompliancePreparationService.prepareEsicDataset({
      companyId: req.user!.companyId,
      payrollCycleId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to prepare ESIC return dataset' });
  }
});

// 4. Professional Tax Summary Statement
router.get('/professional-tax/summary', requireAuth, requirePermission('PT_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payrollCycleId } = req.query;
    if (!payrollCycleId) return res.status(400).json({ error: 'Missing payrollCycleId query parameter' });

    const result = await CompliancePreparationService.preparePtSummary({
      companyId: req.user!.companyId,
      payrollCycleId: payrollCycleId as string,
      actorUserId: req.user!.id,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate PT summary statement' });
  }
});

export default router;