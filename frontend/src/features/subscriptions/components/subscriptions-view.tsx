"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import type { PlanCode } from "@/types/domain";
import {
  useCancelPlan,
  useChangePlan,
  useCurrentSubscription,
  usePlans,
} from "../hooks/use-subscription";
import { CurrentPlanCard } from "./current-plan-card";
import { PlanCards } from "./plan-cards";

export function SubscriptionsView() {
  const current = useCurrentSubscription();
  const plans = usePlans();
  const change = useChangePlan();
  const cancel = useCancelPlan();
  const [pending, setPending] = useState<PlanCode | null>(null);

  const handleSelect = (code: PlanCode) => {
    setPending(code);
    change.mutate(code, { onSettled: () => setPending(null) });
  };

  if (current.isLoading || plans.isLoading) {
    return (
      <>
        <PageHeader title="แพ็กเกจ" description="Free · Pro · Business · Premium" />
        <LoadingState rows={3} />
      </>
    );
  }
  if (current.isError || !current.data || !plans.data) {
    return (
      <>
        <PageHeader title="แพ็กเกจ" />
        <ErrorState onRetry={() => current.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="แพ็กเกจ"
        description="เลือกแพ็กเกจที่เหมาะกับ workspace นี้"
      />

      <CurrentPlanCard
        sub={current.data}
        onCancel={() => cancel.mutate()}
        canceling={cancel.isPending}
      />

      <PlanCards
        plans={plans.data}
        currentCode={current.data.plan.code}
        pendingCode={pending}
        onSelect={handleSelect}
      />

      {change.isError && (
        <p className="text-sm text-destructive">เปลี่ยนแพ็กเกจไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      )}
    </>
  );
}
