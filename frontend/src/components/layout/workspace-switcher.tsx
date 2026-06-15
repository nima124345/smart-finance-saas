"use client";

import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Workspace switcher (skeleton)
 * TODO(Step 5+): dropdown รายการ workspace + สลับ + "สร้าง workspace ใหม่"
 * การสลับ workspace → switchWorkspace() → React Query invalidate ["ws", ...]
 */
export function WorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const active = workspaces.find((w) => w.publicId === activeId);

  return (
    <Button variant="outline" size="sm" className="justify-between gap-2">
      <span className="truncate">{active?.name ?? "เลือก Workspace"}</span>
      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
    </Button>
  );
}
