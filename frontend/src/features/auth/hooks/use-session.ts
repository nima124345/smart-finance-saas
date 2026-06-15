"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { authApi } from "../api/auth.api";

/**
 * Silent refresh ตอนเปิดแอป — กู้ session จาก httpOnly refresh cookie
 * (access token อยู่ใน memory จึงหายตอน reload)
 *   refresh → ได้ accessToken → /me → hydrate workspaces → bootstrapped=true
 */
export function useSessionBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        // ตั้ง token ก่อน เพื่อให้ /me แนบ Bearer ได้
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await authApi.me();
        setAuth({ user, accessToken });
        const workspaces = await authApi.listWorkspaces();
        setWorkspaces(workspaces);
      } catch {
        clear(); // ไม่มี cookie / หมดอายุ → ยังไม่ล็อกอิน
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [setAuth, clear, setBootstrapped, setWorkspaces]);
}
