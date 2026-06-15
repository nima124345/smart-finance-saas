"use client";

import { useSessionBootstrap } from "@/features/auth/hooks/use-session";

/** รัน silent refresh ตอน mount (กู้ session จาก cookie) */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  return <>{children}</>;
}
