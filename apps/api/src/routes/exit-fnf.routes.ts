import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { FnFSettlementService } from '../services/fnf-settlement.service';

const router = Router();

// Employee Exit Resignation Submission
router.post('/resignation', requireAuth, requirePermission('EXIT_SUBMIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const { resignationDate, proposedLastDay, reason, comments } = req.body;
    const reqDoc = await FnFSettlementService.submitResignation({
      companyId: req.user!.companyId,
      employeeId,
      resignationDate: new Date(resignationDate || Date.now()),
      proposedLastDay: new Date(proposedLastDay),
      reason,
      comments,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(reqDoc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Resignation submission failed' });
  }
});

// F&F Calculation (HR/Payroll Admin)
router.post('/fnf/:employeeId/calculate', requireAuth, requirePermission('FNF_CALCULATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settlement = await FnFSettlementService.calculateFnF({
      companyId: req.user!.companyId,
      employeeId: req.params.employeeId,
      financialYear: (req.query.financialYear as string) || '2026-2027',
      actualWorkedDaysInExitMonth: req.body.actualWorkedDays,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(settlement);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'F&F calculation failed' });
  }
});

// F&F Approval and Lock (Maker-Checker Guarded)
router.post('/fnf/:id/lock', requireAuth, requirePermission('FNF_LOCK'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const locked = await FnFSettlementService.approveAndLockFnF({
      companyId: req.user!.companyId,
      settlementId: req.params.id,
      approverUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'SUPER_ADMIN',
    });
    res.json(locked);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'F&F locking failed' });
  }
});

export default router;