import type { Metadata } from "next";

import { AdminDashboardView } from "@/features/admin/components/admin-dashboard-view";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminPage() {
  return <AdminDashboardView />;
}
