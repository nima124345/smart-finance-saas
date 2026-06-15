"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Transaction } from "@/types/domain";
import {
  transactionsApi,
  type CreateTransactionInput,
  type TransactionFilters,
  type TransactionPage,
} from "../api/transactions.api";

type InfiniteTxData = { pages: TransactionPage[]; pageParams: unknown[] };

export function useTransactions(filters: TransactionFilters) {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useInfiniteQuery({
    queryKey: queryKeys.transactions(ws ?? "none", filters),
    queryFn: ({ pageParam }) =>
      transactionsApi.list(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!ws,
  });
}

/** Create + optimistic prepend (rollback ถ้า error) */
export function useCreateTransaction(filters: TransactionFilters) {
  const qc = useQueryClient();
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
  const key = queryKeys.transactions(ws, filters);

  return useMutation({
    mutationFn: transactionsApi.create,
    onMutate: async (input: CreateTransactionInput) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InfiniteTxData>(key);

      const optimistic: Transaction = {
        publicId: `optimistic-${Date.now()}`,
        type: input.type,
        amount: String(input.amount),
        currency: "THB",
        note: input.note,
        transactionDate: input.transactionDate,
        wallet: { publicId: input.walletId, name: "…" },
        category: input.categoryId
          ? { publicId: input.categoryId, name: "…" }
          : undefined,
      };

      qc.setQueryData<InfiniteTxData>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        pages[0] = { ...pages[0], items: [optimistic, ...pages[0].items] };
        return { ...old, pages };
      });

      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["ws", ws] }); // txn + wallets balance + dashboard
    },
  });
}

/** Delete + optimistic remove */
export function useDeleteTransaction(filters: TransactionFilters) {
  const qc = useQueryClient();
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
  const key = queryKeys.transactions(ws, filters);

  return useMutation({
    mutationFn: (publicId: string) => transactionsApi.remove(publicId),
    onMutate: async (publicId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InfiniteTxData>(key);
      qc.setQueryData<InfiniteTxData>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.filter((t) => t.publicId !== publicId),
          })),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["ws", ws] });
    },
  });
}
