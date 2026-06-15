import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { User, Workspace } from "@/types/domain";

export interface AuthResult {
  accessToken: string;
  user: User;
}

/** เลเยอร์เรียก API ของ auth (unwrap envelope) */
export const authApi = {
  async register(body: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>(
      endpoints.auth.register,
      body,
    );
    return data.data;
  },

  async login(body: { email: string; password: string }): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>(
      endpoints.auth.login,
      body,
    );
    return data.data;
  },

  /** เข้าระบบผู้ดูแล — backend ปฏิเสธบัญชีที่ไม่ใช่ admin (403) */
  async adminLogin(body: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>(
      endpoints.auth.adminLogin,
      body,
    );
    return data.data;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>(
      endpoints.auth.refresh,
    );
    return data.data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(endpoints.auth.me);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post(endpoints.auth.logout);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      endpoints.auth.forgotPassword,
      { email },
    );
    return data.data;
  },

  async resetPassword(body: {
    email: string;
    token: string;
    password: string;
  }): Promise<{ message: string }> {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      endpoints.auth.resetPassword,
      body,
    );
    return data.data;
  },

  /** workspace ทั้งหมดของ user (hydrate หลัง login) */
  async listWorkspaces(): Promise<Workspace[]> {
    const { data } = await api.get<ApiResponse<Workspace[]>>(
      endpoints.workspaces.list,
    );
    return data.data;
  },
};
