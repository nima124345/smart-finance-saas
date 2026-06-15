import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Query pagination มาตรฐาน (ใช้ซ้ำทุก list endpoint) */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;

  get skip(): number {
    return (this.page - 1) * this.perPage;
  }

  get take(): number {
    return this.perPage;
  }
}
