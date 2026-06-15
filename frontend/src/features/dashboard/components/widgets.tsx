"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORY_PALETTE } from "../chart-colors";
import type { DashboardOverview } from "../types";

const TYPE_META = {
  income: { label: "รายรับ", variant: "income" as const, sign: "+" },
  expense: { label: "รายจ่าย", variant: "expense" as const, sign: "-" },
  transfer: { label: "โอน", variant: "transfer" as const, sign: "" },
};

export function RecentTransactions({ data }: { data: DashboardOverview }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">รายการล่าสุด</CardTitle>
        <Link href="/transactions" className="text-xs text-primary hover:underline">
          ดูทั้งหมด
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {data.recentTransactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีรายการ
          </p>
        ) : (
          data.recentTransactions.map((t) => {
            const meta = TYPE_META[t.type];
            return (
              <div
                key={t.publicId}
                className="flex items-center justify-between gap-2 py-1.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="truncate text-sm">
                      {t.category?.name ?? t.note ?? t.wallet.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(t.transactionDate)}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm tabular-nums",
                    t.type === "income" && "text-income",
                    t.type === "expense" && "text-expense",
                  )}
                >
                  {meta.sign}
                  {formatMoney(t.amount)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function TopCategories({ data }: { data: DashboardOverview }) {
  const top = data.topExpenseCategories;
  const max = top.length ? Number(top[0].total) : 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">หมวดรายจ่ายสูงสุด</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            ยังไม่มีรายจ่าย
          </p>
        ) : (
          top.map((c, i) => (
            <div key={c.categoryId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{c.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatMoney(c.total)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (Number(c.total) / max) * 100)}%`,
                    background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function WalletSummary({ data }: { data: DashboardOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">กระเป๋าเงิน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.walletSummary.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            ยังไม่มีกระเป๋า
          </p>
        ) : (
          data.walletSummary.map((w) => (
            <div
              key={w.publicId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{w.name}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatMoney(w.balance)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
