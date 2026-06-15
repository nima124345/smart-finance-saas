"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { setAuthFlag, clearAuthFlag } from "@/lib/cookie";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { authApi, type AuthResult } from "../api/auth.api";

/** หลัง login/register: เก็บ auth + flag cookie + hydrate workspaces */
function useAfterAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  return async (result: AuthResult) => {
    setAuth({ user: result.user, accessToken: result.accessToken });
    setAuthFlag();
    // workspace hydration — โหลด workspace แล้ว set current (store ตั้ง active แรกให้)
    const workspaces = await authApi.listWorkspaces();
    setWorkspaces(workspaces);
  };
}

export function useLogin() {
  const router = useRouter();
  const afterAuth = useAfterAuth();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (result) => {
      await afterAuth(result);
      router.replace("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const afterAuth = useAfterAuth();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (result) => {
      await afterAuth(result);
      router.replace("/dashboard");
    },
  });
}

/** Admin portal login — แยกจากผู้เช่า, ไม่ hydrate workspace, ไปที่ /admin */
export function useAdminLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: (result) => {
      setAuth({ user: result.user, accessToken: result.accessToken });
      setAuthFlag();
      router.replace("/admin");
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => router.replace("/login"),
  });
}

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const clearWorkspaces = useWorkspaceStore((s) => s.clear);
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      clearWorkspaces();
      clearAuthFlag();
      router.replace("/login");
    },
  });
}
