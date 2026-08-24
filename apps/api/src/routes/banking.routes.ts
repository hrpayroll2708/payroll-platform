import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { BankingService } from '../services/banking.service';

const router = Router();

router.post('/batches', requireAuth, requirePermission('BANKING_PREPARE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payrollCycleId, paymentDate } = req.body;
    const batch = await BankingService.createBatch({
      companyId: req.user!.companyId,
      payrollCycleId,
      paymentDate: new Date(paymentDate || Date.now()),
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.status(201).json(batch);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Batch creation failed' });
  }
});

router.post('/batches/:id/approve', requireAuth, requirePermission('BANKING_APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approved = await BankingService.approveBatch({
      companyId: req.user!.companyId,
      batchId: req.params.id,
      approverUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'SUPER_ADMIN',
    });
    res.json(approved);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Batch approval failed' });
  }
});

router.post('/batches/:id/export', requireAuth, requirePermission('BANKING_EXPORT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const csv = await BankingService.exportNeftCsv({
      companyId: req.user!.companyId,
      batchId: req.params.id,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="neft_disbursement_batch.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'NEFT export failed' });
  }
});

router.post('/payments/:id/retry', requireAuth, requirePermission('BANKING_RETRY'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const retried = await BankingService.retryPayment({
      companyId: req.user!.companyId,
      instructionId: req.params.id,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'PAYROLL_ADMIN',
    });
    res.json(retried);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment retry failed' });
  }
});

router.get('/reconciliation/:batchId', requireAuth, requirePermission('BANKING_RECONCILE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recon = await BankingService.getReconciliation({
      companyId: req.user!.companyId,
      batchId: req.params.batchId,
    });
    res.json(recon);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Reconciliation failed' });
  }
});

export default router;