"use client";

import Link from "next/link";
import { Building2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import type { MembershipRole } from "@/types/domain";
import { useActiveWorkspace } from "@/features/workspaces/hooks/use-workspaces";
import { useCurrentSubscription } from "@/features/subscriptions/hooks/use-subscription";
import type { PlanFeatures } from "@/features/subscriptions/types";

const FEATURE_LABEL: Partial<Record<keyof PlanFeatures, string>> = {
  businessDashboard: "Business Dashboard",
  businessReports: "รายงานธุรกิจ",
  activityLog: "Activity Log",
  teamMembers: "การจัดการทีม",
  aiInsights: "AI Insights",
};

const FEATURE_PLAN: Partial<Record<keyof PlanFeatures, string>> = {
  businessDashboard: "Business",
  businessReports: "Business",
  activityLog: "Business",
  teamMembers: "Business",
  aiInsights: "Premium",
};

function GateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface FeatureGateProps {
  feature?: keyof PlanFeatures;
  requireBusiness?: boolean;
  roles?: MembershipRole[];
  children: React.ReactNode;
}

/**
 * Gate UI กลาง — ตรวจ (1) ประเภท workspace (2) role (3) plan feature
 * ถ้าไม่ผ่าน → แสดง upgrade/permission CTA แทน children
 */
export function FeatureGate({
  feature,
  requireBusiness,
  roles,
  children,
}: FeatureGateProps) {
  const ws = useActiveWorkspace();
  const sub = useCurrentSubscription();

  // ── 1) business-only ──
  if (requireBusiness && ws && ws.type !== "business") {
    return (
      <GateCard
        icon={<Building2 className="h-7 w-7" />}
        title="ฟีเจอร์สำหรับ Workspace ธุรกิจ"
        description="ฟีเจอร์นี้ใช้ได้เฉพาะ workspace แบบธุรกิจ สร้าง workspace ธุรกิจเพื่อปลดล็อกการจัดการทีม รายงาน และ AI Insights"
        action={
          <Button asChild>
            <Link href={ROUTES.onboarding}>+ สร้าง Workspace ธุรกิจ</Link>
          </Button>
        }
      />
    );
  }

  // ── 2) role ──
  if (roles && ws && !roles.includes(ws.role)) {
    return (
      <GateCard
        icon={<Lock className="h-7 w-7" />}
        title="ไม่มีสิทธิ์เข้าถึง"
        description="บัญชีของคุณไม่มีสิทธิ์ดูหน้านี้ ติดต่อ Owner หรือ Manager ของ workspace เพื่อขอสิทธิ์"
      />
    );
  }

  // ── 3) plan feature ──
  if (feature) {
    if (sub.isLoading) {
      return <Skeleton className="h-64 w-full rounded-xl" />;
    }
    const enabled = sub.data?.plan.features[feature];
    if (!enabled) {
      const planName = FEATURE_PLAN[feature] ?? "Business";
      return (
        <GateCard
          icon={<Sparkles className="h-7 w-7" />}
          title={`อัปเกรดเพื่อใช้ ${FEATURE_LABEL[feature] ?? "ฟีเจอร์นี้"}`}
          description={`ฟีเจอร์นี้อยู่ในแพ็กเกจ ${planName} ขึ้นไป อัปเกรดเพื่อปลดล็อกการใช้งานเต็มรูปแบบ`}
          action={
            <Button asChild>
              <Link href={ROUTES.subscriptions}>อัปเกรดเป็น {planName}</Link>
            </Button>
          }
        />
      );
    }
  }

  return <>{children}</>;
}
