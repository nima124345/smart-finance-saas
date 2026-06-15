import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../common/guards/admin.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminService } from './admin.service';

// JWT global + ต้องเป็น system admin
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  users(@Query() query: PaginationDto) {
    return this.adminService.listUsers(query);
  }

  @Get('dashboard')
  dashboard() {
    return this.adminService.revenueDashboard();
  }
}
