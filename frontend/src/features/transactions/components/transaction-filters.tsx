"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import type {
  TransactionFilters as Filters,
  TransactionSort,
} from "../api/transactions.api";

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const wallets = useWallets();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="ค้นหาหมายเหตุ..."
        className="h-9 w-full sm:w-48"
        value={filters.search ?? ""}
        onChange={(e) => set({ search: e.target.value || undefined })}
      />
      <Select
        className="w-32"
        value={filters.type ?? ""}
        onChange={(e) =>
          set({ type: (e.target.value || undefined) as Filters["type"] })
        }
      >
        <option value="">ทุกประเภท</option>
        <option value="income">รายรับ</option>
        <option value="expense">รายจ่าย</option>
        <option value="transfer">โอน</option>
      </Select>
      <Select
        className="w-36"
        value={filters.walletId ?? ""}
        onChange={(e) => set({ walletId: e.target.value || undefined })}
      >
        <option value="">ทุกกระเป๋า</option>
        {(wallets.data ?? []).map((w) => (
          <option key={w.publicId} value={w.publicId}>
            {w.name}
          </option>
        ))}
      </Select>
      <Input
        type="month"
        className="h-9 w-40"
        value={filters.month ?? ""}
        onChange={(e) => set({ month: e.target.value || undefined })}
      />
      <Select
        className="w-36"
        value={filters.sort ?? "latest"}
        onChange={(e) => set({ sort: e.target.value as TransactionSort })}
      >
        <option value="latest">ล่าสุด</option>
        <option value="oldest">เก่าสุด</option>
        <option value="amount_high">เงินมากสุด</option>
        <option value="amount_low">เงินน้อยสุด</option>
      </Select>
    </div>
  );
}
