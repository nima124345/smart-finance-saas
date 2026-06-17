import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BusinessReportsService } from './business-reports.service';
import { ReportKind } from './dto/export-query.dto';
import { ReportPeriod } from './business-period';

@Injectable()
export class BusinessDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: BusinessReportsService,
    private readonly activity: ActivityService,
  ) {}

  /** รายได้วันนี้ (income, UTC วันปัจจุบัน) */
  private async dailyRevenue(workspaceId: bigint): Promise<bigint> {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const end = new Date(start.getTime() + 86400000);
    const agg = await this.prisma.transaction.aggregate({
      where: {
        workspaceId,
        deletedAt: null,
        type: 'income',
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? 0n;
  }

  async overview(workspaceId: bigint) {
    const thisMonth = { period: ReportPeriod.ThisMonth };

    const [revenueReport, expensesReport, dailyRevenue, activitySummary, recentActivity] =
      await Promise.all([
        this.reports.build(workspaceId, ReportKind.Revenue, thisMonth),
        this.reports.build(workspaceId, ReportKind.Expenses, thisMonth),
        this.dailyRevenue(workspaceId),
        this.activity.summary(workspaceId, 30),
        this.activity.list(workspaceId, { limit: 8 }),
      ]);

    const s = revenueReport.summary; // revenue/expense/net เหมือนกันทั้งสอง report

    return {
      period: revenueReport.period,
      metrics: {
        dailyRevenue: dailyRevenue.toString(),
        monthlyRevenue: s.revenue,
        monthlyExpenses: s.expense,
        netProfit: s.net,
        margin: s.margin,
        transactionCount: s.count,
        revenueGrowthPct: s.revenueGrowthPct,
        expenseGrowthPct: s.expenseGrowthPct,
        netGrowthPct: s.netGrowthPct,
      },
      // trend แยกรายได้/รายจ่าย (รายช่วงเดียวกัน)
      revenueTrend: revenueReport.trend.map((b) => ({
        label: b.label,
        amount: b.income,
      })),
      expenseTrend: revenueReport.trend.map((b) => ({
        label: b.label,
        amount: b.expense,
      })),
      topRevenueCategories: revenueReport.categories.slice(0, 5),
      topExpenseCategories: expensesReport.categories.slice(0, 5),
      teamActivity: {
        summary: activitySummary,
        recent: recentActivity.items,
      },
    };
  }
}
