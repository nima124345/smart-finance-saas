import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Filter + cursor pagination สำหรับ activity log */
export class QueryActivityDto {
  @IsOptional()
  @IsString()
  cursor?: string; // id ของ log สุดท้าย (numeric string)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;

  /** กรองตาม action เช่น transaction.create */
  @IsOptional()
  @IsString()
  action?: string;
}
