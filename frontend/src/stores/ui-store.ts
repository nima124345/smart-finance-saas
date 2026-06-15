import { create } from "zustand";

/** UI ephemeral state (ไม่ persist) — sidebar, modals */
interface UiState {
  sidebarOpen: boolean;
  commandOpen: boolean;
  limitReachedMessage: string | null; // plan limit reached → modal
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setLimitReached: (message: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  limitReachedMessage: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setLimitReached: (limitReachedMessage) => set({ limitReachedMessage }),
}));
