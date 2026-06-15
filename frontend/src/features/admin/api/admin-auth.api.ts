import { adminApi } from "@/lib/api/admin-axios";
import type { ApiResponse } from "@/types/api";
import type { AdminProfile } from "@/stores/admin-auth-store";

export interface AdminAuthResult {
  accessToken: string;
  admin: AdminProfile;
}

export const adminAuthApi = {
  async login(body: {
    email: string;
    password: string;
  }): Promise<AdminAuthResult> {
    const { data } = await adminApi.post<ApiResponse<AdminAuthResult>>(
      "/admin/auth/login",
      body,
    );
    return data.data;
  },
  async refresh(): Promise<AdminAuthResult> {
    const { data } = await adminApi.post<ApiResponse<AdminAuthResult>>(
      "/admin/auth/refresh",
    );
    return data.data;
  },
  async me(): Promise<AdminProfile> {
    const { data } = await adminApi.get<ApiResponse<AdminProfile>>(
      "/admin/auth/me",
    );
    return data.data;
  },
  async logout(): Promise<void> {
    await adminApi.post("/admin/auth/logout");
  },
};
