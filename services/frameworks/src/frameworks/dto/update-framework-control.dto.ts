import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFrameworkControlDto } from './create-framework-control.dto';

export class UpdateFrameworkControlDto extends PartialType(
  OmitType(CreateFrameworkControlDto, ['frameworkId'] as const),
) {}
