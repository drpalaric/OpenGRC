import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FrameworkType, FrameworkStatus } from '../entities/framework.entity';

export class CreateFrameworkDto {
  @ApiProperty({ description: 'Unique framework code (e.g., SOC2, ISO27001)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Framework name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Framework description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: FrameworkType })
  @IsOptional()
  @IsEnum(FrameworkType)
  type?: FrameworkType;

  @ApiPropertyOptional({ enum: FrameworkStatus })
  @IsOptional()
  @IsEnum(FrameworkStatus)
  status?: FrameworkStatus;

  @ApiPropertyOptional({ description: 'Framework version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Framework publisher' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDate?: Date;

  @ApiPropertyOptional({ description: 'Certification body' })
  @IsOptional()
  @IsString()
  certificationBody?: string;

  @ApiPropertyOptional({ description: 'Industries this framework applies to' })
  @IsOptional()
  @IsArray()
  industries?: string[];

  @ApiPropertyOptional({ description: 'Regions this framework applies to' })
  @IsOptional()
  @IsArray()
  regions?: string[];

  @ApiPropertyOptional({ description: 'Framework scope' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Framework objectives' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({ description: 'Framework owner ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Next assessment date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextAssessmentDate?: Date;
}
