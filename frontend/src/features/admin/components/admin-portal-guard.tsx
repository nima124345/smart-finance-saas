"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Guard ของ Admin Portal — ต้องล็อกอิน + system_role = admin เท่านั้น
 * ถ้าไม่ใช่ (รวมถึงผู้เช่า) → เด้งไป /admin/login
 */
export function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.systemRole);
  const isAdmin = isAuthenticated && role === "admin";

  useEffect(() => {
    if (bootstrapped && !isAdmin) router.replace("/admin/login");
  }, [bootstrapped, isAdmin, router]);

  if (!bootstrapped || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
