import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin Portal" };

/** ประตูเข้าระบบผู้ดูแล (แยกจากผู้เช่า) — public */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={256}
            height={256}
            priority
            className="h-20 w-auto object-contain"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Portal
          </span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>เข้าสู่ระบบผู้ดูแล</CardTitle>
            <CardDescription>
              สำหรับผู้ดูแลระบบเท่านั้น — บัญชีผู้ใช้ทั่วไปไม่สามารถเข้าได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
