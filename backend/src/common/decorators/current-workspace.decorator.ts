import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MembershipRole, WorkspaceType } from '@prisma/client';

export interface WorkspaceContext {
  workspaceId: bigint;
  role: MembershipRole;
  type: WorkspaceType;
}

/** ดึง workspace context (set โดย WorkspaceGuard หลังตรวจ membership) */
export const CurrentWorkspace = createParamDecorator(
  (data: keyof WorkspaceContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ workspace: WorkspaceContext }>();
    return data ? request.workspace?.[data] : request.workspace;
  },
);
