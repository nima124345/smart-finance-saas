import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** จำกัด route ตาม membership role ใน workspace (ใช้คู่กับ RolesGuard + WorkspaceGuard) */
export const Roles = (...roles: MembershipRole[]) => SetMetadata(ROLES_KEY, roles);
