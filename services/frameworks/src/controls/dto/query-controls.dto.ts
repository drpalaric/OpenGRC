import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for querying controls with optional filters
 */
export class QueryControlsDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
