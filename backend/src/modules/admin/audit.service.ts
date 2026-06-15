import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

interface LogInput {
  actorId?: bigint;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}

/** บันทึก audit log การกระทำของแอดมิน (ไม่ throw ถ้า log พลาด) */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput): Promise<void> {
    await this.prisma.adminAuditLog
      .create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata ?? {},
          ip: input.ip,
        },
      })
      .catch(() => undefined);
  }

  async list(skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        include: { actor: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.adminAuditLog.count(),
    ]);
    return {
      items: items.map((l) => ({
        action: l.action,
        actor: l.actor?.email ?? 'system',
        targetType: l.targetType,
        targetId: l.targetId,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
    };
  }
}
