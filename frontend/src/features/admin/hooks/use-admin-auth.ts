"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { setAdminFlag, clearAdminFlag } from "@/lib/cookie";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { adminAuthApi } from "../api/admin-auth.api";

export function useAdminLogin() {
  const router = useRouter();
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (result) => {
      setAuth({ admin: result.admin, accessToken: result.accessToken });
      setAdminFlag();
      router.replace("/admin");
    },
  });
}

export function useAdminLogout() {
  const clear = useAdminAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: adminAuthApi.logout,
    onSettled: () => {
      clear();
      clearAdminFlag();
      window.location.href = "/admin/login";
    },
  });
}

/** Silent refresh ตอนเปิด admin portal (กู้ session จาก admin cookie) */
export function useAdminSessionBootstrap() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const clear = useAdminAuthStore((s) => s.clear);
  const setBootstrapped = useAdminAuthStore((s) => s.setBootstrapped);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const { accessToken } = await adminAuthApi.refresh();
        useAdminAuthStore.getState().setAccessToken(accessToken);
        const admin = await adminAuthApi.me();
        setAuth({ admin, accessToken });
      } catch {
        clear();
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [setAuth, clear, setBootstrapped]);
}
