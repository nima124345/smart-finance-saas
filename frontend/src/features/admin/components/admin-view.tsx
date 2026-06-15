"use client";

import {
  Banknote,
  Building2,
  CreditCard,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatMoney } from "@/lib/format";
import { useAdminStats, useAdminUsers } from "../hooks/use-admin";

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AdminView() {
  const stats = useAdminStats();
  const users = useAdminUsers(1);

  if (stats.isLoading) {
    return (
      <>
        <PageHeader title="Admin Dashboard" />
        <LoadingState rows={4} />
      </>
    );
  }
  if (stats.isError || !stats.data) {
    return (
      <>
        <PageHeader title="Admin Dashboard" />
        <ErrorState onRetry={() => stats.refetch()} />
      </>
    );
  }

  const s = stats.data;
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="ภาพรวมระบบ · ผู้ใช้ · รายได้"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="ผู้ใช้ทั้งหมด" value={String(s.totalUsers)} icon={<Users className="h-4 w-4" />} />
        <Stat label="Workspaces" value={String(s.totalWorkspaces)} icon={<Building2 className="h-4 w-4" />} />
        <Stat
          label="Subscriptions ใช้งาน"
          value={String(s.activeSubscriptions)}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <Stat label="ลูกค้าจ่ายเงิน" value={String(s.payingCustomers)} icon={<Users className="h-4 w-4" />} />
        <Stat label="MRR (รายเดือน)" value={formatMoney(s.mrr)} icon={<Banknote className="h-4 w-4 text-income" />} />
        <Stat label="ARR (ประมาณการ)" value={formatMoney(s.arrEstimate)} icon={<TrendingUp className="h-4 w-4 text-income" />} />
        <Stat label="ทดลองใช้ (Trial)" value={String(s.trialing)} icon={<CreditCard className="h-4 w-4" />} />
        <Stat label="ผู้ใช้ใหม่ 30 วัน" value={String(s.growth.newUsersLast30Days)} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">แพ็กเกจ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free</span>
              <span className="font-mono">{s.planBreakdown.free}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pro</span>
              <span className="font-mono">{s.planBreakdown.pro}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium</span>
              <span className="font-mono">{s.planBreakdown.premium}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">ผู้ใช้ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {users.isLoading ? (
              <div className="p-4">
                <LoadingState rows={4} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>สิทธิ์</TableHead>
                    <TableHead className="text-right">Workspaces</TableHead>
                    <TableHead>สมัครเมื่อ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users.data?.items ?? []).map((u) => (
                    <TableRow key={u.publicId}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {u.systemRole === "admin" ? (
                          <Badge>admin</Badge>
                        ) : (
                          <span className="text-muted-foreground">user</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {u.workspaceCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
