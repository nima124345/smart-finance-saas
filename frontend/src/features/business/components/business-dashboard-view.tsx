"use client";

import {
  CalendarDays,
  Coins,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatCardsSkeleton } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { CategoryRow } from "../types";
import { actionMeta, TONE_CLASS } from "../activity-format";
import { useBusinessDashboard } from "../hooks/use-business";
import { BusinessTrendChart } from "./business-trend-chart";
import { GrowthBadge, MetricCard } from "./metric";

function CategoryBars({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: CategoryRow[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          rows.map((c) => (
            <div key={c.categoryId ?? c.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(c.total)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(c.pct, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessDashboardView() {
  const query = useBusinessDashboard();
  const data = query.data;

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="แดชบอร์ดธุรกิจ" description="ภาพรวมการเงินของร้าน" />
        <StatCardsSkeleton />
        <Skeleton className="h-72 w-full rounded-xl" />
      </>
    );
  }
  if (query.isError || !data) {
    return (
      <>
        <PageHeader title="แดชบอร์ดธุรกิจ" />
        <ErrorState onRetry={() => query.refetch()} />
      </>
    );
  }

  const m = data.metrics;
  const net = BigInt(m.netProfit);

  return (
    <>
      <PageHeader
        title="แดชบอร์ดธุรกิจ"
        description={`ภาพรวมเดือน ${data.period.label}`}
      />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="รายได้วันนี้"
          value={formatMoney(m.dailyRevenue)}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <MetricCard
          label="รายได้เดือนนี้"
          value={formatMoney(m.monthlyRevenue)}
          icon={<TrendingUp className="h-4 w-4 text-income" />}
          footer={
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              เทียบเดือนก่อน <GrowthBadge pct={m.revenueGrowthPct} />
            </span>
          }
        />
        <MetricCard
          label="รายจ่ายเดือนนี้"
          value={formatMoney(m.monthlyExpenses)}
          icon={<TrendingDown className="h-4 w-4 text-expense" />}
          footer={
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              เทียบเดือนก่อน <GrowthBadge pct={m.expenseGrowthPct} invert />
            </span>
          }
        />
        <MetricCard
          label="กำไรสุทธิ"
          value={formatMoney(m.netProfit)}
          icon={<Coins className="h-4 w-4" />}
          accent={net >= 0n ? "text-income" : "text-expense"}
          footer={
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              อัตรากำไร {m.margin === null ? "—" : `${m.margin}%`}
            </span>
          }
        />
      </div>

      <BusinessTrendChart
        revenueTrend={data.revenueTrend}
        expenseTrend={data.expenseTrend}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBars
          title="หมวดรายได้สูงสุด"
          rows={data.topRevenueCategories}
          emptyText="ยังไม่มีรายได้ในเดือนนี้"
        />
        <CategoryBars
          title="หมวดค่าใช้จ่ายสูงสุด"
          rows={data.topExpenseCategories}
          emptyText="ยังไม่มีค่าใช้จ่ายในเดือนนี้"
        />
      </div>

      {/* Team activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            กิจกรรมทีมล่าสุด ({data.teamActivity.summary.total} ครั้งใน{" "}
            {data.teamActivity.summary.sinceDays} วัน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.teamActivity.recent.length === 0 ? (
            <EmptyState title="ยังไม่มีกิจกรรม" />
          ) : (
            <ul className="space-y-3">
              {data.teamActivity.recent.map((a) => {
                const meta = actionMeta(a.action);
                const Icon = meta.icon;
                return (
                  <li key={a.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[meta.tone]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{a.actor?.name ?? "ระบบ"}</span>{" "}
                      <span className="text-muted-foreground">{meta.label}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
