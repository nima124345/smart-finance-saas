"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/domain";
import { workspacesApi } from "../api/workspaces.api";

/** workspace ที่กำลังใช้งาน (จาก store) */
export function useActiveWorkspace(): Workspace | null {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return workspaces.find((w) => w.publicId === activeId) ?? null;
}

/** สร้าง workspace ใหม่ → refresh list + สลับไป workspace ใหม่ */
export function useCreateWorkspace() {
  const qc = useQueryClient();
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);

  return useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: async (created) => {
      const list = await workspacesApi.list();
      setWorkspaces(list);
      switchWorkspace(created.publicId);
      await qc.invalidateQueries();
    },
  });
}

/** ดึง workspace ทั้งหมดใหม่ (เช่น หลังรับคำเชิญ) */
export function useRefreshWorkspaces() {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  return useMutation({
    mutationFn: workspacesApi.list,
    onSuccess: (list) => setWorkspaces(list),
  });
}
