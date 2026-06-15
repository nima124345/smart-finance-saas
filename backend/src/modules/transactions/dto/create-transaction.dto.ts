import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  /** จำนวนเงินหน่วยสตางค์ (> 0) */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  /** wallet ต้นทาง (publicId) */
  @IsUUID()
  walletId!: string;

  /** ปลายทาง — บังคับเฉพาะ transfer */
  @ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.transfer)
  @IsUUID()
  destinationWalletId?: string;

  /** หมวดหมู่ — ใช้กับ income/expense (transfer ไม่ใช้) */
  @ValidateIf((o: CreateTransactionDto) => o.type !== TransactionType.transfer)
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsDateString()
  transactionDate!: string;
}
