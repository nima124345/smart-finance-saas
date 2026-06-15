"use client";

import Image from "next/image";
import { LogOut, Moon, ShieldCheck, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/auth.api";
import { APP_NAME } from "@/lib/constants";
import { clearAuthFlag } from "@/lib/cookie";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

/** Shell ของ Admin Portal — แยก layout จากฝั่งผู้เช่าโดยสมบูรณ์ */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const userName = useAuthStore((s) => s.user?.name);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
      clearAuthFlag();
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={120}
            height={120}
            priority
            className="h-8 w-auto object-contain"
          />
          <Badge className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Admin Portal
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="สลับธีม"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          {userName && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="ออกจากระบบ"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-6xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
