"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { formatDate, formatMoney } from "@/lib/format";
import { adminApiClient } from "../api/admin.api";
import { useSupportActions, useTickets } from "../hooks/use-admin";

interface Ticket {
  publicId: string;
  type: string;
  subject: string;
  message: string;
  email: string;
  status: string;
  createdAt: string;
}
interface Trace {
  user: {
    name: string;
    email: string;
    status: string;
    workspaceCount: number;
    transactionCount: number;
    lastLoginAt: string | null;
  };
  recentActivity: { type: string; amount: string; date: string; note: string | null }[];
}

export function AdminSupportView() {
  const tickets = useTickets();
  const actions = useSupportActions();
  const [query, setQuery] = useState("");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);

  const list = (tickets.data ?? []) as unknown as Ticket[];

  const runTrace = async () => {
    setTraceError(null);
    setTrace(null);
    try {
      const r = (await adminApiClient.trace(query)) as unknown as Trace;
      setTrace(r);
    } catch {
      setTraceError("ไม่พบผู้ใช้");
    }
  };

  return (
    <>
      <PageHeader title="Support" description="feedback · ติดต่อ · trace ผู้ใช้" />

      {/* User trace */}
      <Card>
        <CardHeader><CardTitle className="text-base">ค้นหา/Trace ผู้ใช้</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="อีเมลผู้ใช้..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
            <Button variant="outline" onClick={runTrace}><Search className="h-4 w-4" /> ค้นหา</Button>
          </div>
          {traceError && <p className="text-sm text-destructive">{traceError}</p>}
          {trace && (
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span><b>{trace.user.name}</b> · {trace.user.email}</span>
                <span>สถานะ: {trace.user.status}</span>
                <span>workspaces: {trace.user.workspaceCount}</span>
                <span>รายการ: {trace.user.transactionCount}</span>
                <span>login ล่าสุด: {trace.user.lastLoginAt ? formatDate(trace.user.lastLoginAt) : "-"}</span>
              </div>
              <div className="mt-2 space-y-1">
                {trace.recentActivity.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{a.date} · {a.type} · {a.note ?? "-"}</span>
                    <span className="font-mono">{formatMoney(a.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader><CardTitle className="text-base">Feedback / Contact</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 ? (
            <EmptyState title="ยังไม่มีข้อความ" description="feedback และคำขอติดต่อจะแสดงที่นี่" className="border-0" />
          ) : (
            list.map((t) => (
              <div key={t.publicId} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={t.type === "feedback" ? "transfer" : "default"}>{t.type}</Badge>
                    <span className="font-medium">{t.subject}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{t.message}</p>
                  <span className="text-xs text-muted-foreground">{t.email} · {formatDate(t.createdAt)}</span>
                </div>
                {t.status === "open" && (
                  <Button variant="outline" size="sm" onClick={() => actions.close.mutate(t.publicId)}>ปิด</Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
