import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkspaceType } from '@prisma/client';

export class CreateWorkspaceDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(WorkspaceType)
  type!: WorkspaceType;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  baseCurrency?: string;
}
