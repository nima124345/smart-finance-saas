import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BusinessDashboardService } from './business-dashboard.service';
import { BusinessReportsService } from './business-reports.service';
import { BusinessExportService } from './business-export.service';
import { AiInsightsService } from './insights/ai-insights.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportQueryDto } from './dto/export-query.dto';

/**
 * Business Dashboard + Reports + Export
 * Gate: WorkspaceGuard (membership) → BusinessGuard (type=business) → PermissionGuard (role)
 *        + plan feature (subscriptions.assertFeature) ภายในแต่ละ handler
 */
@UseGuards(WorkspaceGuard, BusinessGuard, PermissionGuard)
@Controller('business')
export class BusinessController {
  constructor(
    private readonly dashboard: BusinessDashboardService,
    private readonly reports: BusinessReportsService,
    private readonly exporter: BusinessExportService,
    private readonly insights: AiInsightsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // ── DASHBOARD ──────────────────────────────────────────────
  @RequirePermission('dashboard.business.view')
  @Get('dashboard')
  async getDashboard(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    await this.subscriptions.assertFeature(workspaceId, 'businessDashboard');
    return this.dashboard.overview(workspaceId);
  }

  // ── REPORTS ────────────────────────────────────────────────
  @RequirePermission('report.view')
  @Get('reports/revenue')
  async revenue(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: ReportQueryDto,
  ) {
    await this.subscriptions.assertFeature(workspaceId, 'businessReports');
    return this.reports.revenue(workspaceId, query);
  }

  @RequirePermission('report.view')
  @Get('reports/expenses')
  async expenses(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: ReportQueryDto,
  ) {
    await this.subscriptions.assertFeature(workspaceId, 'businessReports');
    return this.reports.expenses(workspaceId, query);
  }

  @RequirePermission('report.view')
  @Get('reports/profit')
  async profit(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: ReportQueryDto,
  ) {
    await this.subscriptions.assertFeature(workspaceId, 'businessReports');
    return this.reports.profit(workspaceId, query);
  }

  // ── AI INSIGHTS (Premium) ──────────────────────────────────
  @RequirePermission('ai.insights.view')
  @Get('insights')
  async getInsights(@CurrentWorkspace('workspaceId') workspaceId: bigint) {
    await this.subscriptions.assertFeature(workspaceId, 'aiInsights');
    return this.insights.generate(workspaceId);
  }

  // ── EXPORT ─────────────────────────────────────────────────
  @RequirePermission('report.view')
  @Get('reports/export/pdf')
  async exportPdf(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    await this.subscriptions.assertFeature(workspaceId, 'businessReports');
    const file = await this.exporter.pdf(workspaceId, query);
    this.sendFile(res, file);
  }

  @RequirePermission('report.view')
  @Get('reports/export/excel')
  async exportExcel(
    @CurrentWorkspace('workspaceId') workspaceId: bigint,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    await this.subscriptions.assertFeature(workspaceId, 'businessReports');
    const file = await this.exporter.excel(workspaceId, query);
    this.sendFile(res, file);
  }

  private sendFile(
    res: Response,
    file: { buffer: Buffer; filename: string; contentType: string },
  ) {
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': String(file.buffer.length),
    });
    res.end(file.buffer);
  }
}
