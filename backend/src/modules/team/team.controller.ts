import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

// จัดการทีมใน workspace — gated ด้วย permission (Owner/Manager)
@UseGuards(WorkspaceGuard, PermissionGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @RequirePermission('team.view')
  @Get('members')
  listMembers(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.teamService.listMembers(workspaceId);
  }

  @RequirePermission('team.manage')
  @Get('invitations')
  listInvitations(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.teamService.listInvitations(workspaceId);
  }

  @RequirePermission('team.manage')
  @Post('invitations')
  invite(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @CurrentWorkspace('role') role: MembershipRole,
    @CurrentUser('id') userId: bigint,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamService.invite(workspaceId, { userId, role }, dto);
  }

  @RequirePermission('team.manage')
  @Delete('invitations/:publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeInvitation(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @CurrentWorkspace('role') role: MembershipRole,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.teamService.revokeInvitation(
      workspaceId,
      { userId, role },
      publicId,
    );
  }

  @RequirePermission('team.manage')
  @Patch('members/:publicId/role')
  changeRole(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @CurrentWorkspace('role') role: MembershipRole,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.teamService.changeRole(
      workspaceId,
      { userId, role },
      publicId,
      dto,
    );
  }

  @RequirePermission('team.manage')
  @Delete('members/:publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @CurrentWorkspace('role') role: MembershipRole,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.teamService.removeMember(workspaceId, { userId, role }, publicId);
  }
}
