import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Analytics — หมายเหตุ: ระบบยังไม่มี event-tracking จริง
 * DAU/MAU/retention คำนวณจาก "ผู้สร้าง transaction" เป็น proxy ของ active user
 */
@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private daysAgo(n: number): Date {
    return new Date(Date.now() - n * 86400000);
  }

  async overview() {
    const [dauRows, mauRows, totalUsers, totalTx, monthUsers, prevMonthUsers] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: { createdAt: { gte: this.daysAgo(1) } },
          select: { createdById: true },
          distinct: ['createdById'],
        }),
        this.prisma.transaction.findMany({
          where: { createdAt: { gte: this.daysAgo(30) } },
          select: { createdById: true },
          distinct: ['createdById'],
        }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.transaction.count({ where: { deletedAt: null } }),
        this.prisma.transaction.findMany({
          where: { createdAt: { gte: this.daysAgo(30) } },
          select: { createdById: true },
          distinct: ['createdById'],
        }),
        this.prisma.transaction.findMany({
          where: { createdAt: { gte: this.daysAgo(60), lt: this.daysAgo(30) } },
          select: { createdById: true },
          distinct: ['createdById'],
        }),
      ]);

    const dau = dauRows.length;
    const mau = mauRows.length;

    // retention proxy: ผู้ใช้ที่ active ทั้งเดือนนี้และเดือนก่อน ÷ เดือนก่อน
    const prevSet = new Set(prevMonthUsers.map((r) => r.createdById.toString()));
    const retained = monthUsers.filter((r) => prevSet.has(r.createdById.toString())).length;
    const retention = prevSet.size > 0 ? Math.round((retained / prevSet.size) * 1000) / 10 : 0;

    // conversion funnel
    const [withWallet, withTx, paying] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: null, ownedWorkspaces: { some: { wallets: { some: {} } } } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, transactions: { some: {} } },
      }),
      this.prisma.subscription.count({
        where: { status: 'active', currentPeriodEnd: { gt: new Date() }, plan: { price: { gt: 0 } } },
      }),
    ]);

    // feature usage
    const txByType = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: true,
    });
    const featureUsage: Record<string, number> = {};
    for (const t of txByType) featureUsage[t.type] = t._count;

    return {
      dau,
      mau,
      stickiness: mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0, // DAU/MAU %
      retention,
      avgTransactionsPerUser:
        totalUsers > 0 ? Math.round((totalTx / totalUsers) * 10) / 10 : 0,
      conversionFunnel: {
        signups: totalUsers,
        createdWallet: withWallet,
        createdTransaction: withTx,
        paying,
      },
      featureUsage,
      note: 'DAU/MAU/retention เป็น proxy จาก transaction activity (ยังไม่มี event tracking)',
    };
  }
}
