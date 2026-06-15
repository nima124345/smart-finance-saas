"use client";

import { useEffect } from "react";

import { resolveTheme, useThemeStore } from "@/stores/theme-store";

/** ใส่/ถอด class `dark` ที่ <html> ตาม theme store (+ ฟัง system change) */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(mode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    apply();

    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode]);

  return <>{children}</>;
}
