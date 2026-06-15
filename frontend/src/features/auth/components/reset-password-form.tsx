"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useResetPassword } from "../hooks/use-auth";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";

/** รับ email + token จาก query string (ลิงก์ในอีเมล) */
export function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, token },
  });

  return (
    <form
      onSubmit={handleSubmit((v) =>
        reset.mutate({ email: v.email, token: v.token, password: v.password }),
      )}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" {...register("email")} />
      <input type="hidden" {...register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password">รหัสผ่านใหม่</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {reset.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(reset.error)}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={reset.isPending}>
        {reset.isPending ? "กำลังรีเซ็ต..." : "ตั้งรหัสผ่านใหม่"}
      </Button>
    </form>
  );
}
