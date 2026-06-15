import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "หมวดหมู่" };

/** TODO(Step 6): CategoryList (system + custom) */
export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="หมวดหมู่" description="หมวดหมู่ระบบ และที่คุณสร้างเอง" />
      <EmptyState
        title="ยังไม่มีหมวดหมู่ที่กำหนดเอง"
        description="การจัดการหมวดหมู่จะเพิ่มใน Step 6"
      />
    </>
  );
}
