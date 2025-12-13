import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFrameworkControlDto } from './create-framework-control.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateFrameworkControlDto extends PartialType(
  OmitType(CreateFrameworkControlDto, ['frameworkId'] as const),
) {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsUUID()
  frameworkId?: string | null;
}