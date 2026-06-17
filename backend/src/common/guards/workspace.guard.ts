import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * ตรวจว่า user เป็นสมาชิกของ workspace ที่ระบุใน header X-Workspace-Id
 * แล้วแนบ { workspaceId, role } ลง request (กัน IDOR / ข้อมูลข้าม tenant)
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      headers: Record<string, string | undefined>;
      workspace?: unknown;
    }>();

    const header = request.headers['x-workspace-id'];
    if (!header) {
      throw new ForbiddenException('Missing X-Workspace-Id header');
    }

    // header เป็น publicId (uuid) — กัน enumeration
    const membership = await this.prisma.membership.findFirst({
      where: {
        user: { id: request.user.id },
        workspace: { publicId: header, deletedAt: null },
      },
      select: {
        role: true,
        workspaceId: true,
        workspace: { select: { type: true } },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspace = {
      workspaceId: membership.workspaceId,
      role: membership.role,
      type: membership.workspace.type,
    };
    return true;
  }
}
