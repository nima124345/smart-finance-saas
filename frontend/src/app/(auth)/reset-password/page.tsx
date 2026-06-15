import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่" };

/** รับ email + token จาก query (ลิงก์ในอีเมล) */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ลิงก์ไม่ถูกต้อง</CardTitle>
          <CardDescription>ลิงก์รีเซ็ตรหัสผ่านไม่สมบูรณ์</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            ขอลิงก์รีเซ็ตใหม่
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
        <CardDescription>กรอกรหัสผ่านใหม่ของคุณ</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm email={email} token={token} />
      </CardContent>
    </Card>
  );
}
