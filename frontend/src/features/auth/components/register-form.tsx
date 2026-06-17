"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useRegister } from "../hooks/use-auth";
import { registerSchema, type RegisterInput } from "../schemas";
import { GoogleButton } from "./google-button";

export function RegisterForm() {
  const signup = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  return (
    <form
      onSubmit={handleSubmit((v) => signup.mutate(v))}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" autoComplete="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
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

      {signup.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(signup.error)}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={signup.isPending}>
        {signup.isPending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>

      <GoogleButton label="สมัครด้วย Google" />

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
