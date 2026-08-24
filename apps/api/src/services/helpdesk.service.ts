import { PrismaClient, HelpdeskDepartment, TicketPriority, TicketStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class HelpdeskService {
  public static calculateSlaDueDate(priority: TicketPriority): Date {
    const now = new Date();
    const hours = priority === 'URGENT' ? 4 : priority === 'HIGH' ? 24 : priority === 'MEDIUM' ? 48 : 72;
    now.setHours(now.getHours() + hours);
    return now;
  }

  public static async createTicket(params: {
    companyId: string;
    employeeId: string;
    department: HelpdeskDepartment;
    category: string;
    priority: TicketPriority;
    subject: string;
    description: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    if (!params.subject || !params.description) {
      throw new Error('Subject and description are mandatory for helpdesk tickets');
    }

    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const slaDueDate = this.calculateSlaDueDate(params.priority);

    return prisma.$transaction(async (tx) => {
      const ticket = await tx.helpdeskTicket.create({
        data: {
          companyId: params.companyId,
          employeeId: params.employeeId,
          ticketNumber,
          department: params.department,
          category: params.category,
          priority: params.priority,
          status: TicketStatus.OPEN,
          subject: params.subject,
          description: params.description,
          slaDueDate,
        },
        include: { employee: true, assignee: true },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'HELPDESK_TICKET_CREATED',
        entity: 'HelpdeskTicket',
        entityId: ticket.id,
        afterState: { ticketNumber, department: params.department, priority: params.priority },
      });

      return ticket;
    });
  }

  public static async listTickets(params: {
    companyId: string;
    employeeId?: string;
    isHrAdmin?: boolean;
    status?: TicketStatus;
    department?: HelpdeskDepartment;
  }) {
    const where: any = { companyId: params.companyId };
    if (!params.isHrAdmin && params.employeeId) {
      where.employeeId = params.employeeId;
    }
    if (params.status) where.status = params.status;
    if (params.department) where.department = params.department;

    return prisma.helpdeskTicket.findMany({
      where,
      include: {
        employee: { select: { name: true, employeeCode: true, email: true } },
        assignee: { select: { name: true, employeeCode: true } },
        comments: {
          where: params.isHrAdmin ? undefined : { isInternal: false },
          include: { author: { select: { email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getTicketDetail(params: {
    companyId: string;
    ticketId: string;
    employeeId?: string;
    isHrAdmin?: boolean;
  }) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id: params.ticketId, companyId: params.companyId },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, email: true } },
        assignee: { select: { id: true, name: true, employeeCode: true } },
        comments: {
          where: params.isHrAdmin ? undefined : { isInternal: false },
          include: { author: { select: { email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new Error('Ticket not found or access denied');
    if (!params.isHrAdmin && ticket.employeeId !== params.employeeId) {
      throw new Error('IDOR Protection: Access denied to other employee tickets');
    }

    return ticket;
  }

  public static async updateTicket(params: {
    companyId: string;
    ticketId: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id: params.ticketId, companyId: params.companyId },
    });
    if (!ticket) throw new Error('Ticket not found');

    const updateData: any = {};
    if (params.status) updateData.status = params.status;
    if (params.priority) updateData.priority = params.priority;
    if (params.assigneeId !== undefined) updateData.assigneeId = params.assigneeId;

    if (params.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }
    if (params.status === 'CLOSED' && ticket.status !== 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.helpdeskTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'HELPDESK_TICKET_UPDATED',
      entity: 'HelpdeskTicket',
      entityId: ticket.id,
      afterState: updateData,
    });

    return updated;
  }

  public static async addComment(params: {
    companyId: string;
    ticketId: string;
    authorUserId: string;
    body: string;
    isInternal?: boolean;
    actorEmail: string;
    actorRole: string;
    isHrAdmin?: boolean;
  }) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id: params.ticketId, companyId: params.companyId },
    });
    if (!ticket) throw new Error('Ticket not found');

    if (params.isInternal && !params.isHrAdmin) {
      throw new Error('Unauthorized: Employees cannot post confidential internal notes');
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: params.authorUserId,
        body: params.body,
        isInternal: !!params.isInternal,
      },
      include: { author: { select: { email: true } } },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.authorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.isInternal ? 'HELPDESK_INTERNAL_NOTE_ADDED' : 'HELPDESK_COMMENT_ADDED',
      entity: 'TicketComment',
      entityId: comment.id,
      afterState: { isInternal: comment.isInternal },
    });

    return comment;
  }

  public static async resolveTicket(params: {
    companyId: string;
    ticketId: string;
    resolutionNotes: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id: params.ticketId, companyId: params.companyId },
    });
    if (!ticket) throw new Error('Ticket not found');

    const resolved = await prisma.helpdeskTicket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.RESOLVED,
        resolutionNotes: params.resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'HELPDESK_TICKET_RESOLVED',
      entity: 'HelpdeskTicket',
      entityId: ticket.id,
      afterState: { status: 'RESOLVED', resolutionNotes: params.resolutionNotes },
    });

    return resolved;
  }
}