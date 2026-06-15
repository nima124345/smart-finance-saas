"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { categoriesApi } from "../api/categories.api";

export function useCategories() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: queryKeys.categories(ws ?? "none"),
    queryFn: categoriesApi.list,
    enabled: !!ws,
    staleTime: 5 * 60 * 1000, // หมวดหมู่เปลี่ยนไม่บ่อย
  });
}
