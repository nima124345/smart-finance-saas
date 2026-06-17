import type { Metadata } from "next";

import { FeatureGate } from "@/components/common/feature-gate";
import { TeamView } from "@/features/team/components/team-view";

export const metadata: Metadata = { title: "ทีมงาน" };

export default function TeamPage() {
  return (
    <FeatureGate requireBusiness>
      <TeamView />
    </FeatureGate>
  );
}
