import type { Metadata } from "next";

import { AdminBillingView } from "@/features/admin/components/admin-billing-view";

export const metadata: Metadata = { title: "Billing · Admin" };

export default function Page() {
  return <AdminBillingView />;
}
