import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TeamService } from './team.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

/**
 * รับคำเชิญ — ต้อง login (JWT global) แต่ "ไม่" ผ่าน WorkspaceGuard
 * (ผู้รับยังไม่เป็นสมาชิก workspace จนกว่าจะ accept)
 */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly teamService: TeamService) {}

  /** ดูรายละเอียดคำเชิญก่อนรับ (token อยู่ใน path) */
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.teamService.previewInvitation(token);
  }

  @Post('accept')
  accept(
    @CurrentUser('id') id: bigint,
    @CurrentUser('email') email: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.teamService.acceptInvitation({ id, email }, dto.token);
  }
}
