import type { Metadata } from "next";

import { SubscriptionsView } from "@/features/subscriptions/components/subscriptions-view";

export const metadata: Metadata = { title: "แพ็กเกจ" };

export default function SubscriptionsPage() {
  return <SubscriptionsView />;
}
