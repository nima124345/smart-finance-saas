import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { AuditService } from '../audit.service';

@Injectable()
export class AdminBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly audit: AuditService,
  ) {}

  async overview() {
    const now = new Date();
    const subs = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
    });
    const byStatus: Record<string, number> = {};
    for (const s of subs) byStatus[s.status] = s._count;

    const approved = await this.prisma.payment.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
      _count: true,
    });

    const activePaid = await this.prisma.subscription.findMany({
      where: { status: 'active', currentPeriodEnd: { gt: now } },
      include: { plan: true },
    });
    let mrr = 0n;
    let payingUsers = 0;
    for (const s of activePaid) {
      if (s.plan.price > 0n) {
        mrr += s.plan.price;
        payingUsers += 1;
      }
    }

    return {
      subscriptionsByStatus: byStatus,
      revenue: {
        mrr: mrr.toString(),
        arr: (mrr * 12n).toString(),
        totalRevenue: (approved._sum.amount ?? 0n).toString(),
        paidPayments: approved._count,
        payingUsers,
      },
    };
  }

  async payments(status?: PaymentStatus) {
    const rows = await this.prisma.payment.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        workspace: { select: { name: true, publicId: true } },
        reviewedBy: { select: { email: true } },
      },
    });
    return rows.map((p) => ({
      publicId: p.publicId,
      workspace: p.workspace.name,
      workspaceId: p.workspace.publicId,
      planCode: p.planCode,
      amount: p.amount.toString(),
      method: p.method,
      status: p.status,
      reference: p.reference,
      reviewedBy: p.reviewedBy?.email ?? null,
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async approve(actorId: bigint, publicId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { publicId } });
    if (!payment) throw new NotFoundException('ไม่พบรายการชำระเงิน');
    if (payment.status !== 'pending') {
      throw new BadRequestException('รายการนี้ถูกตรวจสอบแล้ว');
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'approved', reviewedById: actorId, reviewedAt: new Date() },
    });
    // เปิดใช้งานแพ็กเกจตามที่จ่าย
    await this.subscriptions.changePlan(payment.workspaceId, { plan: payment.planCode });
    await this.audit.log({
      actorId,
      action: 'payment.approve',
      targetType: 'payment',
      targetId: publicId,
      metadata: { plan: payment.planCode },
    });
    return { status: 'approved' };
  }

  async reject(actorId: bigint, publicId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { publicId } });
    if (!payment) throw new NotFoundException('ไม่พบรายการชำระเงิน');
    if (payment.status !== 'pending') {
      throw new BadRequestException('รายการนี้ถูกตรวจสอบแล้ว');
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'rejected', reviewedById: actorId, reviewedAt: new Date() },
    });
    await this.audit.log({
      actorId,
      action: 'payment.reject',
      targetType: 'payment',
      targetId: publicId,
    });
    return { status: 'rejected' };
  }
}
