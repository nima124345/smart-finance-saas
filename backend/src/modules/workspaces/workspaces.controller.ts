import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

// ระดับ user (JWT global) — ไม่ใช้ WorkspaceGuard เพราะดำเนินการข้าม workspace ของตัวเอง
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  list(@CurrentUser('id') userId: bigint) {
    return this.workspacesService.listForUser(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: bigint, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }

  @Get(':publicId')
  findOne(
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.workspacesService.findOne(userId, publicId);
  }

  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: bigint, @Param('publicId') publicId: string) {
    return this.workspacesService.remove(userId, publicId);
  }
}
