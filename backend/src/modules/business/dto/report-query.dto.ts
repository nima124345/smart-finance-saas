import { IsEnum, IsOptional, Matches, ValidateIf } from 'class-validator';

import { ReportPeriod } from '../business-period';

/** ช่วงเวลาของ business dashboard / reports */
export class ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period: ReportPeriod = ReportPeriod.ThisMonth;

  @ValidateIf((o: ReportQueryDto) => o.period === ReportPeriod.Custom)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateFrom ต้องเป็น YYYY-MM-DD' })
  dateFrom?: string;

  @ValidateIf((o: ReportQueryDto) => o.period === ReportPeriod.Custom)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateTo ต้องเป็น YYYY-MM-DD' })
  dateTo?: string;
}
