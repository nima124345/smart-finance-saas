import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportKind } from './dto/export-query.dto';
import {
  bucketKey,
  enumerateBuckets,
  growthPct,
  resolvePeriod,
  ResolvedPeriod,
} from './business-period';

export interface CategoryRow {
  categoryId: string | null;
  name: string;
  total: string; // satang
  pct: number; // สัดส่วน % ของยอดรวมประเภทนั้น
}

export interface BucketRow {
  label: string;
  income: string;
  expense: string;
  net: string;
}

export interface ReportResult {
  kind: ReportKind;
  period: {
    key: string;
    label: string;
    start: string;
    end: string; // inclusive (แสดงผล)
    granularity: 'day' | 'month';
  };
  summary: {
    revenue: string;
    expense: string;
    net: string;
    margin: number | null; // net/revenue %
    count: number;
    prevRevenue: string;
    prevExpense: string;
    prevNet: string;
    revenueGrowthPct: number | null;
    expenseGrowthPct: number | null;
    netGrowthPct: number | null;
  };
  categories: CategoryRow[];
  trend: BucketRow[];
}

@Injectable()
export class BusinessReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** income/expense รวมในช่วง [start,end) */
  private async sums(workspaceId: bigint, start: Date, end: Date) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        workspaceId,
        deletedAt: null,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    let income = 0n;
    let expense = 0n;
    let count = 0;
    for (const g of grouped) {
      count += g._count._all;
      if (g.type === 'income') income = g._sum.amount ?? 0n;
      else if (g.type === 'expense') expense = g._sum.amount ?? 0n;
    }
    return { income, expense, count };
  }

  /** breakdown ตามหมวดหมู่ของ type ที่กำหนด */
  private async categoryBreakdown(
    workspaceId: bigint,
    start: Date,
    end: Date,
    type: 'income' | 'expense',
  ): Promise<CategoryRow[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        workspaceId,
        deletedAt: null,
        type,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const ids = grouped
      .map((g) => g.categoryId)
      .filter((id): id is bigint => id != null);
    const cats = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, publicId: true, name: true },
    });
    const map = new Map(cats.map((c) => [c.id, c]));

    const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0n), 0n);
    const rows: CategoryRow[] = grouped.map((g) => {
      const c = g.categoryId ? map.get(g.categoryId) : undefined;
      const amount = g._sum.amount ?? 0n;
      return {
        categoryId: c?.publicId ?? null,
        name: c?.name ?? 'ไม่ระบุหมวดหมู่',
        total: amount.toString(),
        pct:
          total === 0n
            ? 0
            : Math.round((Number(amount) / Number(total)) * 1000) / 10,
      };
    });
    return rows.sort((a, b) => Number(BigInt(b.total) - BigInt(a.total)));
  }

  /** trend รายช่วง (เติม bucket ครบ) */
  private async trend(
    workspaceId: bigint,
    r: ResolvedPeriod,
  ): Promise<BucketRow[]> {
    const rows = await this.prisma.transaction.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        type: { in: ['income', 'expense'] },
        transactionDate: { gte: r.start, lt: r.end },
      },
      select: { type: true, amount: true, transactionDate: true },
    });

    const buckets = enumerateBuckets(r);
    const m = new Map<string, { income: bigint; expense: bigint }>();
    buckets.forEach((b) => m.set(b, { income: 0n, expense: 0n }));
    for (const row of rows) {
      const key = bucketKey(row.transactionDate, r.granularity);
      const cell = m.get(key);
      if (!cell) continue;
      if (row.type === 'income') cell.income += row.amount;
      else cell.expense += row.amount;
    }
    return buckets.map((label) => {
      const cell = m.get(label)!;
      return {
        label,
        income: cell.income.toString(),
        expense: cell.expense.toString(),
        net: (cell.income - cell.expense).toString(),
      };
    });
  }

  /** สร้าง report (ใช้ทั้ง API และ export) */
  async build(
    workspaceId: bigint,
    kind: ReportKind,
    query: ReportQueryDto,
  ): Promise<ReportResult> {
    const r = resolvePeriod(query.period, query.dateFrom, query.dateTo);

    // เลือก type สำหรับ category breakdown ตามชนิดรายงาน
    const breakdownType: 'income' | 'expense' =
      kind === ReportKind.Revenue ? 'income' : 'expense';

    const [cur, prev, categories, trend] = await Promise.all([
      this.sums(workspaceId, r.start, r.end),
      this.sums(workspaceId, r.prevStart, r.prevEnd),
      this.categoryBreakdown(workspaceId, r.start, r.end, breakdownType),
      this.trend(workspaceId, r),
    ]);

    const net = cur.income - cur.expense;
    const prevNet = prev.income - prev.expense;
    const inclusiveEnd = new Date(r.end.getTime() - 86400000);

    return {
      kind,
      period: {
        key: query.period,
        label: r.label,
        start: r.start.toISOString().slice(0, 10),
        end: inclusiveEnd.toISOString().slice(0, 10),
        granularity: r.granularity,
      },
      summary: {
        revenue: cur.income.toString(),
        expense: cur.expense.toString(),
        net: net.toString(),
        margin:
          cur.income === 0n
            ? null
            : Math.round((Number(net) / Number(cur.income)) * 1000) / 10,
        count: cur.count,
        prevRevenue: prev.income.toString(),
        prevExpense: prev.expense.toString(),
        prevNet: prevNet.toString(),
        revenueGrowthPct: growthPct(cur.income, prev.income),
        expenseGrowthPct: growthPct(cur.expense, prev.expense),
        netGrowthPct: growthPct(net, prevNet),
      },
      categories,
      trend,
    };
  }

  revenue(workspaceId: bigint, query: ReportQueryDto) {
    return this.build(workspaceId, ReportKind.Revenue, query);
  }

  expenses(workspaceId: bigint, query: ReportQueryDto) {
    return this.build(workspaceId, ReportKind.Expenses, query);
  }

  profit(workspaceId: bigint, query: ReportQueryDto) {
    return this.build(workspaceId, ReportKind.Profit, query);
  }
}
