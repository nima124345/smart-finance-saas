import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: bigint;
  publicId: string;
  email: string;
  systemRole: string;
}

/** ดึง user ที่ผ่าน JWT แล้วจาก request (set โดย JwtStrategy) */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
