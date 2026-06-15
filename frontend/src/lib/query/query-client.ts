import { QueryClient } from "@tanstack/react-query";

/** factory — สร้าง client ใหม่ต่อ request (กัน state รั่วข้าม user ฝั่ง server) */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 นาที
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** query keys ส่วนกลาง (ขึ้นต้นด้วย workspace เพื่อ invalidate ตอนสลับ workspace) */
export const queryKeys = {
  me: ["me"] as const,
  workspaces: ["workspaces"] as const,
  wallets: (ws: string) => ["ws", ws, "wallets"] as const,
  categories: (ws: string) => ["ws", ws, "categories"] as const,
  transactions: (ws: string, filters?: unknown) =>
    ["ws", ws, "transactions", filters] as const,
  dashboard: (ws: string) => ["ws", ws, "dashboard"] as const,
  subscription: (ws: string) => ["ws", ws, "subscription"] as const,
};
