import type { Metadata } from "next";

import { AdminUsersView } from "@/features/admin/components/admin-users-view";

export const metadata: Metadata = { title: "Users · Admin" };

export default function Page() {
  return <AdminUsersView />;
}
