import { Suspense } from "react";
import type { Metadata } from "next";

import { LoadingState } from "@/components/common/loading-state";
import { InviteAcceptView } from "@/features/team/components/invite-accept-view";

export const metadata: Metadata = { title: "รับคำเชิญ" };

export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <InviteAcceptView />
    </Suspense>
  );
}
