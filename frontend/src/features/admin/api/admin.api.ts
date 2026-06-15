import { adminApi } from "@/lib/api/admin-axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type { PlanCode } from "@/types/domain";

const get = async <T>(url: string, params?: unknown): Promise<T> =>
  (await adminApi.get<ApiResponse<T>>(url, { params })).data.data;
const post = async <T>(url: string, body?: unknown): Promise<T> =>
  (await adminApi.post<ApiResponse<T>>(url, body)).data.data;

// ── types ──
export interface AdminDashboard {
  kpis: {
    totalUsers: number;
    totalWorkspaces: number;
    activeSubscriptions: number;
    trialUsers: number;
    payingUsers: number;
    mrr: string;
    arr: string;
    churnRate: number;
  };
  charts: {
    userGrowth: { date: string; count: number }[];
    revenueGrowth: { month: string; total: string }[];
    planDistribution: { free: number; pro: number; premium: number };
    conversion: { freeToPaid: number };
  };
  widgets: {
    recentSignups: { name: string; email: string; createdAt: string }[];
    latestPayments: {
      workspace: string;
      amount: string;
      planCode: string;
      reviewedAt: string | null;
    }[];
    expiringSubscriptions: {
      workspace: string;
      plan: string;
      currentPeriodEnd: string;
    }[];
  };
}

export interface AdminUserRow {
  publicId: string;
  name: string;
  email: string;
  systemRole: string;
  plan: string;
  status: "active" | "suspended";
  workspaceCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminWorkspaceRow {
  publicId: string;
  name: string;
  type: string;
  owner: string;
  plan: string;
  walletCount: number;
  transactionCount: number;
  status: "active" | "suspended";
  createdAt: string;
}

export interface PaymentRow {
  publicId: string;
  workspace: string;
  planCode: string;
  amount: string;
  method: string;
  status: "pending" | "approved" | "rejected";
  reference: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

export const adminApiClient = {
  dashboard: () => get<AdminDashboard>("/admin/dashboard"),

  // users
  users: (params: Record<string, unknown>) =>
    get<Paginated<AdminUserRow>>("/admin/users", params),
  suspendUser: (id: string) => post(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => post(`/admin/users/${id}/activate`),
  resetUserPassword: (id: string) =>
    post<{ tempPassword: string }>(`/admin/users/${id}/reset-password`),
  changeUserPlan: (id: string, plan: PlanCode) =>
    post(`/admin/users/${id}/change-plan`, { plan }),
  impersonate: (id: string) =>
    post<{ accessToken: string; user: unknown; workspacePublicId: string | null }>(
      `/admin/users/${id}/impersonate`,
    ),
  deleteUser: (id: string) => adminApi.delete(`/admin/users/${id}`),

  // billing
  billingOverview: () =>
    get<{
      subscriptionsByStatus: Record<string, number>;
      revenue: {
        mrr: string;
        arr: string;
        totalRevenue: string;
        paidPayments: number;
        payingUsers: number;
      };
    }>("/admin/billing/overview"),
  payments: (status?: string) =>
    get<PaymentRow[]>("/admin/billing/payments", status ? { status } : undefined),
  approvePayment: (id: string) => post(`/admin/billing/payments/${id}/approve`),
  rejectPayment: (id: string) => post(`/admin/billing/payments/${id}/reject`),

  // workspaces
  workspaces: (params: Record<string, unknown>) =>
    get<Paginated<AdminWorkspaceRow>>("/admin/workspaces", params),
  suspendWorkspace: (id: string) => post(`/admin/workspaces/${id}/suspend`),
  restoreWorkspace: (id: string) => post(`/admin/workspaces/${id}/restore`),
  forceWorkspacePlan: (id: string, plan: PlanCode) =>
    post(`/admin/workspaces/${id}/force-plan`, { plan }),
  deleteWorkspace: (id: string) => adminApi.delete(`/admin/workspaces/${id}`),

  // analytics
  analytics: () => get<Record<string, unknown>>("/admin/analytics"),

  // support
  tickets: (status?: string) =>
    get<unknown[]>("/admin/support/tickets", status ? { status } : undefined),
  closeTicket: (id: string) => post(`/admin/support/tickets/${id}/close`),
  trace: (query: string) => get<Record<string, unknown>>("/admin/support/trace", { query }),

  // settings
  settings: () => get<Record<string, unknown>>("/admin/settings"),
  updatePlan: (code: string, body: Record<string, unknown>) =>
    adminApi.patch(`/admin/settings/plans/${code}`, body),
  updateSetting: (key: string, body: Record<string, unknown>) =>
    adminApi.patch(`/admin/settings/app/${key}`, body),

  // audit
  audit: (params: Record<string, unknown>) =>
    get<{ items: unknown[]; total: number }>("/admin/audit", params),
};
