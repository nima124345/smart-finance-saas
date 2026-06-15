import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { WorkspaceContext } from '../decorators/current-workspace.decorator';

/** ตรวจ membership role (ใช้คู่กับ WorkspaceGuard) */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<MembershipRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ workspace?: WorkspaceContext }>();
    const role = request.workspace?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
    return true;
  }
}
