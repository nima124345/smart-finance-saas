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
import { PaymentStatus, PlanCode, SupportStatus } from '@prisma/client';

import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ChangePlanDto } from '../subscriptions/dto/change-plan.dto';
import { AdminJwtGuard } from './auth/admin-jwt.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AuditService } from './audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminBillingService } from './services/admin-billing.service';
import { AdminWorkspacesService } from './services/admin-workspaces.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminSupportService } from './services/admin-support.service';
import { AdminSettingsService } from './services/admin-settings.service';

// @Public ข้าม tenant guard, AdminJwtGuard บังคับ admin token (scope=admin)
@Public()
@UseGuards(AdminJwtGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly users: AdminUsersService,
    private readonly billing: AdminBillingService,
    private readonly workspaces: AdminWorkspacesService,
    private readonly analytics: AdminAnalyticsService,
    private readonly support: AdminSupportService,
    private readonly settings: AdminSettingsService,
    private readonly audit: AuditService,
  ) {}

  // ── Dashboard ──
  @Get('dashboard')
  getDashboard() {
    return this.dashboard.overview();
  }

  // ── Users ──
  @Get('users')
  listUsers(@Query() q: AdminUserQueryDto) {
    return this.users.list(q);
  }

  @Post('users/:id/suspend')
  suspendUser(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.users.suspend(adminId, id);
  }

  @Post('users/:id/activate')
  activateUser(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.users.activate(adminId, id);
  }

  @Post('users/:id/reset-password')
  resetUserPassword(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.users.resetPassword(adminId, id);
  }

  @Post('users/:id/change-plan')
  changeUserPlan(
    @CurrentAdmin('id') adminId: bigint,
    @Param('id') id: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.users.changePlan(adminId, id, dto.plan as PlanCode);
  }

  @Post('users/:id/impersonate')
  impersonate(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.users.impersonate(adminId, id);
  }

  @Delete('users/:id')
  deleteUser(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.users.remove(adminId, id);
  }

  // ── Billing ──
  @Get('billing/overview')
  billingOverview() {
    return this.billing.overview();
  }

  @Get('billing/payments')
  payments(@Query('status') status?: PaymentStatus) {
    return this.billing.payments(status);
  }

  @Post('billing/payments/:id/approve')
  approvePayment(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.billing.approve(adminId, id);
  }

  @Post('billing/payments/:id/reject')
  rejectPayment(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.billing.reject(adminId, id);
  }

  // ── Workspaces ──
  @Get('workspaces')
  listWorkspaces(@Query() q: PaginationDto) {
    return this.workspaces.list(q.page, q.perPage);
  }

  @Post('workspaces/:id/suspend')
  suspendWorkspace(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.workspaces.suspend(adminId, id);
  }

  @Post('workspaces/:id/restore')
  restoreWorkspace(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.workspaces.restore(adminId, id);
  }

  @Post('workspaces/:id/force-plan')
  forceWorkspacePlan(
    @CurrentAdmin('id') adminId: bigint,
    @Param('id') id: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.workspaces.forcePlan(adminId, id, dto.plan as PlanCode);
  }

  @Delete('workspaces/:id')
  deleteWorkspace(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.workspaces.remove(adminId, id);
  }

  // ── Analytics ──
  @Get('analytics')
  getAnalytics() {
    return this.analytics.overview();
  }

  // ── Support ──
  @Get('support/tickets')
  tickets(@Query('status') status?: SupportStatus) {
    return this.support.tickets(status);
  }

  @Post('support/tickets/:id/close')
  closeTicket(@CurrentAdmin('id') adminId: bigint, @Param('id') id: string) {
    return this.support.closeTicket(adminId, id);
  }

  @Get('support/trace')
  trace(@Query('query') query: string) {
    return this.support.traceUser(query);
  }

  // ── Settings ──
  @Get('settings')
  getSettings() {
    return this.settings.getAll();
  }

  @Patch('settings/plans/:code')
  updatePlan(
    @CurrentAdmin('id') adminId: bigint,
    @Param('code') code: PlanCode,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.updatePlan(adminId, code, body);
  }

  @Patch('settings/app/:key')
  updateSetting(
    @CurrentAdmin('id') adminId: bigint,
    @Param('key') key: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.updateSetting(adminId, key, body);
  }

  // ── Audit / System logs ──
  @Get('audit')
  audits(@Query() q: PaginationDto) {
    return this.audit.list(q.skip, q.take);
  }
}
