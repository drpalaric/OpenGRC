import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

/**
 * Risk level enum
 * Used for likelihood and impact assessments
 */
export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Risk treatment strategy enum
 */
export enum RiskTreatment {
  ACCEPT = 'Accept',
  MITIGATE = 'Mitigate',
  TRANSFER = 'Transfer',
  AVOID = 'Avoid',
}

/**
 * DTO for creating a new risk
 */
export class CreateRiskDto {
  @ApiProperty({ description: 'Custom risk identifier (required)' })
  @IsString()
  riskId: string;

  @ApiProperty({ description: 'Risk title (required)' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed risk description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Inherent likelihood before controls',
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  inherentLikelihood?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Inherent impact before controls',
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  inherentImpact?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Residual likelihood after controls',
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  residualLikelihood?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Residual impact after controls',
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  residualImpact?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Overall risk level (calculated)',
  })
  @IsOptional()
  @IsString()
  riskLevel?: string;

  @ApiPropertyOptional({
    description: 'Risk treatment strategy',
    enum: RiskTreatment,
  })
  @IsOptional()
  @IsEnum(RiskTreatment)
  treatment?: RiskTreatment;

  @ApiPropertyOptional({ description: 'Identified threats for this risk' })
  @IsOptional()
  @IsString()
  threats?: string;

  @ApiPropertyOptional({
    description: 'Array of linked control IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  linkedControls?: string[];

  @ApiPropertyOptional({
    description: 'Stakeholders with visibility (will be user IDs)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  stakeholders?: string[];

  @ApiPropertyOptional({ description: 'User who created this risk' })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiPropertyOptional({ description: 'Business unit owning this risk' })
  @IsOptional()
  @IsString()
  businessUnit?: string;

  @ApiPropertyOptional({
    description: 'Risk owner responsible for management',
  })
  @IsOptional()
  @IsString()
  riskOwner?: string;

  @ApiPropertyOptional({ description: 'Assets affected by this risk' })
  @IsOptional()
  @IsString()
  assets?: string;
}
