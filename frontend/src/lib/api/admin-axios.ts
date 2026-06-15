import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { API_URL } from "@/lib/constants";
import { clearAdminFlag } from "@/lib/cookie";
import { useAdminAuthStore } from "@/stores/admin-auth-store";

/**
 * Axios instance ของ Admin Portal — แยกจาก tenant client โดยสมบูรณ์
 *  - แนบ admin access token (memory)
 *  - 401 → refresh ผ่าน admin_refresh_token cookie (/admin/auth/refresh)
 */
export const adminApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 20000,
});

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let refreshing = false;
let queue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  queue.forEach((cb) => cb(t));
  queue = [];
};

async function callAdminRefresh(): Promise<string> {
  const { data } = await axios.post(
    `${API_URL}/admin/auth/refresh`,
    {},
    { withCredentials: true },
  );
  return data.data.accessToken as string;
}

adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const isAuthEndpoint = original?.url?.includes("/admin/auth/");
    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push((t) => {
          if (!t) return reject(error);
          original.headers.set("Authorization", `Bearer ${t}`);
          resolve(adminApi(original));
        });
      });
    }
    refreshing = true;
    try {
      const token = await callAdminRefresh();
      useAdminAuthStore.getState().setAccessToken(token);
      flush(token);
      original.headers.set("Authorization", `Bearer ${token}`);
      return adminApi(original);
    } catch (e) {
      flush(null);
      useAdminAuthStore.getState().clear();
      clearAdminFlag();
      if (typeof window !== "undefined") window.location.href = "/admin/login";
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  },
);

export function getAdminErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { error?: { message?: string | string[] } })
      ?.error?.message;
    if (Array.isArray(msg)) return msg[0];
    if (msg) return msg;
    return error.message;
  }
  return "เกิดข้อผิดพลาด";
}
