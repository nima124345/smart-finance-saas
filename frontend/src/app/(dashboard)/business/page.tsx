import type { Metadata } from "next";

import { FeatureGate } from "@/components/common/feature-gate";
import { BusinessDashboardView } from "@/features/business/components/business-dashboard-view";

export const metadata: Metadata = { title: "แดชบอร์ดธุรกิจ" };

export default function BusinessDashboardPage() {
  return (
    <FeatureGate requireBusiness feature="businessDashboard" roles={["owner", "admin"]}>
      <BusinessDashboardView />
    </FeatureGate>
  );
}
