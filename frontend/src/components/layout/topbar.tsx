"use client";

import { LogOut, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { WorkspaceSwitcher } from "./workspace-switcher";

/**
 * Topbar (skeleton): workspace switcher + theme toggle + user menu
 * TODO(Step 5+): user dropdown (profile, logout), command palette, breadcrumbs
 */
export function Topbar() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const userName = useAuthStore((s) => s.user?.name);
  const logout = useLogout();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
      <WorkspaceSwitcher />
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
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
