import { PrismaClient, StatutoryConfigType, StatutoryConfigStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class StatutoryConfigService {
  static async list(params: {
    companyId: string;
    configType?: StatutoryConfigType;
    financialYear?: string;
    status?: StatutoryConfigStatus;
  }) {
    const where: any = { companyId: params.companyId };
    if (params.configType) where.configType = params.configType;
    if (params.financialYear) where.financialYear = params.financialYear;
    if (params.status) where.status = params.status;

    return prisma.statutoryConfiguration.findMany({
      where,
      orderBy: [{ financialYear: 'desc' }, { version: 'desc' }],
    });
  }

  static async resolveActiveConfig(params: {
    companyId: string;
    configType: StatutoryConfigType;
    jurisdictionState?: string | null;
    targetDate: Date;
  }) {
    const configs = await prisma.statutoryConfiguration.findMany({
      where: {
        companyId: params.companyId,
        configType: params.configType,
        status: StatutoryConfigStatus.ACTIVE,
        jurisdictionState: params.jurisdictionState || null,
        effectiveFrom: { lte: params.targetDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: params.targetDate } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
      take: 1,
    });

    return configs[0] || null;
  }

  static async createDraft(input: {
    companyId: string;
    configType: StatutoryConfigType;
    jurisdictionState?: string;
    financialYear: string;
    effectiveFrom: Date;
    effectiveTo?: Date | null;
    rulesJson: any;
    description?: string;
    createdById: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const existingCount = await prisma.statutoryConfiguration.count({
      where: {
        companyId: input.companyId,
        configType: input.configType,
        financialYear: input.financialYear,
        jurisdictionState: input.jurisdictionState || null,
      },
    });

    const version = existingCount + 1;

    const config = await prisma.statutoryConfiguration.create({
      data: {
        companyId: input.companyId,
        configType: input.configType,
        jurisdictionState: input.jurisdictionState || null,
        financialYear: input.financialYear,
        version,
        status: StatutoryConfigStatus.DRAFT,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo || null,
        rulesJson: input.rulesJson,
        description: input.description,
        createdById: input.createdById,
      },
    });

    await AuditService.log({
      companyId: input.companyId,
      userId: input.createdById,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: 'STATUTORY_CONFIG_DRAFT_CREATED',
      entity: 'StatutoryConfiguration',
      entityId: config.id,
      afterState: { configType: config.configType, version, financialYear: config.financialYear },
    });

    return config;
  }

  static async activateConfig(input: {
    id: string;
    companyId: string;
    approvedById: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const config = await prisma.statutoryConfiguration.findFirst({
      where: { id: input.id, companyId: input.companyId },
    });

    if (!config) throw new Error('Statutory configuration not found');
    if (config.createdById === input.approvedById) {
      throw new Error('Maker-Checker violation: Creator cannot activate their own statutory configuration.');
    }

    const overlapping = await prisma.statutoryConfiguration.findFirst({
      where: {
        companyId: input.companyId,
        configType: config.configType,
        jurisdictionState: config.jurisdictionState,
        status: StatutoryConfigStatus.ACTIVE,
        id: { not: config.id },
        effectiveFrom: { lte: config.effectiveTo || new Date('9999-12-31') },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: config.effectiveFrom } },
        ],
      },
    });

    if (overlapping) {
      await prisma.statutoryConfiguration.update({
        where: { id: overlapping.id },
        data: {
          status: StatutoryConfigStatus.SUPERSEDED,
          effectiveTo: new Date(config.effectiveFrom.getTime() - 86400000),
        },
      });
    }

    const activated = await prisma.statutoryConfiguration.update({
      where: { id: config.id },
      data: {
        status: StatutoryConfigStatus.ACTIVE,
        approvedById: input.approvedById,
        approvedAt: new Date(),
      },
    });

    await AuditService.log({
      companyId: input.companyId,
      userId: input.approvedById,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: 'STATUTORY_CONFIG_ACTIVATED',
      entity: 'StatutoryConfiguration',
      entityId: config.id,
      afterState: { status: 'ACTIVE', version: config.version },
    });

    return activated;
  }
}