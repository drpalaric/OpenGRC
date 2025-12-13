import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { Risk } from './entities/risk.entity';

/**
 * Risks controller
 * Handles HTTP requests for risk management operations
 */
@ApiTags('risks')
@Controller('risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  /**
   * Create a new risk
   * POST /risks
   */
  @Post()
  @ApiOperation({ summary: 'Create a new risk' })
  @ApiResponse({
    status: 201,
    description: 'Risk created successfully',
    type: Risk,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or duplicate riskId',
  })
  create(@Body() createRiskDto: CreateRiskDto) {
    return this.risksService.create(createRiskDto);
  }

  /**
   * Get all risks
   * GET /risks
   */
  @Get()
  @ApiOperation({ summary: 'Get all risks' })
  @ApiResponse({
    status: 200,
    description: 'Risks retrieved successfully',
    type: [Risk],
  })
  findAll() {
    return this.risksService.findAll();
  }

  /**
   * Get a single risk by ID
   * GET /risks/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get risk by ID' })
  @ApiParam({ name: 'id', description: 'Risk UUID' })
  @ApiResponse({
    status: 200,
    description: 'Risk retrieved successfully',
    type: Risk,
  })
  @ApiResponse({
    status: 404,
    description: 'Risk not found',
  })
  findOne(@Param('id') id: string) {
    return this.risksService.findOne(id);
  }

  /**
   * Update an existing risk
   * PUT /risks/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a risk' })
  @ApiParam({ name: 'id', description: 'Risk UUID' })
  @ApiResponse({
    status: 200,
    description: 'Risk updated successfully',
    type: Risk,
  })
  @ApiResponse({
    status: 404,
    description: 'Risk not found',
  })
  update(@Param('id') id: string, @Body() updateRiskDto: UpdateRiskDto) {
    return this.risksService.update(id, updateRiskDto);
  }

  /**
   * Delete a risk
   * DELETE /risks/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a risk' })
  @ApiParam({ name: 'id', description: 'Risk UUID' })
  @ApiResponse({
    status: 204,
    description: 'Risk deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Risk not found',
  })
  remove(@Param('id') id: string) {
    return this.risksService.remove(id);
  }
}
