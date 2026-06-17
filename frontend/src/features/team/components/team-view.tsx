"use client";

import { useState } from "react";
import { Mail, Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { getApiErrorMessage } from "@/lib/api/axios";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { MembershipRole } from "@/types/domain";
import { useActiveWorkspace } from "@/features/workspaces/hooks/use-workspaces";
import {
  useChangeRole,
  useInvitations,
  useInvite,
  useMembers,
  useRemoveMember,
  useRevokeInvitation,
} from "../hooks/use-team";

function RoleBadge({ role }: { role: MembershipRole }) {
  const map: Record<MembershipRole, { label: string; cls: string }> = {
    owner: { label: "Owner", cls: "bg-primary/10 text-primary" },
    admin: { label: "Manager", cls: "bg-transfer/10 text-transfer" },
    member: { label: "Staff", cls: "bg-secondary text-secondary-foreground" },
  };
  const { label, cls } = map[role];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function InviteDialog({ canInviteManager }: { canInviteManager: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");
  const invite = useInvite();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> เชิญสมาชิก
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เชิญสมาชิกใหม่</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate(
              { email, role },
              {
                onSuccess: () => {
                  setEmail("");
                  setRole("member");
                  setOpen(false);
                },
              },
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">อีเมล</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>บทบาท</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
            >
              <option value="member">Staff — บันทึกรายการของตัวเอง</option>
              {canInviteManager && (
                <option value="admin">Manager — จัดการรายการ + ดูรายงาน</option>
              )}
            </Select>
          </div>
          {invite.isError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(invite.error)}
            </p>
          )}
          {invite.isSuccess && invite.data?.inviteLink && (
            <p className="break-all rounded-md bg-muted px-3 py-2 text-xs">
              ลิงก์เชิญ (dev): {invite.data.inviteLink}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? "กำลังส่ง..." : "ส่งคำเชิญ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamView() {
  const ws = useActiveWorkspace();
  const myPublicId = useAuthStore((s) => s.user?.publicId);
  const role = ws?.role;
  const isOwner = role === "owner";
  const canManage = role === "owner" || role === "admin";

  const members = useMembers();
  const invitations = useInvitations();
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();
  const revoke = useRevokeInvitation();

  return (
    <>
      <PageHeader
        title="ทีมงาน"
        description="จัดการสมาชิกและสิทธิ์การเข้าถึง workspace นี้"
        action={canManage ? <InviteDialog canInviteManager={isOwner} /> : undefined}
      />

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">สมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          {members.isLoading ? (
            <LoadingState rows={3} />
          ) : members.isError ? (
            <ErrorState onRetry={() => members.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สมาชิก</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead className="hidden sm:table-cell">เข้าใช้ล่าสุด</TableHead>
                  {canManage && <TableHead className="text-right">จัดการ</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(members.data ?? []).map((m) => {
                  const isSelf = m.publicId === myPublicId;
                  const canManageThis =
                    !isSelf &&
                    m.role !== "owner" &&
                    (isOwner || (role === "admin" && m.role === "member"));
                  return (
                    <TableRow key={m.publicId}>
                      <TableCell>
                        <div className="font-medium">
                          {m.name} {isSelf && <span className="text-xs text-muted-foreground">(คุณ)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </TableCell>
                      <TableCell>
                        {isOwner && !isSelf && m.role !== "owner" ? (
                          <Select
                            className="h-8 w-32"
                            value={m.role}
                            disabled={changeRole.isPending}
                            onChange={(e) =>
                              changeRole.mutate({
                                publicId: m.publicId,
                                role: e.target.value as MembershipRole,
                              })
                            }
                          >
                            <option value="admin">Manager</option>
                            <option value="member">Staff</option>
                          </Select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {m.lastLoginAt ? formatDate(m.lastLoginAt) : "—"}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {canManageThis && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="ลบสมาชิก"
                              disabled={removeMember.isPending}
                              onClick={() => {
                                if (confirm(`ลบ ${m.name} ออกจากทีม?`)) {
                                  removeMember.mutate(m.publicId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations (เฉพาะผู้จัดการ) */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">คำเชิญที่รอตอบรับ</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.isLoading ? (
              <LoadingState rows={2} />
            ) : (invitations.data ?? []).length === 0 ? (
              <EmptyState
                icon={Mail}
                title="ไม่มีคำเชิญค้างอยู่"
                description="เชิญสมาชิกใหม่ด้วยปุ่มด้านบน"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead className="hidden sm:table-cell">หมดอายุ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invitations.data ?? []).map((inv) => (
                    <TableRow key={inv.publicId}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.roleLabel}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatDate(inv.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => revoke.mutate(inv.publicId)}
                        >
                          ยกเลิก
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
