import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** plan catalog — ดูได้ทุก user ที่ล็อกอิน */
  @Get('plans')
  plans() {
    return this.subscriptionsService.listPlans();
  }

  @UseGuards(WorkspaceGuard)
  @Get('current')
  current(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.subscriptionsService.current(workspaceId);
  }

  // เฉพาะ owner เปลี่ยน/ยกเลิก plan ได้ (เกี่ยวกับการจ่ายเงิน)
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(MembershipRole.owner)
  @Post('change-plan')
  changePlan(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(workspaceId, dto);
  }

  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(MembershipRole.owner)
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.subscriptionsService.cancel(workspaceId);
  }
}
