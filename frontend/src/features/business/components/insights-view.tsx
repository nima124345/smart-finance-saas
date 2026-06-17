"use client";

import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Lightbulb,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import type { InsightSeverity } from "../types";
import { useInsights } from "../hooks/use-business";

const SEVERITY: Record<
  InsightSeverity,
  { icon: LucideIcon; badge: string; ring: string; label: string }
> = {
  critical: {
    icon: AlertOctagon,
    badge: "bg-expense/10 text-expense",
    ring: "border-expense/30",
    label: "วิกฤต",
  },
  warning: {
    icon: AlertTriangle,
    badge: "bg-amber-500/10 text-amber-600",
    ring: "border-amber-500/30",
    label: "ควรระวัง",
  },
  positive: {
    icon: TrendingUp,
    badge: "bg-income/10 text-income",
    ring: "border-income/30",
    label: "ดี",
  },
  info: {
    icon: Info,
    badge: "bg-transfer/10 text-transfer",
    ring: "border-transfer/30",
    label: "ข้อมูล",
  },
};

export function InsightsView() {
  const query = useInsights();
  const data = query.data;

  return (
    <>
      <PageHeader
        title="AI Insights"
        description="วิเคราะห์การเงินธุรกิจอัตโนมัติพร้อมคำแนะนำ"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Premium
          </span>
        }
      />

      {query.isLoading ? (
        <LoadingState rows={4} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="ยังไม่มีข้อสังเกตเด่นในเดือนนี้"
          description="เมื่อมีข้อมูลมากขึ้น ระบบจะวิเคราะห์แนวโน้มและความเสี่ยงให้อัตโนมัติ"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.insights.map((ins, i) => {
            const s = SEVERITY[ins.severity];
            const Icon = s.icon;
            return (
              <Card key={`${ins.code}-${i}`} className={cn("border", s.ring)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        s.badge,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{ins.title}</h3>
                        {ins.metric && (
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium",
                              s.badge,
                            )}
                          >
                            {ins.metric}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ins.message}
                      </p>
                      {ins.recommendation && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-xs">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{ins.recommendation}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
