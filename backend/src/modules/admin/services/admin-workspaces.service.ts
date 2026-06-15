import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanCode } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { AuditService } from '../audit.service';

@Injectable()
export class AdminWorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly audit: AuditService,
  ) {}

  async list(page: number, perPage: number) {
    const [rows, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          owner: { select: { email: true } },
          _count: { select: { wallets: true, transactions: true } },
          subscriptions: {
            where: { status: { in: ['active', 'trialing'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: { select: { code: true } } },
          },
        },
      }),
      this.prisma.workspace.count({ where: { deletedAt: null } }),
    ]);

    const items = rows.map((w) => ({
      publicId: w.publicId,
      name: w.name,
      type: w.type,
      owner: w.owner.email,
      plan: w.subscriptions[0]?.plan.code ?? 'free',
      walletCount: w._count.wallets,
      transactionCount: w._count.transactions,
      status: w.suspendedAt ? 'suspended' : 'active',
      createdAt: w.createdAt.toISOString(),
    }));
    return { items, page, perPage, total };
  }

  private async findOr404(publicId: string) {
    const ws = await this.prisma.workspace.findFirst({
      where: { publicId, deletedAt: null },
    });
    if (!ws) throw new NotFoundException('ไม่พบ workspace');
    return ws;
  }

  async suspend(actorId: bigint, publicId: string) {
    const ws = await this.findOr404(publicId);
    await this.prisma.workspace.update({
      where: { id: ws.id },
      data: { suspendedAt: new Date() },
    });
    await this.audit.log({ actorId, action: 'workspace.suspend', targetType: 'workspace', targetId: publicId });
    return { status: 'suspended' };
  }

  async restore(actorId: bigint, publicId: string) {
    const ws = await this.findOr404(publicId);
    await this.prisma.workspace.update({
      where: { id: ws.id },
      data: { suspendedAt: null },
    });
    await this.audit.log({ actorId, action: 'workspace.restore', targetType: 'workspace', targetId: publicId });
    return { status: 'active' };
  }

  async remove(actorId: bigint, publicId: string) {
    const ws = await this.findOr404(publicId);
    await this.prisma.workspace.update({
      where: { id: ws.id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({ actorId, action: 'workspace.delete', targetType: 'workspace', targetId: publicId });
    return { deleted: true };
  }

  async forcePlan(actorId: bigint, publicId: string, plan: PlanCode) {
    const ws = await this.findOr404(publicId);
    await this.subscriptions.changePlan(ws.id, { plan });
    await this.audit.log({
      actorId,
      action: 'workspace.force_plan',
      targetType: 'workspace',
      targetId: publicId,
      metadata: { plan },
    });
    return { plan };
  }
}
