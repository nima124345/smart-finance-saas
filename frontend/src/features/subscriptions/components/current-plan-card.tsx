"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { CurrentSubscription } from "../types";
import { UsageBar } from "./usage-progress";

const STATUS_LABEL: Record<string, string> = {
  active: "ใช้งานอยู่",
  trialing: "ทดลองใช้",
  canceled: "ยกเลิกแล้ว",
  expired: "หมดอายุ",
  past_due: "ค้างชำระ",
};

export function CurrentPlanCard({
  sub,
  onCancel,
  canceling,
}: {
  sub: CurrentSubscription;
  onCancel: () => void;
  canceling: boolean;
}) {
  const isPaid = Number(sub.plan.price) > 0;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">แพ็กเกจปัจจุบัน</CardTitle>
        <Badge variant={sub.isTrialing ? "transfer" : "default"}>
          {STATUS_LABEL[sub.status] ?? sub.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{sub.plan.name}</span>
          {sub.isTrialing && sub.trialEndsAt && (
            <span className="text-sm text-muted-foreground">
              ทดลองถึง {formatDate(sub.trialEndsAt)}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <UsageBar label="กระเป๋าเงิน" metric={sub.usage.wallets} />
          <UsageBar label="รายการเดือนนี้" metric={sub.usage.transactions} />
        </div>

        {isPaid && sub.status !== "canceled" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onCancel}
            disabled={canceling}
          >
            {canceling ? "กำลังยกเลิก..." : "ยกเลิกแพ็กเกจ"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
