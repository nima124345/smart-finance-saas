"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatCardsSkeleton } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { getApiErrorMessage } from "@/lib/api/axios";
import { formatMoney, toSatang } from "@/lib/format";
import type { WalletType } from "@/types/domain";
import { useCreateWallet, useWallets } from "../hooks/use-wallets";

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: "cash", label: "เงินสด" },
  { value: "bank", label: "ธนาคาร" },
  { value: "ewallet", label: "พร้อมเพย์ / e-Wallet" },
  { value: "other", label: "อื่นๆ" },
];

interface WalletFormValues {
  name: string;
  type: WalletType;
  initialBalance?: number;
}

function CreateWalletDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateWallet();
  const { register, handleSubmit, reset } = useForm<WalletFormValues>({
    defaultValues: { type: "cash" },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ เพิ่มกระเป๋า</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มกระเป๋าเงิน</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) =>
            create.mutate(
              {
                name: v.name,
                type: v.type,
                initialBalance: v.initialBalance
                  ? toSatang(v.initialBalance)
                  : 0,
              },
              {
                onSuccess: () => {
                  reset({ type: "cash" });
                  setOpen(false);
                },
              },
            ),
          )}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="w-name">ชื่อกระเป๋า</Label>
            <Input id="w-name" required {...register("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>ประเภท</Label>
            <Select {...register("type")}>
              {WALLET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-bal">ยอดยกมา (บาท)</Label>
            <Input
              id="w-bal"
              type="number"
              step="0.01"
              {...register("initialBalance")}
            />
          </div>
          {create.isError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(create.error)}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WalletsView() {
  const wallets = useWallets();

  return (
    <>
      <PageHeader
        title="กระเป๋าเงิน"
        description="เงินสด · ธนาคาร · พร้อมเพย์"
        action={<CreateWalletDialog />}
      />

      {wallets.isLoading ? (
        <StatCardsSkeleton />
      ) : wallets.isError ? (
        <ErrorState onRetry={() => wallets.refetch()} />
      ) : (wallets.data ?? []).length === 0 ? (
        <EmptyState
          title="ยังไม่มีกระเป๋าเงิน"
          description="เพิ่มกระเป๋าแรกเพื่อเริ่มบันทึกรายการ"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.data!.map((w) => (
            <Card key={w.publicId}>
              <CardHeader className="pb-2">
                <span className="text-sm text-muted-foreground">{w.name}</span>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatMoney(w.balance, w.currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
