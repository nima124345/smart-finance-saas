import { create } from "zustand";

import type { User } from "@/types/domain";

/**
 * Auth state — เก็บใน memory เท่านั้น (ไม่ persist)
 *  - accessToken: memory (หายตอน reload → silent refresh กู้คืนผ่าน httpOnly cookie)
 *  - refresh token: httpOnly cookie ฝั่ง backend (ไม่อยู่ที่นี่/localStorage)
 *  - bootstrapped: ทำ silent refresh ตอนเปิดแอปเสร็จหรือยัง (กัน AuthGuard เด้งก่อนเวลา)
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  bootstrapped: boolean;

  setAuth: (payload: { user: User; accessToken: string }) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setBootstrapped: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  bootstrapped: false,

  setAuth: ({ user, accessToken }) =>
    set({ user, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  clear: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
