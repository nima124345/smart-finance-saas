"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { CHART } from "../chart-colors";
import type { DashboardOverview } from "../types";

export function IncomeExpenseTrend({ data }: { data: DashboardOverview }) {
  const chartData = data.trend.map((t) => ({
    label: t.label,
    income: Number(t.income) / 100,
    expense: Number(t.expense) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายรับ vs รายจ่าย</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.income} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.expense} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART.expense} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: CHART.muted }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART.muted }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v: number) => `฿${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => formatMoney(Math.round(v * 100))}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="รายรับ"
                stroke={CHART.income}
                fill="url(#inc)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="รายจ่าย"
                stroke={CHART.expense}
                fill="url(#exp)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
