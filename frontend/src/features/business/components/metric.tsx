"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GrowthBadge({
  pct,
  invert = false,
}: {
  pct: number | null;
  invert?: boolean; // ค่าใช้จ่าย: ขึ้น = แย่ (สีแดง)
}) {
  if (pct === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        good ? "text-income" : "text-expense",
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(pct)}%
    </span>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  accent,
  footer,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p
          className={cn(
            "mt-2 font-mono text-2xl font-semibold tabular-nums",
            accent,
          )}
        >
          {value}
        </p>
        {footer && <div className="mt-1.5">{footer}</div>}
      </CardContent>
    </Card>
  );
}
