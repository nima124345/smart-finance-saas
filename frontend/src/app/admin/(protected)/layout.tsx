import { AdminPortalGuard } from "@/features/admin/components/admin-portal-guard";
import { AdminShell } from "@/features/admin/components/admin-shell";

/** โซนหลังบ้าน Admin (ป้องกันด้วย role=admin) — แยก shell จากผู้เช่า */
export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPortalGuard>
      <AdminShell>{children}</AdminShell>
    </AdminPortalGuard>
  );
}
