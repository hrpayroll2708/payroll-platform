import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { EssPortalService } from '../services/ess-portal.service';

const router = Router();

router.get('/dashboard', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked to user session' });

    const data = await EssPortalService.getDashboard({
      companyId: req.user!.companyId,
      employeeId,
      financialYear: req.query.financialYear as string,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load ESS dashboard' });
  }
});

router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked to session' });

    const profile = await EssPortalService.getProfile({
      companyId: req.user!.companyId,
      employeeId,
    });
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load profile' });
  }
});

router.get('/payslips', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked to session' });

    const list = await EssPortalService.getPayslips({
      companyId: req.user!.companyId,
      employeeId,
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load payslips' });
  }
});

router.get('/payslips/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked to session' });

    const payslip = await EssPortalService.getPayslipDetail({
      companyId: req.user!.companyId,
      employeeId,
      recordId: req.params.id,
    });
    res.json(payslip);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Payslip not found' });
  }
});

router.post('/attendance/regularize', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked to session' });

    const { attendanceDate, requestedStatus, reason } = req.body;
    if (!attendanceDate || !reason) return res.status(400).json({ error: 'Missing date or reason' });

    const reg = await EssPortalService.submitAttendanceRegularization({
      companyId: req.user!.companyId,
      employeeId,
      attendanceDate: new Date(attendanceDate),
      requestedStatus,
      reason,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(reg);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit regularization' });
  }
});

export default router;