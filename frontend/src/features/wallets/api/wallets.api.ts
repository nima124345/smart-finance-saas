import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Wallet, WalletType } from "@/types/domain";

export interface CreateWalletInput {
  name: string;
  type: WalletType;
  currency?: string;
  initialBalance?: number; // satang
  color?: string;
  icon?: string;
}

export const walletsApi = {
  async list(): Promise<Wallet[]> {
    const { data } = await api.get<ApiResponse<Wallet[]>>(endpoints.wallets.base);
    return data.data;
  },
  async create(body: CreateWalletInput): Promise<Wallet> {
    const { data } = await api.post<ApiResponse<Wallet>>(
      endpoints.wallets.base,
      body,
    );
    return data.data;
  },
  async remove(publicId: string): Promise<void> {
    await api.delete(endpoints.wallets.one(publicId));
  },
};
