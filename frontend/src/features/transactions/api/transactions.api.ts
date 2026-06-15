import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Transaction, TransactionType } from "@/types/domain";

export type TransactionSort =
  | "latest"
  | "oldest"
  | "amount_high"
  | "amount_low";

export interface TransactionFilters {
  type?: TransactionType;
  walletId?: string;
  categoryId?: string;
  month?: string;
  search?: string;
  sort?: TransactionSort;
  amountMin?: number;
  amountMax?: number;
}

export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number; // satang
  walletId: string;
  destinationWalletId?: string;
  categoryId?: string;
  note?: string;
  transactionDate: string; // YYYY-MM-DD
}

export const transactionsApi = {
  async list(
    filters: TransactionFilters,
    cursor?: string,
    limit = 20,
  ): Promise<TransactionPage> {
    const { data } = await api.get<ApiResponse<TransactionPage>>(
      endpoints.transactions.base,
      { params: { ...filters, cursor, limit } },
    );
    return data.data;
  },

  async create(body: CreateTransactionInput): Promise<Transaction> {
    const { data } = await api.post<ApiResponse<Transaction>>(
      endpoints.transactions.base,
      body,
    );
    return data.data;
  },

  async update(
    publicId: string,
    body: Partial<CreateTransactionInput>,
  ): Promise<Transaction> {
    const { data } = await api.patch<ApiResponse<Transaction>>(
      endpoints.transactions.one(publicId),
      body,
    );
    return data.data;
  },

  async remove(publicId: string): Promise<void> {
    await api.delete(endpoints.transactions.one(publicId));
  },

  async restore(publicId: string): Promise<Transaction> {
    const { data } = await api.post<ApiResponse<Transaction>>(
      `${endpoints.transactions.one(publicId)}/restore`,
    );
    return data.data;
  },
};
