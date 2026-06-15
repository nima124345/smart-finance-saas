"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRange } from "../types";

export function useDashboard(
  range: DashboardRange,
  custom?: { dateFrom?: string; dateTo?: string },
) {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    // key รวม range → React Query cache แยกตามช่วงเวลา (ไม่ fetch ซ้ำ)
    queryKey: [...queryKeys.dashboard(ws ?? "none"), range, custom ?? null],
    queryFn: () => dashboardApi.overview(range, custom),
    enabled: !!ws,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev, // คงข้อมูลเดิมตอนสลับ filter (ไม่กระพริบ)
  });
}
