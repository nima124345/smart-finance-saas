import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { WorkspaceContext } from '../decorators/current-workspace.decorator';

/**
 * จำกัด route ให้เฉพาะ workspace แบบ business (ใช้คู่กับ WorkspaceGuard ที่ set type ลง context)
 * การ gate ตามแพ็กเกจ (plan feature) ทำใน service ผ่าน subscriptions.assertFeature(...)
 */
@Injectable()
export class BusinessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ workspace?: WorkspaceContext }>();

    if (request.workspace?.type !== 'business') {
      throw new ForbiddenException({
        code: 'WORKSPACE_NOT_BUSINESS',
        message: 'ฟีเจอร์นี้ใช้ได้เฉพาะ workspace แบบธุรกิจ (business)',
      });
    }
    return true;
  }
}
