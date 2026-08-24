import { Router, Response } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import { PerformanceService } from '../services/performance.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/cycles', requireAuth, requirePermission('PERFORMANCE_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cycles = await prisma.performanceCycle.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cycles);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list cycles' });
  }
});

router.post('/cycles', requireAuth, requirePermission('PERFORMANCE_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    const cycle = await PerformanceService.createCycle({
      companyId: req.user!.companyId,
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'ADMIN',
    });
    res.status(201).json(cycle);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create cycle' });
  }
});

router.patch('/cycles/:id', requireAuth, requirePermission('PERFORMANCE_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await PerformanceService.updateCycleStatus({
      companyId: req.user!.companyId,
      cycleId: req.params.id,
      status,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'ADMIN',
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update cycle status' });
  }
});

router.post('/goals', requireAuth, requirePermission('PERFORMANCE_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cycleId, employeeId, title, description, category, weightage, target } = req.body;
    const goal = await PerformanceService.createGoal({
      companyId: req.user!.companyId,
      cycleId,
      employeeId: employeeId || req.user!.employeeId,
      title,
      description,
      category,
      weightage,
      target,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.status(201).json(goal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create goal' });
  }
});

router.get('/appraisals', requireAuth, requirePermission('PERFORMANCE_READ'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isHrAdmin = req.user!.roles.includes('SUPER_ADMIN') || req.user!.roles.includes('PAYROLL_ADMIN') || req.user!.roles.includes('HR_ADMIN');
    const where: any = { companyId: req.user!.companyId };
    if (!isHrAdmin) {
      where.employeeId = req.user!.employeeId;
    }
    const appraisals = await prisma.appraisal.findMany({
      where,
      include: { employee: true, cycle: true },
    });
    res.json(appraisals);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list appraisals' });
  }
});

router.post('/appraisals/:id/self-submit', requireAuth, requirePermission('PERFORMANCE_WRITE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ error: 'No employee record linked' });

    const { selfRating, qualitativeFeedback, strengths, improvementAreas } = req.body;
    const updated = await PerformanceService.submitSelfAppraisal({
      companyId: req.user!.companyId,
      appraisalId: req.params.id,
      employeeId,
      selfRating,
      qualitativeFeedback,
      strengths,
      improvementAreas,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'EMPLOYEE',
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Self appraisal submission failed' });
  }
});

router.post('/appraisals/:id/manager-review', requireAuth, requirePermission('PERFORMANCE_REVIEW'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managerEmployeeId = req.user!.employeeId;
    if (!managerEmployeeId) return res.status(403).json({ error: 'No manager employee record linked' });

    const isHrAdmin = req.user!.roles.includes('SUPER_ADMIN') || req.user!.roles.includes('PAYROLL_ADMIN');
    const { managerRating, finalScore, strengths, improvementAreas, meritRecommendation, recommendedIncrementPct, recommendedIncrementAmt } = req.body;

    const reviewed = await PerformanceService.managerReview({
      companyId: req.user!.companyId,
      appraisalId: req.params.id,
      managerEmployeeId,
      managerRating,
      finalScore,
      strengths,
      improvementAreas,
      meritRecommendation,
      recommendedIncrementPct,
      recommendedIncrementAmt,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'MANAGER',
      isHrAdmin,
    });
    res.json(reviewed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Manager review failed' });
  }
});

router.post('/appraisals/:id/lock', requireAuth, requirePermission('PERFORMANCE_LOCK'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const locked = await PerformanceService.lockAppraisal({
      companyId: req.user!.companyId,
      appraisalId: req.params.id,
      approverUserId: req.user!.id,
      approverEmployeeId: req.user!.employeeId || undefined,
      actorEmail: req.user!.email,
      actorRole: req.user!.roles[0] || 'SUPER_ADMIN',
    });
    res.json(locked);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Appraisal lock failed' });
  }
});

export default router;