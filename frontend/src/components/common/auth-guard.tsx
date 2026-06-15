"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { SystemRole } from "@/types/domain";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Client-side guard (fine-grained) — เสริม middleware
 *  - รอ session bootstrap (silent refresh) เสร็จก่อน ค่อยตัดสิน
 *  - ยังไม่ล็อกอิน → /login · requireRole=admin แต่ไม่ใช่ → /dashboard
 */
export function AuthGuard({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: SystemRole;
}) {
  const router = useRouter();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const systemRole = useAuthStore((s) => s.user?.systemRole);

  useEffect(() => {
    if (!bootstrapped) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (requireRole === "admin" && systemRole !== "admin") {
      router.replace("/dashboard");
    }
  }, [bootstrapped, isAuthenticated, systemRole, requireRole, router]);

  // ระหว่าง bootstrap หรือยังไม่ผ่านสิทธิ์ → splash (กัน flash หน้า protected)
  if (!bootstrapped || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
