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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@UseGuards(WorkspaceGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    return this.categoriesService.list(workspaceId);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @Post()
  create(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(workspaceId, dto);
  }

  @Roles(MembershipRole.owner, MembershipRole.admin)
  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Param('publicId') publicId: string,
  ) {
    return this.categoriesService.remove(workspaceId, publicId);
  }
}
