import { Inject, Injectable } from '@nestjs/common';

import { BusinessReportsService } from '../business-reports.service';
import { ReportKind } from '../dto/export-query.dto';
import { ReportPeriod } from '../business-period';
import {
  INSIGHT_PROVIDER,
  Insight,
  InsightProvider,
} from './insight.types';

@Injectable()
export class AiInsightsService {
  constructor(
    private readonly reports: BusinessReportsService,
    @Inject(INSIGHT_PROVIDER) private readonly provider: InsightProvider,
  ) {}

  async generate(workspaceId: bigint) {
    const [current, revenue, prevExpenses] = await Promise.all([
      this.reports.build(workspaceId, ReportKind.Expenses, {
        period: ReportPeriod.ThisMonth,
      }),
      this.reports.build(workspaceId, ReportKind.Revenue, {
        period: ReportPeriod.ThisMonth,
      }),
      this.reports.build(workspaceId, ReportKind.Expenses, {
        period: ReportPeriod.LastMonth,
      }),
    ]);

    const prevExpenseByName = new Map<string, bigint>(
      prevExpenses.categories.map((c) => [c.name, BigInt(c.total)]),
    );

    const insights: Insight[] = await this.provider.generate({
      current,
      expenseCategories: current.categories,
      revenueCategories: revenue.categories,
      prevExpenseByName,
    });

    return {
      provider: this.provider.name,
      period: current.period,
      summary: current.summary,
      count: insights.length,
      insights,
    };
  }
}
