import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PlanCode } from '@prisma/client';

export enum UserStatusFilter {
  Active = 'active',
  Suspended = 'suspended',
}

export class AdminUserQueryDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PlanCode)
  plan?: PlanCode;

  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter;
}
