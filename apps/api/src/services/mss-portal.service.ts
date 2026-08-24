import { PrismaClient, LeaveRequestStatus, RegularizationStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class MssPortalService {
  /**
   * Retrieves Manager Dashboard strictly for subordinate direct reports
   */
  public static async getManagerDashboard(params: { companyId: string; managerEmployeeId: string }) {
    const directReports = await prisma.employee.findMany({
      where: { companyId: params.companyId, managerId: params.managerEmployeeId, employmentStatus: 'ACTIVE' },
      select: { id: true, name: true, employeeCode: true, email: true, designation: true },
    });

    const reportIds = directReports.map((r) => r.id);

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: {
        companyId: params.companyId,
        employeeId: { in: reportIds },
        status: LeaveRequestStatus.SUBMITTED,
      },
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRegularizations = await prisma.attendanceRegularizationRequest.findMany({
      where: {
        companyId: params.companyId,
        employeeId: { in: reportIds },
        status: RegularizationStatus.SUBMITTED,
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      teamHeadcount: directReports.length,
      directReports,
      pendingLeavesCount: pendingLeaves.length,
      pendingRegularizationsCount: pendingRegularizations.length,
      pendingLeaves,
      pendingRegularizations,
    };
  }

  /**
   * Action Leave Request with strict subordinate hierarchy check and self-approval defense
   */
  public static async actionLeaveRequest(params: {
    companyId: string;
    managerEmployeeId: string;
    requestId: string;
    action: 'APPROVE' | 'REJECT';
    comments?: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const req = await prisma.leaveRequest.findFirst({
      where: { id: params.requestId, companyId: params.companyId },
      include: { employee: true },
    });

    if (!req) throw new Error('Leave request not found');

    // Self-Approval Defense
    if (req.employeeId === params.managerEmployeeId) {
      throw new Error('Self-Approval Denied: Managers cannot approve their own leave requests');
    }

    // Subordinate Hierarchy Guard
    if (req.employee.managerId !== params.managerEmployeeId) {
      throw new Error('Hierarchy Violation: You can only action requests for your direct subordinates');
    }

    const newStatus = params.action === 'APPROVE' ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.REJECTED;

    const updated = await prisma.leaveRequest.update({
      where: { id: req.id },
      data: {
        status: newStatus,
        approverId: params.managerEmployeeId,
        approvedAt: new Date(),
        rejectionReason: params.action === 'REJECT' ? params.comments : undefined,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: `LEAVE_REQUEST_${params.action}D`,
      entity: 'LeaveRequest',
      entityId: req.id,
      afterState: { status: newStatus, comments: params.comments },
    });

    return updated;
  }

  /**
   * Action Attendance Regularization with hierarchy verification
   */
  public static async actionAttendanceRegularization(params: {
    companyId: string;
    managerEmployeeId: string;
    requestId: string;
    action: 'APPROVE' | 'REJECT';
    comments?: string;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const req = await prisma.attendanceRegularizationRequest.findFirst({
      where: { id: params.requestId, companyId: params.companyId },
      include: { employee: true },
    });

    if (!req) throw new Error('Attendance regularization request not found');

    // Self-Approval Defense
    if (req.employeeId === params.managerEmployeeId) {
      throw new Error('Self-Approval Denied: Managers cannot approve their own regularization requests');
    }

    // Subordinate Hierarchy Guard
    if (req.employee.managerId !== params.managerEmployeeId) {
      throw new Error('Hierarchy Violation: You can only action requests for your direct subordinates');
    }

    const newStatus = params.action === 'APPROVE' ? RegularizationStatus.APPROVED : RegularizationStatus.REJECTED;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.attendanceRegularizationRequest.update({
        where: { id: req.id },
        data: {
          status: newStatus,
          approverId: params.managerEmployeeId,
          approvedAt: new Date(),
          rejectionReason: params.action === 'REJECT' ? params.comments : undefined,
        },
      });

      // If approved, update or upsert AttendanceRecord
      if (params.action === 'APPROVE') {
        await tx.attendanceRecord.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: req.employeeId,
              attendanceDate: req.attendanceDate,
            },
          },
          update: {
            status: req.requestedStatus,
            source: 'MANUAL_ADJUSTMENT',
            remarks: `Regularized by Manager: ${params.comments || 'Approved'}`,
          },
          create: {
            companyId: params.companyId,
            employeeId: req.employeeId,
            attendanceDate: req.attendanceDate,
            status: req.requestedStatus,
            source: 'MANUAL_ADJUSTMENT',
            remarks: `Regularized by Manager: ${params.comments || 'Approved'}`,
          },
        });
      }

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: `ATTENDANCE_REGULARIZATION_${params.action}D`,
        entity: 'AttendanceRegularizationRequest',
        entityId: req.id,
        afterState: { status: newStatus },
      });

      return updated;
    });
  }
}