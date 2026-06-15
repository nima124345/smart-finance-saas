import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          publicId: true,
          name: true,
          email: true,
          systemRole: true,
          createdAt: true,
          _count: { select: { ownedWorkspaces: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      items: items.map((u) => ({
        publicId: u.publicId,
        name: u.name,
        email: u.email,
        systemRole: u.systemRole,
        workspaceCount: u._count.ownedWorkspaces,
        createdAt: u.createdAt.toISOString(),
      })),
      page: query.page,
      perPage: query.perPage,
      total,
    };
  }

  /** สถิติระบบ + รายได้ (MRR/ARR estimate) */
  async revenueDashboard() {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 86400000);

    const [totalUsers, totalWorkspaces, newUsers30, activeSubs] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.workspace.count({ where: { deletedAt: null } }),
        this.prisma.user.count({
          where: { deletedAt: null, createdAt: { gte: since30 } },
        }),
        this.prisma.subscription.findMany({
          where: {
            status: { in: ['active', 'trialing'] },
            currentPeriodEnd: { gt: now },
          },
          include: { plan: true },
        }),
      ]);

    // breakdown ตาม plan + MRR (เฉพาะ active ที่จ่ายเงินจริง ไม่นับ trial)
    const planCounts: Record<string, number> = { free: 0, pro: 0, premium: 0 };
    let mrr = 0n;
    let trialing = 0;
    let payingCustomers = 0;

    for (const s of activeSubs) {
      planCounts[s.plan.code] = (planCounts[s.plan.code] ?? 0) + 1;
      if (s.status === 'trialing') trialing += 1;
      if (s.status === 'active' && s.plan.price > 0n) {
        mrr += s.plan.price;
        payingCustomers += 1;
      }
    }

    return {
      totalUsers,
      totalWorkspaces,
      activeSubscriptions: activeSubs.length,
      payingCustomers,
      trialing,
      planBreakdown: planCounts,
      mrr: mrr.toString(), // สตางค์/เดือน
      arrEstimate: (mrr * 12n).toString(),
      growth: { newUsersLast30Days: newUsers30 },
    };
  }
}
