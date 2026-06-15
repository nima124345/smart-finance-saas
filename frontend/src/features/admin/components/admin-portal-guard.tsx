"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { useAdminSessionBootstrap } from "../hooks/use-admin-auth";

/**
 * Guard ของ Admin Portal — bootstrap (silent refresh) + ต้องมี admin session
 * ไม่ใช่ admin → /admin/login
 */
export function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  useAdminSessionBootstrap();
  const router = useRouter();
  const bootstrapped = useAdminAuthStore((s) => s.bootstrapped);
  const isAuth = useAdminAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (bootstrapped && !isAuth) router.replace("/admin/login");
  }, [bootstrapped, isAuth, router]);

  if (!bootstrapped || !isAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
