import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { ActivityService } from './activity.service';
import { QueryActivityDto } from './dto/query-activity.dto';

// Staff Activity Log — เฉพาะ Owner/Manager (permission activity.view)
@UseGuards(WorkspaceGuard, PermissionGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @RequirePermission('activity.view')
  @Get()
  list(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: QueryActivityDto,
  ) {
    return this.activityService.list(workspaceId, {
      limit: query.limit,
      cursor: query.cursor,
      action: query.action,
    });
  }
}
