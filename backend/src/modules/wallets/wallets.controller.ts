import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@UseGuards(WorkspaceGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  list(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.walletsService.list(workspaceId);
  }

  @Get(':publicId')
  findOne(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.walletsService.findOne(workspaceId, publicId);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin)
  @Post()
  create(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Body() dto: CreateWalletDto,
  ) {
    return this.walletsService.create(workspaceId, dto);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin)
  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.walletsService.remove(workspaceId, publicId);
  }
}
