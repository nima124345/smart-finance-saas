import { IsEnum } from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class ChangeRoleDto {
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
