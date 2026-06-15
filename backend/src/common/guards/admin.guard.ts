import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';

import { AuthUser } from '../decorators/current-user.decorator';

/** จำกัดเฉพาะ platform admin (Admin Dashboard) */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (request.user?.systemRole !== SystemRole.admin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
