import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { MssPortalService } from '../services/mss-portal.service';

const router = Router();

router.get('/dashboard', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managerEmployeeId = req.user!.employeeId;
    if (!managerEmployeeId) return res.status(403).json({ error: 'Manager session requires linked employee record' });

    const data = await MssPortalService.getManagerDashboard({
      companyId: req.user!.companyId,
      managerEmployeeId,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load MSS dashboard' });
  }
});

router.post('/approvals/leave/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managerEmployeeId = req.user!.employeeId;
    if (!managerEmployeeId) return res.status(403).json({ error: 'Manager session requires linked employee record' });

    const { action, comments } = req.body;
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action: must be APPROVE or REJECT' });
    }

    const result = await MssPortalService.actionLeaveRequest({
      companyId: req.user!.companyId,
      managerEmployeeId,
      requestId: req.params.id,
      action,
      comments,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'MANAGER',
    });
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Approval action failed' });
  }
});

router.post('/approvals/attendance/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managerEmployeeId = req.user!.employeeId;
    if (!managerEmployeeId) return res.status(403).json({ error: 'Manager session requires linked employee record' });

    const { action, comments } = req.body;
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action: must be APPROVE or REJECT' });
    }

    const result = await MssPortalService.actionAttendanceRegularization({
      companyId: req.user!.companyId,
      managerEmployeeId,
      requestId: req.params.id,
      action,
      comments,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'MANAGER',
    });
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Regularization action failed' });
  }
});

export default router;