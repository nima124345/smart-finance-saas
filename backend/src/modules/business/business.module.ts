import { Module } from '@nestjs/common';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ActivityModule } from '../activity/activity.module';
import { BusinessController } from './business.controller';
import { BusinessDashboardService } from './business-dashboard.service';
import { BusinessReportsService } from './business-reports.service';
import { BusinessExportService } from './business-export.service';
import { AiInsightsService } from './insights/ai-insights.service';
import { RuleBasedInsightProvider } from './insights/rule-based-insight.provider';
import { INSIGHT_PROVIDER } from './insights/insight.types';

@Module({
  imports: [SubscriptionsModule, ActivityModule],
  controllers: [BusinessController],
  providers: [
    BusinessDashboardService,
    BusinessReportsService,
    BusinessExportService,
    AiInsightsService,
    // สลับเป็น ClaudeInsightProvider ได้ในอนาคตโดยเปลี่ยน useClass ที่นี่จุดเดียว
    { provide: INSIGHT_PROVIDER, useClass: RuleBasedInsightProvider },
  ],
  exports: [BusinessReportsService, BusinessDashboardService],
})
export class BusinessModule {}
