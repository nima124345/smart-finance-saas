"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useForgotPassword } from "../hooks/use-auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // success state — แสดงข้อความ generic (ไม่เปิดเผยว่ามี email จริง)
  if (forgot.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-md bg-income/10 px-3 py-3 text-sm text-foreground">
          {forgot.data.message}
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((v) => forgot.mutate(v.email))}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {forgot.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(forgot.error)}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={forgot.isPending}>
        {forgot.isPending ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          กลับไปเข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
