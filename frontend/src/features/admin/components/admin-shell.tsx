"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { adminNav } from "../config/admin-nav";
import { useAdminLogout } from "../hooks/use-admin-auth";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const admin = useAdminAuthStore((s) => s.admin);
  const logout = useAdminLogout();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={120}
            height={120}
            priority
            className="h-8 w-auto object-contain"
          />
          <Badge className="gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3" /> Admin
          </Badge>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {adminNav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <span className="text-sm font-medium text-muted-foreground">
            ระบบผู้ดูแล SaaS
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="แจ้งเตือน">
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="สลับธีม"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{admin?.name}</p>
              <p className="text-xs text-muted-foreground">{admin?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="ออกจากระบบ"
              onClick={() => logout.mutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
