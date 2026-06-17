import { IsEmail, IsEnum } from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  email!: string;

  // owner เชิญไม่ได้ (ตรวจซ้ำใน service) — รับเฉพาะ admin (Manager) | member (Staff)
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
