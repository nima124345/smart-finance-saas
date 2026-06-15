"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { walletsApi } from "../api/wallets.api";

export function useWallets() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: queryKeys.wallets(ws ?? "none"),
    queryFn: walletsApi.list,
    enabled: !!ws,
  });
}

export function useCreateWallet() {
  const qc = useQueryClient();
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: walletsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallets(ws ?? "none") });
    },
  });
}
