import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ControlImplementationStatus,
  ControlPriority,
} from '../entities/framework-control.entity';

export class CreateFrameworkControlDto {
  // Framework ID is optional - controls can exist independently
  @ApiPropertyOptional({ description: 'Framework ID (optional - controls can exist independently)' })
  @IsOptional()
  @IsUUID()
  frameworkId?: string | null;

  @ApiPropertyOptional({ description: 'Control code from controls service' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  controlCode?: string;

  @ApiPropertyOptional({ description: 'External control ID' })
  @IsOptional()
  @IsUUID()
  externalControlId?: string;

  @ApiProperty({ description: 'Framework requirement ID' })
  @IsString()
  requirementId: string;

  @ApiProperty({ description: 'Control title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Control description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Rationale for the control' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  rationale?: string;

  @ApiPropertyOptional({ description: 'Implementation guidance' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  guidance?: string;

  @ApiPropertyOptional({ enum: ControlImplementationStatus })
  @IsOptional()
  @IsEnum(ControlImplementationStatus)
  implementationStatus?: ControlImplementationStatus;

  @ApiPropertyOptional({ enum: ControlPriority })
  @IsOptional()
  @IsEnum(ControlPriority)
  priority?: ControlPriority;

  @ApiPropertyOptional({ description: 'Control category' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  category?: string;

  @ApiProperty({ description: 'Control domain (e.g., security, privacy, compliance)' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  domain?: string;

  @ApiPropertyOptional({ description: 'Control families' })
  @IsOptional()
  @IsArray()
  controlFamilies?: string[];

  @ApiPropertyOptional({ description: 'Mapped control codes' })
  @IsOptional()
  @IsArray()
  mappedControls?: string[];

  @ApiPropertyOptional({ description: 'Control owner ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Control owner email' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  ownerEmail?: string;

  @ApiPropertyOptional({ description: 'Implementation date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  implementationDate?: Date;

  @ApiPropertyOptional({ description: 'Next review date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextReviewDate?: Date;

  @ApiPropertyOptional({ description: 'Implementation notes' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  implementationNotes?: string;

  @ApiPropertyOptional({ description: 'Testing procedure' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  testingProcedure?: string;

  @ApiPropertyOptional({ description: 'Requires evidence' })
  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;

  @ApiPropertyOptional({ description: 'Evidence IDs' })
  @IsOptional()
  @IsArray()
  evidenceIds?: string[];

  @ApiPropertyOptional({ description: 'Linked risk ID' })
  @IsOptional()
  @IsUUID()
  linkedRiskId?: string;

  @ApiPropertyOptional({ description: 'Risk level' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  riskLevel?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
