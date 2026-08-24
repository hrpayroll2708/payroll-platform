import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ExpenseClaimService } from '../services/expense-claim.service';
import { FbpAllocationService } from '../services/fbp-allocation.service';

const router = Router();

// Employee Expense Claims Endpoints
router.get('/', requireAuth, requirePermission('EXPENSE_CLAIM_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const claims = await ExpenseClaimService.listEmployeeClaims({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: req.query.financialYear as string,
    });
    res.json(claims);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list claims' });
  }
});

router.post('/', requireAuth, requirePermission('EXPENSE_CLAIM_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const { financialYear, headId, claimDate, amountClaimed, description, receiptFile } = req.body;
    const claim = await ExpenseClaimService.createDraftClaim({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: financialYear || '2026-2027',
      headId,
      claimDate: new Date(claimDate || Date.now()),
      amountClaimed: Number(amountClaimed),
      description,
      receiptFile,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(claim);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create claim' });
  }
});

router.post('/:id/submit', requireAuth, requirePermission('EXPENSE_CLAIM_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const updated = await ExpenseClaimService.submitClaim({
      companyId: req.user!.companyId,
      employeeId,
      claimId: req.params.id,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit claim' });
  }
});

router.post('/:id/cancel', requireAuth, requirePermission('EXPENSE_CLAIM_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const cancelled = await ExpenseClaimService.cancelClaim({
      companyId: req.user!.companyId,
      employeeId,
      claimId: req.params.id,
    });
    res.json(cancelled);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to cancel claim' });
  }
});

router.post('/:id/review', requireAuth, requirePermission('EXPENSE_CLAIM_APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerEmployeeId = req.user!.employeeId;
    if (!reviewerEmployeeId) return res.status(403).json({ error: 'Reviewer session requires linked employee record' });

    const { action, amountApproved, reviewComments, targetPayrollCycleId } = req.body;
    const reviewed = await ExpenseClaimService.reviewClaim({
      companyId: req.user!.companyId,
      reviewerEmployeeId,
      claimId: req.params.id,
      action,
      amountApproved: amountApproved ? Number(amountApproved) : undefined,
      reviewComments,
      targetPayrollCycleId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'MANAGER',
    });
    res.json(reviewed);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Review failed' });
  }
});

// FBP Allocation Endpoints
router.get('/fbp/summary', requireAuth, requirePermission('FBP_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const summary = await FbpAllocationService.getEmployeeFbpSummary({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: req.query.financialYear as string,
    });
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load FBP summary' });
  }
});

router.post('/fbp/allocation', requireAuth, requirePermission('FBP_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, financialYear, headId, annualEntitlement } = req.body;
    const alloc = await FbpAllocationService.allocateEmployeeFbp({
      companyId: req.user!.companyId,
      employeeId: employeeId || req.user!.employeeId!,
      financialYear: financialYear || '2026-2027',
      headId,
      annualEntitlement: Number(annualEntitlement),
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(alloc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'FBP allocation failed' });
  }
});

export default router;