import { IsEnum, IsOptional, Matches } from 'class-validator';

export enum DashboardRange {
  ThisMonth = 'this_month',
  LastMonth = 'last_month',
  ThreeMonths = '3m',
  SixMonths = '6m',
  TwelveMonths = '12m',
  Custom = 'custom',
}

export class DashboardQueryDto {
  @IsOptional()
  @IsEnum(DashboardRange)
  range: DashboardRange = DashboardRange.ThisMonth;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;
}
