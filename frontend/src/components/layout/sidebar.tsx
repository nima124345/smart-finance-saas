"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNav, mainNav } from "@/config/nav";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Sidebar navigation (skeleton)
 * TODO(Step 5+): active workspace context, collapse, mobile drawer
 */
export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.user?.systemRole === "admin");
  const items = [...mainNav, ...(isAdmin ? adminNav : [])];

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Image
          src="/logo.png"
          alt={APP_NAME}
          width={256}
          height={256}
          priority
          className="h-11 w-auto object-contain"
        />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
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
  );
}
