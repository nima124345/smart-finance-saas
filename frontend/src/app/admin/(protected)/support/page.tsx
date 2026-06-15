import type { Metadata } from "next";

import { AdminSupportView } from "@/features/admin/components/admin-support-view";

export const metadata: Metadata = { title: "Support · Admin" };

export default function Page() {
  return <AdminSupportView />;
}
