import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanCode, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit.service';

interface UpdatePlanInput {
  price?: number;
  maxWorkspaces?: number | null;
  maxWallets?: number | null;
  maxTransactionsMonth?: number | null;
  features?: Prisma.InputJsonValue;
}

const DEFAULT_SETTINGS: Record<string, Prisma.InputJsonValue> = {
  maintenance: { enabled: false, message: '' },
  security: { rateLimitPerMin: 120, sessionTimeoutMinutes: 15 },
  feature_flags: { csvExport: true, aiInsights: false, teamMembers: false },
};

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAll() {
    const [plans, settings, loginLogs] = await Promise.all([
      this.prisma.plan.findMany({ orderBy: { price: 'asc' } }),
      this.prisma.appSetting.findMany(),
      this.prisma.adminAuditLog.findMany({
        where: { action: { startsWith: 'admin.login' } },
        include: { actor: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const settingsMap: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const s of settings) settingsMap[s.key] = s.value;

    return {
      plans: plans.map((p) => ({
        code: p.code,
        name: p.name,
        price: p.price.toString(),
        maxWorkspaces: p.maxWorkspaces,
        maxWallets: p.maxWallets,
        maxTransactionsMonth: p.maxTransactionsMonth,
        features: p.features,
      })),
      settings: settingsMap,
      adminLoginLogs: loginLogs.map((l) => ({
        actor: l.actor?.email ?? 'unknown',
        action: l.action,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  async updatePlan(actorId: bigint, code: PlanCode, input: UpdatePlanInput) {
    const plan = await this.prisma.plan.findUnique({ where: { code } });
    if (!plan) throw new NotFoundException('ไม่พบแพ็กเกจ');
    await this.prisma.plan.update({
      where: { code },
      data: {
        price: input.price != null ? BigInt(input.price) : undefined,
        maxWorkspaces: input.maxWorkspaces,
        maxWallets: input.maxWallets,
        maxTransactionsMonth: input.maxTransactionsMonth,
        features: input.features,
      },
    });
    await this.audit.log({
      actorId,
      action: 'settings.update_plan',
      targetType: 'plan',
      targetId: code,
      metadata: input as Prisma.InputJsonValue,
    });
    return { updated: true };
  }

  async updateSetting(actorId: bigint, key: string, raw: Record<string, unknown>) {
    const value = raw as Prisma.InputJsonValue;
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    await this.audit.log({
      actorId,
      action: 'settings.update',
      targetType: 'setting',
      targetId: key,
      metadata: value,
    });
    return { updated: true };
  }
}
