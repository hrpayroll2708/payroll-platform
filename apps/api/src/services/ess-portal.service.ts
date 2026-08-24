import { PrismaClient, LeaveRequestStatus, RegularizationStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class EssPortalService {
  public static maskIdentifier(val: string | null | undefined, keepStart = 2, keepEnd = 2): string {
    if (!val) return 'NOT_CONFIGURED';
    const str = val.trim();
    if (str.length <= keepStart + keepEnd) return '****';
    return str.substring(0, keepStart) + '****' + str.substring(str.length - keepEnd);
  }

  public static async getDashboard(params: { companyId: string; employeeId: string; financialYear?: string }) {
    const fy = params.financialYear || '2026-2027';

    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
      include: {
        deptRel: true,
        desigRel: true,
        manager: true,
        leaveBalances: { where: { financialYear: fy }, include: { leaveType: true } },
        payrollRecords: {
          where: { payrollCycle: { companyId: params.companyId, status: 'LOCKED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { payrollCycle: true },
        },
        notifications: { where: { isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!emp) throw new Error('Employee profile not found');

    const latestPayroll = emp.payrollRecords[0];

    return {
      profile: {
        id: emp.id,
        name: emp.name,
        employeeCode: emp.employeeCode,
        email: emp.email,
        department: emp.deptRel?.name || emp.department || 'General',
        designation: emp.desigRel?.title || emp.designation || 'Associate',
        managerName: emp.manager?.name || 'Executive Leadership',
        dateOfJoining: emp.dateOfJoining,
      },
      latestPayslip: latestPayroll
        ? {
            recordId: latestPayroll.id,
            month: latestPayroll.payrollCycle.month,
            year: latestPayroll.payrollCycle.year,
            earnedGross: latestPayroll.earnedGross,
            totalDeductions: latestPayroll.totalDeductions,
            netSalary: latestPayroll.netSalary,
          }
        : null,
      leaveBalances: emp.leaveBalances.map((b) => ({
        leaveTypeCode: b.leaveType.code,
        leaveTypeName: b.leaveType.name,
        available: b.available,
        used: b.used,
      })),
      unreadNotifications: emp.notifications,
    };
  }

  public static async getProfile(params: { companyId: string; employeeId: string }) {
    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
      include: { deptRel: true, desigRel: true, locRel: true, manager: true },
    });

    if (!emp) throw new Error('Employee profile not found');

    return {
      id: emp.id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email,
      phone: emp.phone ? this.maskIdentifier(emp.phone, 2, 2) : null,
      department: emp.deptRel?.name || emp.department,
      designation: emp.desigRel?.title || emp.designation,
      location: emp.locRel?.name || emp.location,
      manager: emp.manager ? { name: emp.manager.name, email: emp.manager.email } : null,
      dateOfJoining: emp.dateOfJoining,
      employmentStatus: emp.employmentStatus,
      maskedPan: this.maskIdentifier(emp.pan, 2, 2),
      maskedUan: this.maskIdentifier(emp.uan, 2, 2),
      maskedBankAccount: this.maskIdentifier(emp.bankAccount, 2, 2),
      bankName: emp.bankName || 'Verified Bank',
      ifsc: emp.ifsc ? this.maskIdentifier(emp.ifsc, 2, 2) : null,
    };
  }

  public static async getPayslips(params: { companyId: string; employeeId: string }) {
    return prisma.payrollRecord.findMany({
      where: {
        employeeId: params.employeeId,
        payrollCycle: { companyId: params.companyId, status: 'LOCKED' },
      },
      select: {
        id: true,
        calendarDays: true,
        workingDays: true,
        payableDays: true,
        lopDays: true,
        monthlyGross: true,
        earnedGross: true,
        basicSalary: true,
        hra: true,
        specialAllowance: true,
        epfEmployee: true,
        esicEmployee: true,
        pt: true,
        tds: true,
        totalDeductions: true,
        netSalary: true,
        payrollCycle: {
          select: {
            month: true,
            year: true,
            periodStartDate: true,
            periodEndDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getPayslipDetail(params: { companyId: string; employeeId: string; recordId: string }) {
    const record = await prisma.payrollRecord.findFirst({
      where: {
        id: params.recordId,
        employeeId: params.employeeId,
        payrollCycle: { companyId: params.companyId, status: 'LOCKED' },
      },
      include: {
        employee: { select: { name: true, employeeCode: true, pan: true, uan: true } },
        payrollCycle: true,
      },
    });

    if (!record) throw new Error('Payslip not found or access denied');

    return {
      ...record,
      employee: {
        ...record.employee,
        panMasked: this.maskIdentifier(record.employee.pan, 2, 2),
        uanMasked: this.maskIdentifier(record.employee.uan, 2, 2),
      },
    };
  }

  /**
   * Phase 8A Document Center: Retrieves authorized documents strictly belonging to the employee
   */
  public static async getDocuments(params: { companyId: string; employeeId: string }) {
    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
    });
    if (!emp) throw new Error('Employee profile not found');

    const docs = await prisma.employeeDocument.findMany({
      where: { employeeId: params.employeeId },
      select: {
        id: true,
        title: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.documentType,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedDate: d.createdAt,
      isAuthorized: true,
    }));
  }

  /**
   * Phase 8A Document Center: Retrieves document detail with strict ownership verification and audit logging
   */
  public static async getDocumentDetail(params: {
    companyId: string;
    employeeId: string;
    documentId: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const doc = await prisma.employeeDocument.findFirst({
      where: {
        id: params.documentId,
        employeeId: params.employeeId,
        employee: { companyId: params.companyId },
      },
    });

    if (!doc) throw new Error('Document not found or access denied');

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'EMPLOYEE_DOCUMENT_DOWNLOADED',
      entity: 'EmployeeDocument',
      entityId: doc.id,
      afterState: { fileName: doc.fileName, documentType: doc.documentType },
    });

    return {
      id: doc.id,
      title: doc.title,
      category: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedDate: doc.createdAt,
      downloadUrl: `/api/v1/ess/documents/${doc.id}/download`,
    };
  }

  public static async submitAttendanceRegularization(params: {
    companyId: string;
    employeeId: string;
    attendanceDate: Date;
    requestedStatus?: any;
    reason: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const emp = await prisma.employee.findFirst({
      where: { id: params.employeeId, companyId: params.companyId },
    });
    if (!emp) throw new Error('Employee not found');

    const reg = await prisma.attendanceRegularizationRequest.create({
      data: {
        companyId: params.companyId,
        employeeId: params.employeeId,
        attendanceDate: params.attendanceDate,
        requestedStatus: params.requestedStatus || 'PRESENT',
        reason: params.reason,
        status: RegularizationStatus.SUBMITTED,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'ATTENDANCE_REGULARIZATION_SUBMITTED',
      entity: 'AttendanceRegularizationRequest',
      entityId: reg.id,
      afterState: { attendanceDate: params.attendanceDate, reason: params.reason },
    });

    return reg;
  }
}