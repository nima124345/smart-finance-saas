import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Permission, roleHasPermission } from '../constants/permissions';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { WorkspaceContext } from '../decorators/current-workspace.decorator';

/**
 * ตรวจ permission ตาม membership role (ใช้คู่กับ WorkspaceGuard ที่ set request.workspace)
 * ต้องมีครบทุก permission ที่ @RequirePermission ระบุ
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ workspace?: WorkspaceContext }>();
    const role = request.workspace?.role;

    if (!role || !required.every((p) => roleHasPermission(role, p))) {
      throw new ForbiddenException('Insufficient workspace permission');
    }
    return true;
  }
}
