import { IsEnum, IsOptional, Matches, ValidateIf } from 'class-validator';

import { ReportPeriod } from '../business-period';

export enum ReportKind {
  Revenue = 'revenue',
  Expenses = 'expenses',
  Profit = 'profit',
}

/** เลือกชนิดรายงาน + ช่วงเวลาสำหรับ export (format อยู่ใน path: /pdf | /excel) */
export class ExportQueryDto {
  @IsOptional()
  @IsEnum(ReportKind)
  report: ReportKind = ReportKind.Profit;

  @IsOptional()
  @IsEnum(ReportPeriod)
  period: ReportPeriod = ReportPeriod.ThisMonth;

  @ValidateIf((o: ExportQueryDto) => o.period === ReportPeriod.Custom)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateFrom ต้องเป็น YYYY-MM-DD' })
  dateFrom?: string;

  @ValidateIf((o: ExportQueryDto) => o.period === ReportPeriod.Custom)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateTo ต้องเป็น YYYY-MM-DD' })
  dateTo?: string;
}
