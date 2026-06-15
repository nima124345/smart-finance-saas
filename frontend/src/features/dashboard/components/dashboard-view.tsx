"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import { useDashboard } from "../hooks/use-dashboard";
import type { DashboardRange } from "../types";
import { CategoryDonut } from "./category-donut";
import { DashboardOnboarding } from "./dashboard-onboarding";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { IncomeExpenseTrend } from "./income-expense-trend";
import { InsightsCard } from "./insights-card";
import { StatCards } from "./stat-cards";
import { TimeRangeFilter } from "./time-range-filter";
import { RecentTransactions, TopCategories, WalletSummary } from "./widgets";

export function DashboardView() {
  const [range, setRange] = useState<DashboardRange>("this_month");
  const [custom, setCustom] = useState<{ dateFrom?: string; dateTo?: string }>({});

  const query = useDashboard(range, range === "custom" ? custom : undefined);
  const data = query.data;

  return (
    <>
      <PageHeader title="ภาพรวม" description="สรุปการเงินของ workspace นี้" />

      <TimeRangeFilter
        range={range}
        custom={custom}
        onRangeChange={setRange}
        onCustomChange={setCustom}
      />

      {query.isLoading ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !data?.hasData ? (
        <DashboardOnboarding />
      ) : (
        <div
          className={cn(
            "space-y-6 transition-opacity",
            query.isFetching && "opacity-60", // smooth ตอนสลับ filter
          )}
        >
          <InsightsCard data={data} />
          <StatCards data={data} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IncomeExpenseTrend data={data} />
            </div>
            <CategoryDonut data={data} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RecentTransactions data={data} />
            <TopCategories data={data} />
            <WalletSummary data={data} />
          </div>
        </div>
      )}
    </>
  );
}
