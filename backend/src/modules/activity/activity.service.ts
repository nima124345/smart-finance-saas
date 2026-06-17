import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityAction } from './activity.constants';

export interface LogActivityParams {
  workspaceId: bigint;
  actorId: bigint | null;
  action: ActivityAction;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

const ACTOR_SELECT = {
  publicId: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * บันทึกกิจกรรม — best-effort: ถ้าเขียน log ล้มเหลว ห้ามทำให้ flow หลัก (เช่น สร้างรายการ) ล้มตาม
   */
  async log(params: LogActivityParams): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          workspaceId: params.workspaceId,
          actorId: params.actorId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          metadata: params.metadata ?? {},
        },
      });
    } catch (e) {
      this.logger.warn(`activity log failed: ${(e as Error).message}`);
    }
  }

  /** รายการกิจกรรมของ workspace (cursor pagination ด้วย id desc) */
  async list(
    workspaceId: bigint,
    opts: { limit: number; cursor?: string; action?: string },
  ) {
    const cursorId = opts.cursor ? this.parseCursor(opts.cursor) : undefined;

    const rows = await this.prisma.activityLog.findMany({
      where: {
        workspaceId,
        ...(opts.action ? { action: opts.action } : {}),
        ...(cursorId != null ? { id: { lt: cursorId } } : {}),
      },
      include: { actor: { select: ACTOR_SELECT } },
      orderBy: { id: 'desc' },
      take: opts.limit + 1,
    });

    const hasMore = rows.length > opts.limit;
    const items = hasMore ? rows.slice(0, opts.limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id.toString() : null;

    return {
      items: items.map((r) => ({
        id: r.id.toString(),
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString(),
        actor: r.actor
          ? {
              publicId: r.actor.publicId,
              name: r.actor.name,
              email: r.actor.email,
              avatarUrl: r.actor.avatarUrl,
            }
          : null,
      })),
      nextCursor,
    };
  }

  /** สรุปกิจกรรมช่วง N วันล่าสุด (นับตาม action) — สำหรับ Team Activity Summary */
  async summary(workspaceId: bigint, sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 86400000);
    const grouped = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where: { workspaceId, createdAt: { gte: since } },
      _count: { _all: true },
    });
    const byAction: Record<string, number> = {};
    let total = 0;
    for (const g of grouped) {
      byAction[g.action] = g._count._all;
      total += g._count._all;
    }
    return { sinceDays, total, byAction };
  }

  private parseCursor(cursor: string): bigint | undefined {
    try {
      return BigInt(cursor);
    } catch {
      return undefined;
    }
  }
}
