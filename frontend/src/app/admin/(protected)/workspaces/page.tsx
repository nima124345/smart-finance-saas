import type { Metadata } from "next";

import { AdminWorkspacesView } from "@/features/admin/components/admin-workspaces-view";

export const metadata: Metadata = { title: "Workspaces · Admin" };

export default function Page() {
  return <AdminWorkspacesView />;
}
