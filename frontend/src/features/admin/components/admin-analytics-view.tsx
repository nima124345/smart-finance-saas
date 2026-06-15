"use client";

import {
  Bar,
  BarChart,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORY_PALETTE, CHART } from "@/features/dashboard/chart-colors";
import { useAdminAnalytics } from "../hooks/use-admin";
import { KpiCard } from "./kpi-card";

interface Analytics {
  dau: number;
  mau: number;
  stickiness: number;
  retention: number;
  avgTransactionsPerUser: number;
  conversionFunnel: {
    signups: number;
    createdWallet: number;
    createdTransaction: number;
    paying: number;
  };
  featureUsage: Record<string, number>;
  note: string;
}

export function AdminAnalyticsView() {
  const q = useAdminAnalytics();
  const d = q.data as unknown as Analytics | undefined;

  if (q.isLoading)
    return (<><PageHeader title="Analytics" /><LoadingState rows={4} /></>);
  if (q.isError || !d)
    return (<><PageHeader title="Analytics" /><ErrorState onRetry={() => q.refetch()} /></>);

  const funnel = [
    { name: "สมัคร", value: d.conversionFunnel.signups, fill: CATEGORY_PALETTE[0] },
    { name: "สร้างกระเป๋า", value: d.conversionFunnel.createdWallet, fill: CATEGORY_PALETTE[1] },
    { name: "บันทึกรายการ", value: d.conversionFunnel.createdTransaction, fill: CATEGORY_PALETTE[2] },
    { name: "จ่ายเงิน", value: d.conversionFunnel.paying, fill: CATEGORY_PALETTE[4] },
  ];
  const features = Object.entries(d.featureUsage).map(([name, value]) => ({ name, value }));

  return (
    <>
      <PageHeader title="Analytics" description="พฤติกรรมและการเติบโตของผู้ใช้" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="DAU" value={String(d.dau)} />
        <KpiCard label="MAU" value={String(d.mau)} />
        <KpiCard label="Stickiness (DAU/MAU)" value={`${d.stickiness}%`} />
        <KpiCard label="Retention" value={`${d.retention}%`} />
        <KpiCard label="เฉลี่ยรายการ/ผู้ใช้" value={String(d.avgTransactionsPerUser)} />
      </div>

      <p className="text-xs text-muted-foreground">ℹ️ {d.note}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Funnel dataKey="value" data={funnel} isAnimationActive>
                    <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" className="text-xs" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Feature Usage (ตามชนิดรายการ)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={features} margin={{ left: -10, right: 8, top: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {features.map((_, i) => <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
