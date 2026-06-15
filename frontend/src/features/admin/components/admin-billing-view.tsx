"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { formatDate, formatMoney } from "@/lib/format";
import { KpiCard } from "./kpi-card";
import {
  useBillingOverview,
  usePaymentActions,
  usePayments,
} from "../hooks/use-admin";

const STATUS_BADGE: Record<string, "transfer" | "income" | "expense"> = {
  pending: "transfer",
  approved: "income",
  rejected: "expense",
};

export function AdminBillingView() {
  const [status, setStatus] = useState("pending");
  const overview = useBillingOverview();
  const payments = usePayments(status || undefined);
  const actions = usePaymentActions();

  const r = overview.data?.revenue;

  return (
    <>
      <PageHeader title="Billing" description="รายได้ · subscription · อนุมัติการชำระเงิน" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="MRR" value={formatMoney(r?.mrr ?? "0")} accent="text-income" />
        <KpiCard label="ARR" value={formatMoney(r?.arr ?? "0")} />
        <KpiCard label="รายได้รวม" value={formatMoney(r?.totalRevenue ?? "0")} />
        <KpiCard label="ลูกค้าจ่ายเงิน" value={String(r?.payingUsers ?? 0)} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">การชำระเงิน (PromptPay)</h2>
        <Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">รออนุมัติ</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="rejected">ปฏิเสธ</option>
          <option value="">ทั้งหมด</option>
        </Select>
      </div>

      <Card className="p-0">
        {payments.isLoading ? (
          <div className="p-4"><LoadingState /></div>
        ) : (payments.data ?? []).length === 0 ? (
          <EmptyState title="ไม่มีรายการ" description="ยังไม่มีการชำระเงินในสถานะนี้" className="m-4 border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>แพ็กเกจ</TableHead>
                <TableHead className="text-right">ยอด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments.data ?? []).map((p) => (
                <TableRow key={p.publicId}>
                  <TableCell className="font-medium">{p.workspace}</TableCell>
                  <TableCell className="uppercase">{p.planCode}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(p.amount)}</TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    {p.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" title="อนุมัติ" onClick={() => actions.approve.mutate(p.publicId)}>
                          <Check className="h-4 w-4 text-income" />
                        </Button>
                        <Button variant="outline" size="icon" title="ปฏิเสธ" onClick={() => actions.reject.mutate(p.publicId)}>
                          <X className="h-4 w-4 text-expense" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{p.reviewedBy ?? "-"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
