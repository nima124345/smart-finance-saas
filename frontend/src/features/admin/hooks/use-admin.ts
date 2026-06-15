"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PlanCode } from "@/types/domain";
import { adminApiClient } from "../api/admin.api";

const useInvalidate = () => {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: ["admin", key] });
};

// ── Dashboard ──
export const useAdminDashboard = () =>
  useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApiClient.dashboard });

// ── Users ──
export const useAdminUsers = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApiClient.users(params),
  });

export function useUserActions() {
  const invalidate = useInvalidate();
  const opts = { onSuccess: () => invalidate("users") };
  return {
    suspend: useMutation({ mutationFn: adminApiClient.suspendUser, ...opts }),
    activate: useMutation({ mutationFn: adminApiClient.activateUser, ...opts }),
    remove: useMutation({ mutationFn: adminApiClient.deleteUser, ...opts }),
    resetPassword: useMutation({ mutationFn: adminApiClient.resetUserPassword }),
    changePlan: useMutation({
      mutationFn: (v: { id: string; plan: PlanCode }) =>
        adminApiClient.changeUserPlan(v.id, v.plan),
      ...opts,
    }),
    impersonate: useMutation({ mutationFn: adminApiClient.impersonate }),
  };
}

// ── Billing ──
export const useBillingOverview = () =>
  useQuery({ queryKey: ["admin", "billing"], queryFn: adminApiClient.billingOverview });

export const usePayments = (status?: string) =>
  useQuery({
    queryKey: ["admin", "payments", status],
    queryFn: () => adminApiClient.payments(status),
  });

export function usePaymentActions() {
  const qc = useQueryClient();
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    qc.invalidateQueries({ queryKey: ["admin", "billing"] });
  };
  return {
    approve: useMutation({ mutationFn: adminApiClient.approvePayment, onSuccess }),
    reject: useMutation({ mutationFn: adminApiClient.rejectPayment, onSuccess }),
  };
}

// ── Workspaces ──
export const useAdminWorkspaces = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ["admin", "workspaces", params],
    queryFn: () => adminApiClient.workspaces(params),
  });

export function useWorkspaceActions() {
  const invalidate = useInvalidate();
  const opts = { onSuccess: () => invalidate("workspaces") };
  return {
    suspend: useMutation({ mutationFn: adminApiClient.suspendWorkspace, ...opts }),
    restore: useMutation({ mutationFn: adminApiClient.restoreWorkspace, ...opts }),
    remove: useMutation({ mutationFn: adminApiClient.deleteWorkspace, ...opts }),
    forcePlan: useMutation({
      mutationFn: (v: { id: string; plan: PlanCode }) =>
        adminApiClient.forceWorkspacePlan(v.id, v.plan),
      ...opts,
    }),
  };
}

// ── Analytics ──
export const useAdminAnalytics = () =>
  useQuery({ queryKey: ["admin", "analytics"], queryFn: adminApiClient.analytics });

// ── Support ──
export const useTickets = (status?: string) =>
  useQuery({
    queryKey: ["admin", "tickets", status],
    queryFn: () => adminApiClient.tickets(status),
  });

export function useSupportActions() {
  const invalidate = useInvalidate();
  return {
    close: useMutation({
      mutationFn: adminApiClient.closeTicket,
      onSuccess: () => invalidate("tickets"),
    }),
  };
}

// ── Settings ──
export const useAdminSettings = () =>
  useQuery({ queryKey: ["admin", "settings"], queryFn: adminApiClient.settings });

export function useSettingsActions() {
  const invalidate = useInvalidate();
  const opts = { onSuccess: () => invalidate("settings") };
  return {
    updatePlan: useMutation({
      mutationFn: (v: { code: string; body: Record<string, unknown> }) =>
        adminApiClient.updatePlan(v.code, v.body),
      ...opts,
    }),
    updateSetting: useMutation({
      mutationFn: (v: { key: string; body: Record<string, unknown> }) =>
        adminApiClient.updateSetting(v.key, v.body),
      ...opts,
    }),
  };
}

// ── Audit ──
export const useAdminAudit = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: () => adminApiClient.audit(params),
  });
