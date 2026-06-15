import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

/** หน้าแรก → ส่งไป dashboard (middleware จะเด้งไป login ถ้ายังไม่ล็อกอิน) */
export default function HomePage() {
  redirect(ROUTES.dashboard);
}
