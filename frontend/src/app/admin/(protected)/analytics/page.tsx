import type { Metadata } from "next";

import { AdminAnalyticsView } from "@/features/admin/components/admin-analytics-view";

export const metadata: Metadata = { title: "Analytics · Admin" };

export default function Page() {
  return <AdminAnalyticsView />;
}
