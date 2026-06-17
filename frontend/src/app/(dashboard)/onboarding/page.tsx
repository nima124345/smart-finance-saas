import type { Metadata } from "next";

import { OnboardingWizard } from "@/features/workspaces/components/onboarding-wizard";

export const metadata: Metadata = { title: "สร้าง Workspace" };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
