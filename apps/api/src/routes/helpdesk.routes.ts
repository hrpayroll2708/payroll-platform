import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { HelpdeskService } from '../services/helpdesk.service';

const router = Router();

router.get('/', requireAuth, requirePermission('HELPDESK_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isHrAdmin = req.user!.roles.includes('SUPER_ADMIN') || req.user!.roles.includes('PAYROLL_ADMIN') || req.user!.roles.includes('HR_ADMIN');
    const tickets = await HelpdeskService.listTickets({
      companyId: req.user!.companyId,
      employeeId: req.user!.employeeId,
      isHrAdmin,
      status: req.query.status as any,
      department: req.query.department as any,
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list tickets' });
  }
});

router.post('/', requireAuth, requirePermission('HELPDESK_CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'User session requires linked employee record' });

    const { department, category, priority, subject, description } = req.body;
    const ticket = await HelpdeskService.createTicket({
      companyId: req.user!.companyId,
      employeeId,
      department,
      category,
      priority,
      subject,
      description,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create ticket' });
  }
});

router.get('/:id', requireAuth, requirePermission('HELPDESK_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isHrAdmin = req.user!.roles.includes('SUPER_ADMIN') || req.user!.roles.includes('PAYROLL_ADMIN') || req.user!.roles.includes('HR_ADMIN');
    const ticket = await HelpdeskService.getTicketDetail({
      companyId: req.user!.companyId,
      ticketId: req.params.id,
      employeeId: req.user!.employeeId || undefined,
      isHrAdmin,
    });
    res.json(ticket);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Access denied' });
  }
});

router.patch('/:id', requireAuth, requirePermission('HELPDESK_UPDATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority, assigneeId } = req.body;
    const updated = await HelpdeskService.updateTicket({
      companyId: req.user!.companyId,
      ticketId: req.params.id,
      status,
      priority,
      assigneeId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'ADMIN',
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ticket update failed' });
  }
});

router.post('/:id/comments', requireAuth, requirePermission('HELPDESK_UPDATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { body, isInternal } = req.body;
    const isHrAdmin = req.user!.roles.includes('SUPER_ADMIN') || req.user!.roles.includes('PAYROLL_ADMIN') || req.user!.roles.includes('HR_ADMIN');
    const comment = await HelpdeskService.addComment({
      companyId: req.user!.companyId,
      ticketId: req.params.id,
      authorUserId: req.user!.id,
      body,
      isInternal,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
      isHrAdmin,
    });
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add comment' });
  }
});

router.post('/:id/resolve', requireAuth, requirePermission('HELPDESK_RESOLVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resolutionNotes } = req.body;
    const resolved = await HelpdeskService.resolveTicket({
      companyId: req.user!.companyId,
      ticketId: req.params.id,
      resolutionNotes,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'ADMIN',
    });
    res.json(resolved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Resolution failed' });
  }
});

export default router;