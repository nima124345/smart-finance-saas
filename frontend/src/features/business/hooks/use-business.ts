"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { businessApi, type ReportParams } from "../api/business.api";
import type { ReportKind } from "../types";

function useWs() {
  return useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
}

export function useBusinessDashboard() {
  const ws = useWs();
  return useQuery({
    queryKey: ["ws", ws, "business", "dashboard"],
    queryFn: businessApi.dashboard,
    enabled: ws !== "none",
  });
}

export function useReport(kind: ReportKind, params: ReportParams) {
  const ws = useWs();
  return useQuery({
    queryKey: ["ws", ws, "business", "report", kind, params],
    queryFn: () => businessApi.report(kind, params),
    enabled: ws !== "none",
  });
}

export function useInsights() {
  const ws = useWs();
  return useQuery({
    queryKey: ["ws", ws, "business", "insights"],
    queryFn: businessApi.insights,
    enabled: ws !== "none",
  });
}

export function useActivityFeed(action?: string) {
  const ws = useWs();
  return useInfiniteQuery({
    queryKey: ["ws", ws, "activity", action ?? "all"],
    queryFn: ({ pageParam }) =>
      businessApi.activity({ cursor: pageParam, action, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: ws !== "none",
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({
      format,
      params,
    }: {
      format: "pdf" | "excel";
      params: { report: ReportKind } & ReportParams;
    }) => businessApi.exportReport(format, params),
  });
}
