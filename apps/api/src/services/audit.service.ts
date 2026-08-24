import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async log(params: {
    companyId: string;
    userId?: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId: string;
    beforeState?: any;
    afterState?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          companyId: params.companyId,
          userId: params.userId,
          actorEmail: params.actorEmail,
          actorRole: params.actorRole,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          beforeState: params.beforeState ? JSON.parse(JSON.stringify(params.beforeState)) : null,
          afterState: params.afterState ? JSON.parse(JSON.stringify(params.afterState)) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      console.error('Non-blocking Audit Log Write Error:', err);
      return null;
    }
  }
}