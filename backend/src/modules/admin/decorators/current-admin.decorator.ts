import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AdminUser } from '../auth/admin-jwt.strategy';

/** ดึง admin ที่ผ่าน admin-jwt แล้วจาก request */
export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: AdminUser }>();
    return data ? req.user?.[data] : req.user;
  },
);
