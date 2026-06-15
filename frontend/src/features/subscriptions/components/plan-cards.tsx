"use client";

import { Check, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanCode } from "@/types/domain";
import type { Plan } from "../types";

function featureLines(p: Plan): { label: string; ok: boolean }[] {
  return [
    {
      label: p.maxWorkspaces == null ? "Workspace ไม่จำกัด" : `${p.maxWorkspaces} workspace`,
      ok: true,
    },
    {
      label: p.maxWallets == null ? "กระเป๋าไม่จำกัด" : `${p.maxWallets} กระเป๋า`,
      ok: true,
    },
    {
      label:
        p.maxTransactionsMonth == null
          ? "รายการไม่จำกัด"
          : `${p.maxTransactionsMonth} รายการ/เดือน`,
      ok: true,
    },
    { label: "Dashboard ขั้นสูง", ok: p.features.advancedDashboard },
    { label: "Export CSV", ok: p.features.exportCsv },
    { label: "ทีม/สมาชิกร่วม", ok: p.features.teamMembers },
    { label: "AI Insights", ok: p.features.aiInsights },
  ];
}

const ORDER: Record<PlanCode, number> = { free: 0, pro: 1, premium: 2 };

export function PlanCards({
  plans,
  currentCode,
  pendingCode,
  onSelect,
}: {
  plans: Plan[];
  currentCode: PlanCode;
  pendingCode: PlanCode | null;
  onSelect: (code: PlanCode) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => {
        const isCurrent = p.code === currentCode;
        const isUpgrade = ORDER[p.code] > ORDER[currentCode];
        const highlight = p.code === "pro";
        return (
          <Card
            key={p.code}
            className={cn(
              "relative flex flex-col",
              highlight && "border-primary shadow-md",
            )}
          >
            {highlight && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">แนะนำ</Badge>
              </span>
            )}
            <CardContent className="flex flex-1 flex-col p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1">
                  <span className="font-mono text-2xl font-bold">
                    {Number(p.price) === 0 ? "ฟรี" : formatMoney(p.price)}
                  </span>
                  {Number(p.price) > 0 && (
                    <span className="text-sm text-muted-foreground"> /เดือน</span>
                  )}
                </p>
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                {featureLines(p).map((f) => (
                  <li
                    key={f.label}
                    className={cn(
                      "flex items-center gap-2",
                      !f.ok && "text-muted-foreground/50",
                    )}
                  >
                    {f.ok ? (
                      <Check className="h-4 w-4 text-income" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? "outline" : highlight ? "default" : "secondary"}
                disabled={isCurrent || pendingCode !== null}
                onClick={() => onSelect(p.code)}
              >
                {isCurrent
                  ? "แพ็กเกจปัจจุบัน"
                  : pendingCode === p.code
                    ? "กำลังเปลี่ยน..."
                    : isUpgrade
                      ? "อัปเกรด"
                      : "เปลี่ยนเป็นแพ็กเกจนี้"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
