"use client";

import { cn } from "@/lib/utils";
import type { UsageMetric } from "../types";

export function UsageBar({
  label,
  metric,
}: {
  label: string;
  metric: UsageMetric;
}) {
  const unlimited = metric.limit == null;
  const pct = unlimited
    ? 0
    : Math.min(100, Math.round((metric.used / metric.limit!) * 100));
  const near = pct >= 80;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {metric.used}
          {unlimited ? " / ไม่จำกัด" : ` / ${metric.limit}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            unlimited ? "bg-income" : near ? "bg-expense" : "bg-primary",
          )}
          style={{ width: unlimited ? "100%" : `${Math.max(3, pct)}%` }}
        />
      </div>
    </div>
  );
}
