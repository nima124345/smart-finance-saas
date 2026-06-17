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
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentWorkspace,
  WorkspaceContext,
} from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

// ทุก route ต้องผ่าน JWT (global) + เป็นสมาชิก workspace (WorkspaceGuard)
@UseGuards(WorkspaceGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: QueryTransactionDto,
  ) {
    return this.transactionsService.list(workspaceId, query);
  }

  @Get(':publicId')
  findOne(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.transactionsService.findOne(workspaceId, publicId);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @Post()
  create(
    @CurrentWorkspace() ws: WorkspaceContext,
    @CurrentUser('id') userId: bigint,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(ws.workspaceId, userId, dto);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @Patch(':publicId')
  update(
    @CurrentWorkspace() ws: WorkspaceContext,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(ws.workspaceId, publicId, dto, {
      userId,
      role: ws.role,
    });
  }

  @Roles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentWorkspace() ws: WorkspaceContext,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.transactionsService.remove(ws.workspaceId, publicId, {
      userId,
      role: ws.role,
    });
  }

  @Roles(MembershipRole.owner, MembershipRole.admin)
  @Post(':publicId/restore')
  restore(
    @CurrentWorkspace() ws: WorkspaceContext,
    @CurrentUser('id') userId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.transactionsService.restore(ws.workspaceId, publicId, {
      userId,
      role: ws.role,
    });
  }
}
