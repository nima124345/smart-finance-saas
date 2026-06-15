"use client";

import { Ban, CheckCircle, Trash2 } from "lucide-react";

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
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { formatDate } from "@/lib/format";
import type { PlanCode } from "@/types/domain";
import { useAdminWorkspaces, useWorkspaceActions } from "../hooks/use-admin";

export function AdminWorkspacesView() {
  const q = useAdminWorkspaces({ perPage: 20 });
  const a = useWorkspaceActions();

  return (
    <>
      <PageHeader title="Workspaces" description="จัดการ workspace ทั้งหมด" />
      <Card className="p-0">
        {q.isLoading ? (
          <div className="p-4"><LoadingState /></div>
        ) : q.isError ? (
          <ErrorState onRetry={() => q.refetch()} className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>เจ้าของ</TableHead>
                <TableHead>แพ็กเกจ</TableHead>
                <TableHead className="text-right">กระเป๋า</TableHead>
                <TableHead className="text-right">รายการ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data?.items ?? []).map((w) => (
                <TableRow key={w.publicId}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-muted-foreground">{w.owner}</TableCell>
                  <TableCell>
                    <Select
                      className="h-7 w-24 text-xs"
                      value={w.plan}
                      onChange={(e) => a.forcePlan.mutate({ id: w.publicId, plan: e.target.value as PlanCode })}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono">{w.walletCount}</TableCell>
                  <TableCell className="text-right font-mono">{w.transactionCount}</TableCell>
                  <TableCell>
                    {w.status === "active" ? (
                      <Badge variant="income">active</Badge>
                    ) : (
                      <Badge variant="expense">suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      {w.status === "active" ? (
                        <Button variant="ghost" size="icon" title="ระงับ" onClick={() => a.suspend.mutate(w.publicId)}>
                          <Ban className="h-4 w-4 text-expense" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" title="คืนสภาพ" onClick={() => a.restore.mutate(w.publicId)}>
                          <CheckCircle className="h-4 w-4 text-income" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="ลบ"
                        onClick={() => { if (confirm(`ลบ workspace ${w.name}?`)) a.remove.mutate(w.publicId); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
