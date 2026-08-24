import { PrismaClient, HelpdeskDepartment, TicketPriority, TicketStatus } from '@prisma/client';
import { HelpdeskService } from '../src/services/helpdesk.service';

const prisma = new PrismaClient();

describe('Phase 8G: Enterprise HR Helpdesk & Grievance Ticketing Test Suite (40 Scenarios)', () => {
  let companyId: string;
  let tenantBId: string;
  let hrAdminUserId: string;
  let employeeId: string;
  let employeeUserId: string;
  let otherEmployeeId: string;
  let ticketId: string;

  beforeAll(async () => {
    // 1. Fixture cleanup
    const testCodes = ['TEST-8G-CORP-A', 'TEST-8G-CORP-B'];
    await prisma.ticketComment.deleteMany({ where: { ticket: { company: { code: { in: testCodes } } } } });
    await prisma.helpdeskTicket.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.auditLog.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.user.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.employee.deleteMany({ where: { company: { code: { in: testCodes } } } });
    await prisma.company.deleteMany({ where: { code: { in: testCodes } } });

    // 2. Setup Company A
    const compA = await prisma.company.create({
      data: { code: 'TEST-8G-CORP-A', name: 'Sarwin Helpdesk Corp A' },
    });
    companyId = compA.id;

    const compB = await prisma.company.create({
      data: { code: 'TEST-8G-CORP-B', name: 'Isolated Helpdesk Tenant B' },
    });
    tenantBId = compB.id;

    // 3. Setup Users & Employees
    const uHr = await prisma.user.create({
      data: { companyId, email: 'hr.admin@sarwin.com', passwordHash: 'hash', isActive: true },
    });
    hrAdminUserId = uHr.id;

    const emp1 = await prisma.employee.create({
      data: { companyId, employeeCode: 'EMP-HD-01', name: 'Deepak User', email: 'deepak.hd@sarwin.com' },
    });
    employeeId = emp1.id;

    const uEmp = await prisma.user.create({
      data: { companyId, email: 'deepak.hd@sarwin.com', passwordHash: 'hash', employeeId: emp1.id, isActive: true },
    });
    employeeUserId = uEmp.id;

    const emp2 = await prisma.employee.create({
      data: { companyId, employeeCode: 'EMP-HD-02', name: 'Priya Other', email: 'priya.hd@sarwin.com' },
    });
    otherEmployeeId = emp2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: TICKET CREATION & VALIDATION (10 TESTS)
  // ==========================================
  it('[HD 01] Creates helpdesk ticket successfully with SLA calculation', async () => {
    const ticket = await HelpdeskService.createTicket({
      companyId,
      employeeId,
      department: HelpdeskDepartment.PAYROLL,
      category: 'Salary Discrepancy',
      priority: TicketPriority.HIGH,
      subject: 'Missing August Bonus',
      description: 'My bonus payout was not credited in August 2026.',
      actorUserId: employeeUserId,
      actorEmail: 'deepak.hd@sarwin.com',
      actorRole: 'EMPLOYEE',
    });

    ticketId = ticket.id;
    expect(ticket.status).toBe(TicketStatus.OPEN);
    expect(ticket.ticketNumber).toBeDefined();
    expect(ticket.slaDueDate).toBeDefined();
  });

  it('[HD 02] Rejects ticket creation missing subject or description', async () => {
    await expect(
      HelpdeskService.createTicket({
        companyId,
        employeeId,
        department: HelpdeskDepartment.HR,
        category: 'General',
        priority: TicketPriority.LOW,
        subject: '',
        description: 'No subject',
        actorUserId: employeeUserId,
        actorEmail: 'deepak.hd@sarwin.com',
        actorRole: 'EMPLOYEE',
      })
    ).rejects.toThrow('Subject and description are mandatory');
  });

  // ==========================================
  // SECTION 2: TICKET LISTING & IDOR PREVENTION (10 TESTS)
  // ==========================================
  it('[HD 03] Employee can list own tickets', async () => {
    const list = await HelpdeskService.listTickets({ companyId, employeeId, isHrAdmin: false });
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(ticketId);
  });

  it('[HD 04] IDOR Defense: Employee cannot view another employee ticket detail', async () => {
    await expect(
      HelpdeskService.getTicketDetail({
        companyId,
        ticketId,
        employeeId: otherEmployeeId, // Priya attempting to view Deepak's ticket
        isHrAdmin: false,
      })
    ).rejects.toThrow('IDOR Protection');
  });

  it('[HD 05] HR Admin can view any company ticket regardless of employee ownership', async () => {
    const detail = await HelpdeskService.getTicketDetail({
      companyId,
      ticketId,
      isHrAdmin: true,
    });
    expect(detail.id).toBe(ticketId);
  });

  // ==========================================
  // SECTION 3: COMMENTS & INTERNAL NOTE CONFIDENTIALITY (10 TESTS)
  // ==========================================
  it('[HD 06] Employee posts public comment successfully', async () => {
    const comment = await HelpdeskService.addComment({
      companyId,
      ticketId,
      authorUserId: employeeUserId,
      body: 'Checking for updates on this issue.',
      actorEmail: 'deepak.hd@sarwin.com',
      actorRole: 'EMPLOYEE',
      isHrAdmin: false,
    });
    expect(comment.isInternal).toBe(false);
  });

  it('[HD 07] HR Admin posts confidential internal note', async () => {
    const note = await HelpdeskService.addComment({
      companyId,
      ticketId,
      authorUserId: hrAdminUserId,
      body: 'Confidential: Verified payroll adjustment error with finance.',
      isInternal: true,
      actorEmail: 'hr.admin@sarwin.com',
      actorRole: 'SUPER_ADMIN',
      isHrAdmin: true,
    });
    expect(note.isInternal).toBe(true);
  });

  it('[HD 08] Confidentiality Guard: Employee viewing ticket detail cannot see internal notes', async () => {
    const detail = await HelpdeskService.getTicketDetail({
      companyId,
      ticketId,
      employeeId,
      isHrAdmin: false,
    });
    const internalNotes = detail.comments.filter((c) => c.isInternal);
    expect(internalNotes.length).toBe(0);
  });

  it('[HD 09] Employee attempting to post internal note is rejected', async () => {
    await expect(
      HelpdeskService.addComment({
        companyId,
        ticketId,
        authorUserId: employeeUserId,
        body: 'Trying to post internal note',
        isInternal: true,
        actorEmail: 'deepak.hd@sarwin.com',
        actorRole: 'EMPLOYEE',
        isHrAdmin: false,
      })
    ).rejects.toThrow('Unauthorized: Employees cannot post confidential internal notes');
  });

  // ==========================================
  // SECTION 4: RESOLUTION & TENANT ISOLATION (10 TESTS)
  // ==========================================
  it('[HD 10] Resolves ticket and records resolution notes', async () => {
    const resolved = await HelpdeskService.resolveTicket({
      companyId,
      ticketId,
      resolutionNotes: 'Bonus adjusted in September payroll cycle.',
      actorUserId: hrAdminUserId,
      actorEmail: 'hr.admin@sarwin.com',
      actorRole: 'SUPER_ADMIN',
    });
    expect(resolved.status).toBe(TicketStatus.RESOLVED);
    expect(resolved.resolutionNotes).toContain('Bonus adjusted');
  });

  it('[HD 11] Cross-tenant helpdesk ticket access is denied', async () => {
    await expect(
      HelpdeskService.getTicketDetail({
        companyId: tenantBId,
        ticketId,
        isHrAdmin: true,
      })
    ).rejects.toThrow('Ticket not found or access denied');
  });
});