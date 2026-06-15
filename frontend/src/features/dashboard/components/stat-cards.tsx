"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "../types";

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-income" : "text-expense",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", accent)}>
          {value}
        </p>
        {footer && <div className="mt-1.5">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export function StatCards({ data }: { data: DashboardOverview }) {
  const net = BigInt(data.stats.net);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="ยอดเงินรวม"
        value={formatMoney(data.stats.totalBalance)}
        icon={<Wallet className="h-4 w-4" />}
      />
      <StatCard
        label="รายรับ"
        value={formatMoney(data.stats.income)}
        icon={<TrendingUp className="h-4 w-4 text-income" />}
        footer={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            เทียบช่วงก่อน <ChangeBadge pct={data.insights.incomeChangePct} />
          </span>
        }
      />
      <StatCard
        label="รายจ่าย"
        value={formatMoney(data.stats.expense)}
        icon={<TrendingDown className="h-4 w-4 text-expense" />}
        footer={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            เทียบช่วงก่อน <ChangeBadge pct={data.insights.expenseChangePct} />
          </span>
        }
      />
      <StatCard
        label="กระแสเงินสุทธิ"
        value={formatMoney(data.stats.net)}
        icon={<Wallet className="h-4 w-4" />}
        accent={net >= 0n ? "text-income" : "text-expense"}
      />
    </div>
  );
}
