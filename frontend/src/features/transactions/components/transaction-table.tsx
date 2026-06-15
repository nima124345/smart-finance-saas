"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/domain";

const TYPE_META = {
  income: { label: "รายรับ", variant: "income" as const, sign: "+" },
  expense: { label: "รายจ่าย", variant: "expense" as const, sign: "-" },
  transfer: { label: "โอน", variant: "transfer" as const, sign: "" },
};

export function TransactionTable({
  items,
  onDelete,
}: {
  items: Transaction[];
  onDelete: (publicId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>วันที่</TableHead>
          <TableHead>ประเภท</TableHead>
          <TableHead>หมวดหมู่ / กระเป๋า</TableHead>
          <TableHead>หมายเหตุ</TableHead>
          <TableHead className="text-right">จำนวน</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => {
          const meta = TYPE_META[t.type];
          return (
            <TableRow key={t.publicId}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(t.transactionDate)}
              </TableCell>
              <TableCell>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </TableCell>
              <TableCell>
                {t.type === "transfer"
                  ? `${t.wallet.name} → ${t.destinationWallet?.name ?? "-"}`
                  : `${t.category?.name ?? "ไม่มีหมวดหมู่"} · ${t.wallet.name}`}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {t.note ?? "-"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono font-medium tabular-nums",
                  t.type === "income" && "text-income",
                  t.type === "expense" && "text-expense",
                )}
              >
                {meta.sign}
                {formatMoney(t.amount)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="ลบ"
                  onClick={() => onDelete(t.publicId)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
