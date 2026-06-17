import { SetMetadata } from '@nestjs/common';

import { Permission } from '../constants/permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * จำกัด route ตาม permission ของ membership role (ใช้คู่กับ PermissionGuard + WorkspaceGuard)
 * ต้องมี "ทุก" permission ที่ระบุ (AND)
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
