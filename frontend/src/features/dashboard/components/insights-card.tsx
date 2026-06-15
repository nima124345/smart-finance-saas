"use client";

import { Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { DashboardOverview } from "../types";

/** Smart summary — สรุปเชิงลึกจาก insights (ไม่ใช่ AI ใหญ่) */
export function InsightsCard({ data }: { data: DashboardOverview }) {
  const { insights } = data;
  const lines: string[] = [];

  if (insights.topExpenseCategory) {
    lines.push(
      `หมวดที่ใช้เงินมากสุดคือ “${insights.topExpenseCategory.name}” (${formatMoney(
        insights.topExpenseCategory.total,
      )})`,
    );
  }
  if (insights.expenseChangePct !== null) {
    const up = insights.expenseChangePct >= 0;
    lines.push(
      `รายจ่าย${up ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(
        insights.expenseChangePct,
      )}% เทียบช่วงก่อนหน้า`,
    );
  }
  if (insights.incomeChangePct !== null) {
    const up = insights.incomeChangePct >= 0;
    lines.push(
      `รายรับ${up ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(
        insights.incomeChangePct,
      )}% (ก่อนหน้า ${formatMoney(insights.prevIncome)})`,
    );
  }
  if (lines.length === 0) lines.push("ยังมีข้อมูลไม่พอสำหรับสรุปเชิงลึก");

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex gap-3 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">สรุปเชิงลึก</p>
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {lines.map((l, i) => (
              <li key={i}>• {l}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
