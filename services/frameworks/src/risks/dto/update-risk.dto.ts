import { PartialType } from '@nestjs/swagger';
import { CreateRiskDto } from './create-risk.dto';

/**
 * DTO for updating an existing risk
 * All fields from CreateRiskDto are optional
 */
export class UpdateRiskDto extends PartialType(CreateRiskDto) {}
