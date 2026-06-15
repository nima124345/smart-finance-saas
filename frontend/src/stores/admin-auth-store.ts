import { create } from "zustand";

export interface AdminProfile {
  publicId: string;
  name: string;
  email: string;
}

/**
 * Admin auth state — แยกจาก tenant authStore โดยสมบูรณ์ (คนละ token namespace)
 * access token เก็บใน memory; refresh ผ่าน httpOnly cookie admin_refresh_token
 */
interface AdminAuthState {
  admin: AdminProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  bootstrapped: boolean;

  setAuth: (p: { admin: AdminProfile; accessToken: string }) => void;
  setAccessToken: (t: string) => void;
  setBootstrapped: (v: boolean) => void;
  clear: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  bootstrapped: false,

  setAuth: ({ admin, accessToken }) =>
    set({ admin, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  clear: () => set({ admin: null, accessToken: null, isAuthenticated: false }),
}));
