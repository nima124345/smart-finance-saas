"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { getApiErrorMessage } from "@/lib/api/axios";
import { toSatang } from "@/lib/format";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useCreateTransaction } from "../hooks/use-transactions";
import type { TransactionFilters } from "../api/transactions.api";
import { transactionFormSchema, type TransactionFormInput } from "../schemas";

const TYPE_LABEL = { income: "รายรับ", expense: "รายจ่าย", transfer: "โอน" };

export function TransactionFormDialog({
  filters,
}: {
  filters: TransactionFilters;
}) {
  const [open, setOpen] = useState(false);
  const wallets = useWallets();
  const categories = useCategories();
  const create = useCreateTransaction(filters);

  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { type: "expense", transactionDate: today },
  });

  const type = watch("type");
  const catOptions = (categories.data ?? []).filter((c) => c.type === type);

  const onSubmit = (v: TransactionFormInput) => {
    create.mutate(
      {
        type: v.type,
        amount: toSatang(v.amount),
        walletId: v.walletId,
        destinationWalletId:
          v.type === "transfer" ? v.destinationWalletId || undefined : undefined,
        categoryId: v.type !== "transfer" ? v.categoryId || undefined : undefined,
        note: v.note,
        transactionDate: v.transactionDate,
      },
      {
        onSuccess: () => {
          reset({ type: v.type, transactionDate: today });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ เพิ่มรายการ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label>ประเภท</Label>
            <Select {...register("type")}>
              {(["income", "expense", "transfer"] as const).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{type === "transfer" ? "จากกระเป๋า" : "กระเป๋าเงิน"}</Label>
            <Select {...register("walletId")} defaultValue="">
              <option value="" disabled>
                เลือกกระเป๋า
              </option>
              {(wallets.data ?? []).map((w) => (
                <option key={w.publicId} value={w.publicId}>
                  {w.name}
                </option>
              ))}
            </Select>
            {errors.walletId && (
              <p className="text-xs text-destructive">{errors.walletId.message}</p>
            )}
          </div>

          {type === "transfer" ? (
            <div className="space-y-1.5">
              <Label>ไปยังกระเป๋า</Label>
              <Select {...register("destinationWalletId")} defaultValue="">
                <option value="" disabled>
                  เลือกกระเป๋าปลายทาง
                </option>
                {(wallets.data ?? []).map((w) => (
                  <option key={w.publicId} value={w.publicId}>
                    {w.name}
                  </option>
                ))}
              </Select>
              {errors.destinationWalletId && (
                <p className="text-xs text-destructive">
                  {errors.destinationWalletId.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>หมวดหมู่</Label>
              <Select {...register("categoryId")} defaultValue="">
                <option value="" disabled>
                  เลือกหมวดหมู่
                </option>
                {catOptions.map((c) => (
                  <option key={c.publicId} value={c.publicId}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="date">วันที่</Label>
            <Input id="date" type="date" {...register("transactionDate")} />
            {errors.transactionDate && (
              <p className="text-xs text-destructive">
                {errors.transactionDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Input id="note" {...register("note")} />
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
