/** รวม endpoint paths (relative ต่อ NEXT_PUBLIC_API_URL ที่มี /api/v1 อยู่แล้ว) */
export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    me: "/auth/me",
  },
  workspaces: {
    list: "/workspaces",
    create: "/workspaces",
    one: (id: string) => `/workspaces/${id}`,
  },
  wallets: { base: "/wallets", one: (id: string) => `/wallets/${id}` },
  categories: { base: "/categories", one: (id: string) => `/categories/${id}` },
  transactions: {
    base: "/transactions",
    one: (id: string) => `/transactions/${id}`,
  },
  dashboard: {
    overview: "/dashboard/overview",
  },
  subscriptions: {
    plans: "/subscriptions/plans",
    current: "/subscriptions/current",
    changePlan: "/subscriptions/change-plan",
    cancel: "/subscriptions/cancel",
  },
  admin: { users: "/admin/users", dashboard: "/admin/dashboard" },
} as const;
