"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { formatDate } from "@/lib/format";
import { useAdminSettings, useSettingsActions } from "../hooks/use-admin";

interface PlanCfg {
  code: string;
  name: string;
  price: string;
  maxWorkspaces: number | null;
  maxWallets: number | null;
  maxTransactionsMonth: number | null;
}
interface SettingsData {
  plans: PlanCfg[];
  settings: {
    maintenance?: { enabled: boolean; message: string };
    feature_flags?: Record<string, boolean>;
  };
  adminLoginLogs: { actor: string; action: string; ip: string | null; createdAt: string }[];
}

const numOrNull = (v: string) => (v === "" ? null : Number(v));

export function AdminSettingsView() {
  const q = useAdminSettings();
  const actions = useSettingsActions();
  const d = q.data as unknown as SettingsData | undefined;

  const [maint, setMaint] = useState({ enabled: false, message: "" });
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (d) {
      setMaint(d.settings.maintenance ?? { enabled: false, message: "" });
      setFlags(d.settings.feature_flags ?? {});
    }
  }, [d]);

  if (q.isLoading) return (<><PageHeader title="Settings" /><LoadingState rows={4} /></>);
  if (q.isError || !d) return (<><PageHeader title="Settings" /><ErrorState onRetry={() => q.refetch()} /></>);

  return (
    <>
      <PageHeader title="Settings" description="แพ็กเกจ · feature flags · ความปลอดภัย" />

      {/* Plan config */}
      <Card>
        <CardHeader><CardTitle className="text-base">Plan Limits</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {d.plans.map((p) => (
            <PlanRow key={p.code} plan={p} onSave={(body) => actions.updatePlan.mutate({ code: p.code, body })} />
          ))}
        </CardContent>
      </Card>

      {/* Feature flags + maintenance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Feature Flags</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {["csvExport", "aiInsights", "teamMembers"].map((k) => (
              <label key={k} className="flex items-center justify-between text-sm">
                <span>{k}</span>
                <input
                  type="checkbox"
                  checked={!!flags[k]}
                  onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })}
                />
              </label>
            ))}
            <Button
              size="sm"
              className="mt-2"
              onClick={() => actions.updateSetting.mutate({ key: "feature_flags", body: flags })}
              disabled={actions.updateSetting.isPending}
            >
              บันทึก flags
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Maintenance Mode</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center justify-between text-sm">
              <span>เปิด maintenance mode</span>
              <input
                type="checkbox"
                checked={maint.enabled}
                onChange={(e) => setMaint({ ...maint, enabled: e.target.checked })}
              />
            </label>
            <Input
              placeholder="ข้อความแจ้งผู้ใช้..."
              value={maint.message}
              onChange={(e) => setMaint({ ...maint, message: e.target.value })}
            />
            <Button
              size="sm"
              onClick={() => actions.updateSetting.mutate({ key: "maintenance", body: maint })}
              disabled={actions.updateSetting.isPending}
            >
              บันทึก
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin login logs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Admin Login Logs</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {d.adminLoginLogs.map((l, i) => (
            <div key={i} className="flex justify-between text-muted-foreground">
              <span>{l.actor} · {l.action} {l.ip ? `· ${l.ip}` : ""}</span>
              <span>{formatDate(l.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function PlanRow({ plan, onSave }: { plan: PlanCfg; onSave: (body: Record<string, unknown>) => void }) {
  const [priceBaht, setPriceBaht] = useState(String(Number(plan.price) / 100));
  const [ws, setWs] = useState(plan.maxWorkspaces?.toString() ?? "");
  const [wl, setWl] = useState(plan.maxWallets?.toString() ?? "");
  const [tx, setTx] = useState(plan.maxTransactionsMonth?.toString() ?? "");

  return (
    <div className="grid grid-cols-2 items-end gap-2 border-b pb-3 last:border-0 sm:grid-cols-5">
      <div className="font-medium">{plan.name}</div>
      <Field label="ราคา (บาท)" value={priceBaht} onChange={setPriceBaht} />
      <Field label="Workspaces (ว่าง=ไม่จำกัด)" value={ws} onChange={setWs} />
      <Field label="Wallets" value={wl} onChange={setWl} />
      <div className="flex items-end gap-2">
        <Field label="Txn/เดือน" value={tx} onChange={setTx} />
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onSave({
              price: Math.round(Number(priceBaht) * 100),
              maxWorkspaces: numOrNull(ws),
              maxWallets: numOrNull(wl),
              maxTransactionsMonth: numOrNull(tx),
            })
          }
        >
          บันทึก
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input className="h-8" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
