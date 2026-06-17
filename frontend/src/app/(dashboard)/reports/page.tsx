import type { Metadata } from "next";

import { FeatureGate } from "@/components/common/feature-gate";
import { ReportsView } from "@/features/business/components/reports-view";

export const metadata: Metadata = { title: "รายงานธุรกิจ" };

export default function ReportsPage() {
  return (
    <FeatureGate requireBusiness feature="businessReports" roles={["owner", "admin"]}>
      <ReportsView />
    </FeatureGate>
  );
}
