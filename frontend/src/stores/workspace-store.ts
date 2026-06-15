import { create } from "zustand";
import { persist } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/constants";
import type { Workspace } from "@/types/domain";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null; // publicId — ส่งเป็น X-Workspace-Id

  setWorkspaces: (workspaces: Workspace[]) => void;
  switchWorkspace: (publicId: string) => void;
  clear: () => void;

  // selector helper
  activeWorkspace: () => Workspace | null;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,

      setWorkspaces: (workspaces) =>
        set((s) => ({
          workspaces,
          // ตั้ง active อัตโนมัติถ้ายังไม่มี / ของเดิมหายไป
          activeWorkspaceId:
            s.activeWorkspaceId &&
            workspaces.some((w) => w.publicId === s.activeWorkspaceId)
              ? s.activeWorkspaceId
              : (workspaces[0]?.publicId ?? null),
        })),
      switchWorkspace: (publicId) => set({ activeWorkspaceId: publicId }),
      clear: () => set({ workspaces: [], activeWorkspaceId: null }),

      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.publicId === activeWorkspaceId) ?? null;
      },
    }),
    {
      name: STORAGE_KEYS.workspace,
      partialize: (s) => ({ activeWorkspaceId: s.activeWorkspaceId }),
    },
  ),
);
