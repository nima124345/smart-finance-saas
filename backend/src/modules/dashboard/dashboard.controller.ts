import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@UseGuards(WorkspaceGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** ข้อมูล dashboard ทั้งหมดใน 1 request (stats + charts + insights + widgets) */
  @Get('overview')
  overview(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.overview(workspaceId, query);
  }
}
