import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "ตั้งค่า" };

/** TODO: โปรไฟล์ · workspace · ธีม · ความปลอดภัย */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="ตั้งค่า" description="โปรไฟล์ · workspace · ธีม" />
      <EmptyState
        title="หน้าตั้งค่า"
        description="ฟอร์มตั้งค่าจะเพิ่มในขั้นถัดไป"
      />
    </>
  );
}
