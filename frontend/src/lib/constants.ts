export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Smart Finance";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** key เก็บ token / active workspace ใน localStorage (จัดการผ่าน Zustand persist) */
export const STORAGE_KEYS = {
  auth: "sf-auth",
  workspace: "sf-workspace",
  theme: "sf-theme",
} as const;

/** header ส่ง workspace ปัจจุบันไป backend (WorkspaceGuard) */
export const WORKSPACE_HEADER = "X-Workspace-Id";

export const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  wallets: "/wallets",
  transactions: "/transactions",
  categories: "/categories",
  subscriptions: "/subscriptions",
  settings: "/settings",
  admin: "/admin",
} as const;
