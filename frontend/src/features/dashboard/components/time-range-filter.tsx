"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DashboardRange } from "../types";

const PRESETS: { key: DashboardRange; label: string }[] = [
  { key: "this_month", label: "เดือนนี้" },
  { key: "last_month", label: "เดือนก่อน" },
  { key: "3m", label: "3 เดือน" },
  { key: "6m", label: "6 เดือน" },
  { key: "12m", label: "12 เดือน" },
  { key: "custom", label: "กำหนดเอง" },
];

export function TimeRangeFilter({
  range,
  custom,
  onRangeChange,
  onCustomChange,
}: {
  range: DashboardRange;
  custom: { dateFrom?: string; dateTo?: string };
  onRangeChange: (r: DashboardRange) => void;
  onCustomChange: (c: { dateFrom?: string; dateTo?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onRangeChange(p.key)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              range === p.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-8 w-36"
            value={custom.dateFrom ?? ""}
            onChange={(e) => onCustomChange({ ...custom, dateFrom: e.target.value })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            className="h-8 w-36"
            value={custom.dateTo ?? ""}
            onChange={(e) => onCustomChange({ ...custom, dateTo: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
