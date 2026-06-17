import type { Metadata } from "next";

import { FeatureGate } from "@/components/common/feature-gate";
import { ActivityView } from "@/features/business/components/activity-view";

export const metadata: Metadata = { title: "Activity Log" };

export default function ActivityPage() {
  return (
    <FeatureGate requireBusiness feature="activityLog" roles={["owner", "admin"]}>
      <ActivityView />
    </FeatureGate>
  );
}
