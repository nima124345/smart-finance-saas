import type { Metadata } from "next";

import { FeatureGate } from "@/components/common/feature-gate";
import { InsightsView } from "@/features/business/components/insights-view";

export const metadata: Metadata = { title: "AI Insights" };

export default function InsightsPage() {
  return (
    <FeatureGate requireBusiness feature="aiInsights" roles={["owner", "admin"]}>
      <InsightsView />
    </FeatureGate>
  );
}
