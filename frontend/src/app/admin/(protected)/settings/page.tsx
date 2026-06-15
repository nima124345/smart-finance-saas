import type { Metadata } from "next";

import { AdminSettingsView } from "@/features/admin/components/admin-settings-view";

export const metadata: Metadata = { title: "Settings · Admin" };

export default function Page() {
  return <AdminSettingsView />;
}
