import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { DashboardQueryDto, DashboardRange } from './dto/dashboard-query.dto';

interface ResolvedRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  granularity: 'day' | 'month';
}

const TX_INCLUDE = {
  wallet: { select: { publicId: true, name: true } },
  destinationWallet: { select: { publicId: true, name: true } },
  category: { select: { publicId: true, name: true } },
} satisfies Prisma.TransactionInclude;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletsService,
  ) {}

  // ── range resolver (UTC, อิง DATE column) ──────────────────
  private monthStart(y: number, mIndex: number): Date {
    return new Date(Date.UTC(y, mIndex, 1));
  }

  private resolveRange(q: DashboardQueryDto): ResolvedRange {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    // ช่วง N เดือนสิ้นสุดที่เดือนปัจจุบัน: [เดือน m-N+1, เดือน m+1)
    const named = (months: number): ResolvedRange => {
      const start = this.monthStart(y, m - months + 1);
      const end = this.monthStart(y, m + 1);
      const prevStart = this.monthStart(y, m - months * 2 + 1);
      const prevEnd = start;
      return {
        start,
        end,
        prevStart,
        prevEnd,
        granularity: months <= 1 ? 'day' : 'month',
      };
    };

    switch (q.range) {
      case DashboardRange.LastMonth: {
        const start = this.monthStart(y, m - 1);
        const end = this.monthStart(y, m);
        const prevStart = this.monthStart(y, m - 2);
        return { start, end, prevStart, prevEnd: start, granularity: 'day' };
      }
      case DashboardRange.ThreeMonths:
        return named(3);
      case DashboardRange.SixMonths:
        return named(6);
      case DashboardRange.TwelveMonths:
        return named(12);
      case DashboardRange.Custom: {
        const start = new Date(`${q.dateFrom ?? '2000-01-01'}T00:00:00.000Z`);
        const end = new Date(`${q.dateTo ?? '2100-01-01'}T00:00:00.000Z`);
        end.setUTCDate(end.getUTCDate() + 1); // inclusive
        const span = end.getTime() - start.getTime();
        return {
          start,
          end,
          prevStart: new Date(start.getTime() - span),
          prevEnd: start,
          granularity: span <= 46 * 86400000 ? 'day' : 'month',
        };
      }
      case DashboardRange.ThisMonth:
      default:
        return named(1);
    }
  }

  private bucketKey(d: Date, g: 'day' | 'month'): string {
    return g === 'day'
      ? d.toISOString().slice(0, 10)
      : d.toISOString().slice(0, 7);
  }

  private enumerateBuckets(r: ResolvedRange): string[] {
    const out: string[] = [];
    const cur = new Date(r.start);
    while (cur < r.end) {
      out.push(this.bucketKey(cur, r.granularity));
      if (r.granularity === 'day') cur.setUTCDate(cur.getUTCDate() + 1);
      else cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return out;
  }

  /** income/expense รวมในช่วง [start,end) */
  private async sumByType(workspaceId: bigint, start: Date, end: Date) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        workspaceId,
        deletedAt: null,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    let income = 0n;
    let expense = 0n;
    for (const g of grouped) {
      if (g.type === 'income') income = g._sum.amount ?? 0n;
      else if (g.type === 'expense') expense = g._sum.amount ?? 0n;
    }
    return { income, expense };
  }

  private pct(cur: bigint, prev: bigint): number | null {
    if (prev === 0n) return null; // ไม่มีฐานเทียบ
    return Math.round((Number(cur - prev) / Number(prev)) * 1000) / 10;
  }

  // ── OVERVIEW (consolidated — 1 fetch) ──────────────────────
  async overview(workspaceId: bigint, q: DashboardQueryDto) {
    const r = this.resolveRange(q);

    const [
      wallets,
      cur,
      prev,
      breakdownRaw,
      trendRows,
      recentRaw,
      totalCount,
    ] = await Promise.all([
      this.wallets.list(workspaceId),
      this.sumByType(workspaceId, r.start, r.end),
      this.sumByType(workspaceId, r.prevStart, r.prevEnd),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          workspaceId,
          deletedAt: null,
          categoryId: { not: null },
          transactionDate: { gte: r.start, lt: r.end },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          type: { in: ['income', 'expense'] },
          transactionDate: { gte: r.start, lt: r.end },
        },
        select: { type: true, amount: true, transactionDate: true },
      }),
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null },
        include: TX_INCLUDE,
        orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
        take: 5,
      }),
      this.prisma.transaction.count({ where: { workspaceId, deletedAt: null } }),
    ]);

    // totals
    const totalBalance = wallets.reduce((s, w) => s + BigInt(w.balance), 0n);
    const net = cur.income - cur.expense;

    // category breakdown + names
    const catIds = breakdownRaw
      .map((b) => b.categoryId)
      .filter((id): id is bigint => id != null);
    const cats = await this.prisma.category.findMany({
      where: { id: { in: catIds } },
      select: { id: true, publicId: true, name: true, type: true },
    });
    const catMap = new Map(cats.map((c) => [c.id, c]));
    const categoryBreakdown = breakdownRaw
      .map((b) => {
        const c = b.categoryId ? catMap.get(b.categoryId) : undefined;
        return c
          ? {
              categoryId: c.publicId,
              name: c.name,
              type: c.type,
              total: (b._sum.amount ?? 0n).toString(),
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    const topExpenseCategories = categoryBreakdown
      .filter((c) => c.type === 'expense')
      .sort((a, b) => Number(BigInt(b.total) - BigInt(a.total)))
      .slice(0, 5);

    // trend (เติม bucket ครบ)
    const buckets = this.enumerateBuckets(r);
    const trendMap = new Map<string, { income: bigint; expense: bigint }>();
    buckets.forEach((b) => trendMap.set(b, { income: 0n, expense: 0n }));
    for (const row of trendRows) {
      const key = this.bucketKey(row.transactionDate, r.granularity);
      const cell = trendMap.get(key);
      if (!cell) continue;
      if (row.type === 'income') cell.income += row.amount;
      else cell.expense += row.amount;
    }
    const trend = buckets.map((label) => ({
      label,
      income: (trendMap.get(label)?.income ?? 0n).toString(),
      expense: (trendMap.get(label)?.expense ?? 0n).toString(),
    }));

    return {
      range: {
        key: q.range,
        start: r.start.toISOString().slice(0, 10),
        end: r.end.toISOString().slice(0, 10),
        granularity: r.granularity,
      },
      stats: {
        totalBalance: totalBalance.toString(),
        income: cur.income.toString(),
        expense: cur.expense.toString(),
        net: net.toString(),
      },
      insights: {
        topExpenseCategory: topExpenseCategories[0] ?? null,
        incomeChangePct: this.pct(cur.income, prev.income),
        expenseChangePct: this.pct(cur.expense, prev.expense),
        prevIncome: prev.income.toString(),
        prevExpense: prev.expense.toString(),
      },
      trend,
      categoryBreakdown,
      topExpenseCategories,
      walletSummary: wallets.map((w) => ({
        publicId: w.publicId,
        name: w.name,
        balance: w.balance,
      })),
      recentTransactions: recentRaw.map((t) => ({
        publicId: t.publicId,
        type: t.type,
        amount: t.amount.toString(),
        currency: t.currency,
        note: t.note,
        transactionDate: t.transactionDate.toISOString().slice(0, 10),
        wallet: t.wallet,
        destinationWallet: t.destinationWallet,
        category: t.category,
      })),
      hasData: totalCount > 0,
    };
  }
}
