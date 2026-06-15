"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { CATEGORY_PALETTE } from "../chart-colors";
import type { DashboardOverview } from "../types";

export function CategoryDonut({ data }: { data: DashboardOverview }) {
  const slices = data.categoryBreakdown
    .filter((c) => c.type === "expense")
    .map((c) => ({ name: c.name, value: Number(c.total) / 100 }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">สัดส่วนรายจ่ายตามหมวดหมู่</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {slices.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              ยังไม่มีรายจ่ายในช่วงนี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatMoney(Math.round(v * 100))}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {slices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {slices.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
                />
                {s.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
