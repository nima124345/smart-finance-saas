import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { API_URL, WORKSPACE_HEADER } from "@/lib/constants";
import { clearAuthFlag } from "@/lib/cookie";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { endpoints } from "./endpoints";

/**
 * Axios instance กลาง
 *  - withCredentials: ส่ง/รับ httpOnly refresh cookie (cross-origin)
 *  - request: แนบ access token (memory) + X-Workspace-Id
 *  - 401: silent refresh (cookie) + queue ระหว่าง refresh แล้ว retry
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);

  const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
  if (workspaceId) config.headers.set(WORKSPACE_HEADER, workspaceId);

  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

/** เรียก refresh แยก (axios เปล่า) กัน interceptor วนซ้ำ — refresh token มาจาก cookie */
async function callRefresh(): Promise<string> {
  const { data } = await axios.post(
    `${API_URL}${endpoints.auth.refresh}`,
    {},
    { withCredentials: true },
  );
  return data.data.accessToken as string;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // plan limit (403 PLAN_LIMIT_*) → เปิด upgrade modal ทั่วระบบ
    const errCode = (error.response?.data as { error?: { code?: string } })?.error
      ?.code;
    if (error.response?.status === 403 && errCode?.startsWith("PLAN_LIMIT")) {
      const msg = (error.response?.data as { error?: { message?: string } })?.error
        ?.message;
      useUiStore.getState().setLimitReached(msg ?? "ถึงขีดจำกัดของแพ็กเกจแล้ว");
    }

    const isAuthEndpoint = original?.url?.includes("/auth/");
    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) return reject(error);
          original.headers.set("Authorization", `Bearer ${token}`);
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const accessToken = await callRefresh();
      useAuthStore.getState().setAccessToken(accessToken);
      flushQueue(accessToken);
      original.headers.set("Authorization", `Bearer ${accessToken}`);
      return api(original);
    } catch (e) {
      flushQueue(null);
      useAuthStore.getState().clear();
      clearAuthFlag();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { error?: { message?: string | string[] } })
      ?.error?.message;
    if (Array.isArray(msg)) return msg[0];
    if (msg) return msg;
    return error.message;
  }
  return "เกิดข้อผิดพลาดที่ไม่รู้จัก";
}
