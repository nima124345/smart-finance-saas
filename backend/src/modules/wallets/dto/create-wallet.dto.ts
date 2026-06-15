import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { WalletType } from '@prisma/client';

export class CreateWalletDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(WalletType)
  type!: WalletType;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  /** ยอดยกมา (สตางค์) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  initialBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;
}
