"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, KeyRound, LogIn, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { setAuthFlag } from "@/lib/cookie";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PlanCode, User, WorkspaceType } from "@/types/domain";
import { useAdminUsers, useUserActions } from "../hooks/use-admin";

export function AdminUsersView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const params = {
    perPage: 20,
    search: search || undefined,
    plan: plan || undefined,
    status: status || undefined,
  };
  const q = useAdminUsers(params);
  const a = useUserActions();

  const tenantSetAuth = useAuthStore((s) => s.setAuth);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  const impersonate = async (id: string) => {
    const res = await a.impersonate.mutateAsync(id);
    const user = res.user as User;
    tenantSetAuth({ user, accessToken: res.accessToken });
    if (res.workspacePublicId) {
      setWorkspaces([
        {
          publicId: res.workspacePublicId,
          name: user.name,
          type: "personal" as WorkspaceType,
          baseCurrency: "THB",
          role: "owner",
        },
      ]);
    }
    setAuthFlag();
    router.push("/dashboard");
  };

  return (
    <>
      <PageHeader title="Users" description="จัดการผู้ใช้ทั้งหมด" />

      {banner && (
        <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {banner}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="ค้นหา ชื่อ/อีเมล..."
          className="w-full sm:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="w-32" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="">ทุกแพ็กเกจ</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </Select>
        <Select className="w-32" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <Card className="p-0">
        {q.isLoading ? (
          <div className="p-4"><LoadingState /></div>
        ) : q.isError ? (
          <ErrorState onRetry={() => q.refetch()} className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>แพ็กเกจ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">WS</TableHead>
                <TableHead>สมัคร</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data?.items ?? []).map((u) => (
                <TableRow key={u.publicId}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      className="h-7 w-24 text-xs"
                      value={u.plan}
                      onChange={(e) =>
                        a.changePlan.mutate({ id: u.publicId, plan: e.target.value as PlanCode })
                      }
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.status === "active" ? (
                      <Badge variant="income">active</Badge>
                    ) : (
                      <Badge variant="expense">suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{u.workspaceCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      {u.status === "active" ? (
                        <Button variant="ghost" size="icon" title="ระงับ" onClick={() => a.suspend.mutate(u.publicId)}>
                          <Ban className="h-4 w-4 text-expense" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" title="เปิดใช้งาน" onClick={() => a.activate.mutate(u.publicId)}>
                          <CheckCircle className="h-4 w-4 text-income" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="รีเซ็ตรหัสผ่าน"
                        onClick={async () => {
                          const r = await a.resetPassword.mutateAsync(u.publicId);
                          setBanner(`รหัสผ่านชั่วคราวของ ${u.email}: ${r.tempPassword}`);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="เข้าใช้แทน (impersonate)" onClick={() => impersonate(u.publicId)}>
                        <LogIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="ลบ"
                        onClick={() => {
                          if (confirm(`ลบผู้ใช้ ${u.email}?`)) a.remove.mutate(u.publicId);
                        }}
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
