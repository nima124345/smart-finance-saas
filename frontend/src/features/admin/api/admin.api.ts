import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  activeSubscriptions: number;
  payingCustomers: number;
  trialing: number;
  planBreakdown: { free: number; pro: number; premium: number };
  mrr: string;
  arrEstimate: string;
  growth: { newUsersLast30Days: number };
}

export interface AdminUser {
  publicId: string;
  name: string;
  email: string;
  systemRole: string;
  workspaceCount: number;
  createdAt: string;
}

export interface AdminUsersPage {
  items: AdminUser[];
  page: number;
  perPage: number;
  total: number;
}

export const adminApi = {
  async dashboard(): Promise<AdminStats> {
    const { data } = await api.get<ApiResponse<AdminStats>>(
      endpoints.admin.dashboard,
    );
    return data.data;
  },
  async users(page = 1): Promise<AdminUsersPage> {
    const { data } = await api.get<ApiResponse<AdminUsersPage>>(
      endpoints.admin.users,
      { params: { page } },
    );
    return data.data;
  },
};
