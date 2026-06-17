"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import { ROLE_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useCurrentSubscription } from "@/features/subscriptions/hooks/use-subscription";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const active = workspaces.find((w) => w.publicId === activeId);
  const sub = useCurrentSubscription();

  const handleSwitch = (publicId: string) => {
    if (publicId !== activeId) {
      switchWorkspace(publicId);
      qc.invalidateQueries(); // โหลดข้อมูลของ workspace ใหม่
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between gap-2 max-w-[14rem]">
          {active?.type === "business" ? (
            <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : (
            <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">{active?.name ?? "เลือก Workspace"}</span>
          {sub.data && (
            <Badge variant="outline" className="hidden sm:inline">
              {sub.data.plan.name}
            </Badge>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>สลับ Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          {workspaces.map((w) => {
            const isActive = w.publicId === activeId;
            return (
              <button
                key={w.publicId}
                onClick={() => handleSwitch(w.publicId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent",
                  isActive && "border-primary bg-accent/50",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  {w.type === "business" ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {w.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {w.type === "business" ? "ธุรกิจ" : "ส่วนตัว"} ·{" "}
                    {ROLE_LABELS[w.role]}
                  </span>
                </span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setOpen(false);
            router.push(ROUTES.onboarding);
          }}
        >
          <Plus className="h-4 w-4" /> สร้าง Workspace ใหม่
        </Button>
      </DialogContent>
    </Dialog>
  );
}
