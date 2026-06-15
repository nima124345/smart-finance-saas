import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export enum TransactionSort {
  Latest = 'latest',
  Oldest = 'oldest',
  AmountHigh = 'amount_high',
  AmountLow = 'amount_low',
}

/** Filter + cursor pagination + sort */
export class QueryTransactionDto {
  // ── cursor pagination (ไม่ใช้ offset) ──
  @IsOptional()
  @IsUUID()
  cursor?: string; // publicId ของรายการสุดท้าย

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsEnum(TransactionSort)
  sort: TransactionSort = TransactionSort.Latest;

  // ── filters ──
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsUUID()
  walletId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** YYYY-MM (แยกตามเดือน) */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month ต้องเป็นรูปแบบ YYYY-MM' })
  month?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMax?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
