import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(120),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
