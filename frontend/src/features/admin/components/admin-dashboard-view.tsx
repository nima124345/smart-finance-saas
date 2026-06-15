"use client";

import {
  Banknote,
  Building2,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORY_PALETTE, CHART } from "@/features/dashboard/chart-colors";
import { formatDate, formatMoney } from "@/lib/format";
import { useAdminDashboard } from "../hooks/use-admin";
import { KpiCard } from "./kpi-card";

export function AdminDashboardView() {
  const q = useAdminDashboard();

  if (q.isLoading)
    return (
      <>
        <PageHeader title="Dashboard" />
        <LoadingState rows={4} />
      </>
    );
  if (q.isError || !q.data)
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState onRetry={() => q.refetch()} />
      </>
    );

  const { kpis, charts, widgets } = q.data;
  const growth = charts.userGrowth.map((g) => ({ ...g }));
  const revenue = charts.revenueGrowth.map((r) => ({
    month: r.month,
    total: Number(r.total) / 100,
  }));
  const plan = [
    { name: "Free", value: charts.planDistribution.free },
    { name: "Pro", value: charts.planDistribution.pro },
    { name: "Premium", value: charts.planDistribution.premium },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="ภาพรวมธุรกิจ SaaS" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ผู้ใช้ทั้งหมด" value={String(kpis.totalUsers)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Workspaces" value={String(kpis.totalWorkspaces)} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Subscriptions" value={String(kpis.activeSubscriptions)} icon={<CreditCard className="h-4 w-4" />} />
        <KpiCard label="Trial" value={String(kpis.trialUsers)} icon={<CreditCard className="h-4 w-4" />} />
        <KpiCard label="ลูกค้าจ่ายเงิน" value={String(kpis.payingUsers)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="MRR" value={formatMoney(kpis.mrr)} icon={<Banknote className="h-4 w-4 text-income" />} accent="text-income" />
        <KpiCard label="ARR" value={formatMoney(kpis.arr)} icon={<TrendingUp className="h-4 w-4 text-income" />} />
        <KpiCard label="Churn Rate" value={`${kpis.churnRate}%`} icon={<TrendingDown className="h-4 w-4 text-expense" />} accent="text-expense" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">User Growth (30 วัน)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ left: -20, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART.muted }} tickLine={false} axisLine={false} minTickGap={28} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="สมัครใหม่" stroke={CHART.primary} fill="url(#ag)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={plan} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="none">
                    {plan.map((_, i) => <Cell key={i} fill={CATEGORY_PALETTE[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Growth (6 เดือน)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ left: -10, right: 8, top: 4 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatMoney(Math.round(v * 100))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" name="รายได้" fill={CHART.income} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">สมัครใหม่ล่าสุด</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {widgets.recentSignups.map((u, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate">{u.email}</span>
                <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">ชำระเงินล่าสุด</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {widgets.latestPayments.length === 0 ? (
              <p className="py-3 text-center text-muted-foreground">ยังไม่มี</p>
            ) : widgets.latestPayments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate">{p.workspace} · {p.planCode}</span>
                <span className="font-mono">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">ใกล้หมดอายุ</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {widgets.expiringSubscriptions.length === 0 ? (
              <p className="py-3 text-center text-muted-foreground">ไม่มี</p>
            ) : widgets.expiringSubscriptions.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate">{s.workspace} · {s.plan}</span>
                <span className="text-muted-foreground">{formatDate(s.currentPeriodEnd)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
