"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { subscriptionsApi } from "../api/subscriptions.api";
import type { PlanFeatures } from "../types";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: subscriptionsApi.plans,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCurrentSubscription() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: queryKeys.subscription(ws ?? "none"),
    queryFn: subscriptionsApi.current,
    enabled: !!ws,
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
  return useMutation({
    mutationFn: subscriptionsApi.changePlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ws", ws] }),
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
  return useMutation({
    mutationFn: subscriptionsApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ws", ws] }),
  });
}

/** Feature gating — เช็คว่า plan ปัจจุบันเปิด feature นี้ไหม */
export function useFeature(flag: keyof PlanFeatures): boolean {
  const { data } = useCurrentSubscription();
  return Boolean(data?.plan.features[flag]);
}
