import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private daysAgo(n: number): Date {
    return new Date(Date.now() - n * 86400000);
  }

  async overview() {
    const now = new Date();
    const since30 = this.daysAgo(30);

    const [totalUsers, totalWorkspaces, activeSubs, recentSignups, latestPayments, expiringSubs] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.workspace.count({ where: { deletedAt: null } }),
        this.prisma.subscription.findMany({
          where: { status: { in: ['active', 'trialing'] }, currentPeriodEnd: { gt: now } },
          include: { plan: true },
        }),
        this.prisma.user.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { name: true, email: true, createdAt: true },
        }),
        this.prisma.payment.findMany({
          where: { status: 'approved' },
          orderBy: { reviewedAt: 'desc' },
          take: 5,
          include: { workspace: { select: { name: true } } },
        }),
        this.prisma.subscription.findMany({
          where: {
            status: { in: ['active', 'trialing'] },
            currentPeriodEnd: { gt: now, lt: this.daysAgo(-7) },
          },
          orderBy: { currentPeriodEnd: 'asc' },
          take: 5,
          include: { plan: true, workspace: { select: { name: true } } },
        }),
      ]);

    // KPIs
    const planCounts: Record<string, number> = { free: 0, pro: 0, premium: 0 };
    let mrr = 0n;
    let trialUsers = 0;
    let payingUsers = 0;
    for (const s of activeSubs) {
      planCounts[s.plan.code] = (planCounts[s.plan.code] ?? 0) + 1;
      if (s.status === 'trialing') trialUsers += 1;
      if (s.status === 'active' && s.plan.price > 0n) {
        mrr += s.plan.price;
        payingUsers += 1;
      }
    }

    // churn proxy: subs canceled/expired ใน 30 วัน ÷ (active paid + churned)
    const churned = await this.prisma.subscription.count({
      where: { status: { in: ['canceled', 'expired'] }, updatedAt: { gte: since30 } },
    });
    const churnRate =
      payingUsers + churned > 0
        ? Math.round((churned / (payingUsers + churned)) * 1000) / 10
        : 0;

    // user growth (30 วัน) — รวมใน JS
    const signups = await this.prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: since30 } },
      select: { createdAt: true },
    });
    const growthMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      growthMap.set(this.daysAgo(i).toISOString().slice(0, 10), 0);
    }
    for (const u of signups) {
      const k = u.createdAt.toISOString().slice(0, 10);
      if (growthMap.has(k)) growthMap.set(k, (growthMap.get(k) ?? 0) + 1);
    }
    const userGrowth = [...growthMap.entries()].map(([date, count]) => ({ date, count }));

    // revenue growth (6 เดือน) — จาก approved payments
    const since6m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const payments = await this.prisma.payment.findMany({
      where: { status: 'approved', reviewedAt: { gte: since6m } },
      select: { amount: true, reviewedAt: true },
    });
    const revMap = new Map<string, bigint>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      revMap.set(d.toISOString().slice(0, 7), 0n);
    }
    for (const p of payments) {
      const k = (p.reviewedAt ?? now).toISOString().slice(0, 7);
      if (revMap.has(k)) revMap.set(k, (revMap.get(k) ?? 0n) + p.amount);
    }
    const revenueGrowth = [...revMap.entries()].map(([month, total]) => ({
      month,
      total: total.toString(),
    }));

    return {
      kpis: {
        totalUsers,
        totalWorkspaces,
        activeSubscriptions: activeSubs.length,
        trialUsers,
        payingUsers,
        mrr: mrr.toString(),
        arr: (mrr * 12n).toString(),
        churnRate,
      },
      charts: {
        userGrowth,
        revenueGrowth,
        planDistribution: planCounts,
        conversion: {
          freeToPaid:
            totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 1000) / 10 : 0,
        },
      },
      widgets: {
        recentSignups: recentSignups.map((u) => ({
          name: u.name,
          email: u.email,
          createdAt: u.createdAt.toISOString(),
        })),
        latestPayments: latestPayments.map((p) => ({
          workspace: p.workspace.name,
          amount: p.amount.toString(),
          planCode: p.planCode,
          reviewedAt: p.reviewedAt?.toISOString() ?? null,
        })),
        expiringSubscriptions: expiringSubs.map((s) => ({
          workspace: s.workspace.name,
          plan: s.plan.name,
          currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        })),
      },
    };
  }
}
