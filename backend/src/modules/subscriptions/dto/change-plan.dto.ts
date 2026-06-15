import { IsEnum } from 'class-validator';
import { PlanCode } from '@prisma/client';

export class ChangePlanDto {
  @IsEnum(PlanCode)
  plan!: PlanCode;
}
