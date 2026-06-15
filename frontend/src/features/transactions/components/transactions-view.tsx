"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import type { TransactionFilters as Filters } from "../api/transactions.api";
import {
  useDeleteTransaction,
  useTransactions,
} from "../hooks/use-transactions";
import { TransactionFilters } from "./transaction-filters";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionTable } from "./transaction-table";

export function TransactionsView() {
  const [filters, setFilters] = useState<Filters>({ sort: "latest" });
  const query = useTransactions(filters);
  const del = useDeleteTransaction(filters);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="รายการ"
        description="รายรับ–รายจ่าย และการโอนระหว่างกระเป๋า"
        action={<TransactionFormDialog filters={filters} />}
      />

      <TransactionFilters filters={filters} onChange={setFilters} />

      <Card className="p-0">
        {query.isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} className="m-4" />
        ) : items.length === 0 ? (
          <EmptyState
            title="ยังไม่มีรายการ"
            description="กดปุ่ม “เพิ่มรายการ” เพื่อบันทึกรายรับหรือรายจ่ายแรกของคุณ"
            className="m-4 border-0"
          />
        ) : (
          <>
            <TransactionTable items={items} onDelete={(id) => del.mutate(id)} />
            {query.hasNextPage && (
              <div className="flex justify-center border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage ? "กำลังโหลด..." : "โหลดเพิ่ม"}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
