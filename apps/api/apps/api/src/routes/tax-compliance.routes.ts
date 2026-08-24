import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { TdsCalculatorService } from '../services/tds-calculator.service';
import { TaxDeclarationService } from '../services/tax-declaration.service';

const router = Router();

// 1. Calculate Tax Projection
router.post('/projection', requireAuth, requirePermission('TDS_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, taxRegime, projectedAnnualGross, approvedChapterVIADeductions, ytdTdsPaid, previousEmployerTds, previousEmployerIncome, remainingPayrollPeriods, pan } = req.body;
    const result = TdsCalculatorService.calculateTaxProjection({
      financialYear: financialYear || '2026-2027',
      taxRegime,
      projectedAnnualGross: projectedAnnualGross || 0,
      approvedChapterVIADeductions: approvedChapterVIADeductions || 0,
      ytdTdsPaid: ytdTdsPaid || 0,
      previousEmployerTds: previousEmployerTds || 0,
      previousEmployerIncome: previousEmployerIncome || 0,
      remainingPayrollPeriods: remainingPayrollPeriods || 12,
      pan,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate tax projection' });
  }
});

// 2. Set Employee Tax Regime
router.post('/regime', requireAuth, requirePermission('TAX_DECLARATION_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, financialYear, taxRegime } = req.body;
    if (!employeeId || !taxRegime) return res.status(400).json({ error: 'Missing employeeId or taxRegime' });

    const profile = await TaxDeclarationService.setTaxRegime({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: financialYear || '2026-2027',
      taxRegime,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to set tax regime' });
  }
});

// 3. Submit Tax Declaration
router.post('/declarations', requireAuth, requirePermission('TAX_DECLARATION_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, financialYear, taxRegime, sectionCategory, itemCode, description, declaredAmount } = req.body;
    const decl = await TaxDeclarationService.submitDeclarationItem({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: financialYear || '2026-2027',
      taxRegime,
      sectionCategory,
      itemCode,
      description,
      declaredAmount: declaredAmount || 0,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(decl);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit declaration' });
  }
});

// 4. Review Tax Declaration (Maker-Checker HR Action)
router.patch('/declarations/:id/review', requireAuth, requirePermission('TAX_DECLARATION_APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, approvedAmount, rejectionReason } = req.body;
    const updated = await TaxDeclarationService.reviewDeclarationItem({
      declarationId: req.params.id,
      companyId: req.user!.companyId,
      status,
      approvedAmount: approvedAmount || 0,
      rejectionReason,
      reviewerId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to review declaration' });
  }
});

// 5. Form 12B Previous Employer Income Recording
router.post('/previous-employer', requireAuth, requirePermission('TAX_DECLARATION_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, financialYear, employerName, grossSalary, exemptions, tdsDeducted, epfDeducted, ptDeducted } = req.body;
    const record = await TaxDeclarationService.recordPreviousEmployerIncome({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: financialYear || '2026-2027',
      employerName,
      grossSalary: grossSalary || 0,
      exemptions: exemptions || 0,
      tdsDeducted: tdsDeducted || 0,
      epfDeducted: epfDeducted || 0,
      ptDeducted: ptDeducted || 0,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record previous employer income' });
  }
});

// 6. Employee Full Tax Computation Summary
router.get('/employee/:id/computation', requireAuth, requirePermission('TDS_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, remainingPeriods } = req.query;
    const computation = await TaxDeclarationService.getEmployeeTaxComputation({
      companyId: req.user!.companyId,
      employeeId: req.params.id,
      financialYear: (financialYear as string) || '2026-2027',
      remainingPeriods: remainingPeriods ? parseInt(remainingPeriods as string, 10) : 12,
    });
    res.json(computation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve tax computation' });
  }
});

export default router;