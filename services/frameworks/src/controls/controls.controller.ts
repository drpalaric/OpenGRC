import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ControlsService } from './controls.service';
import { Control } from './entities/control.entity';
import { QueryControlsDto } from './dto/query-controls.dto';

/**
 * Controller for controls master library endpoints
 * Provides read-only access to all controls (SCF, CIS, NIST, custom, etc.)
 */
@ApiTags('Controls')
@Controller('controls')
export class ControlsController {
  constructor(private readonly controlsService: ControlsService) {}

  /**
   * Get all controls with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all controls from master library' })
  @ApiQuery({ name: 'domain', required: false, description: 'Filter by domain' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source (SCF, CIS, etc.)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiResponse({ status: 200, description: 'List of controls returned successfully' })
  async findAll(@Query() query: QueryControlsDto) {
    const controls = query.search
      ? await this.controlsService.search(query.search)
      : await this.controlsService.findAll(query);

    return {
      success: true,
      data: controls,
      meta: {
        total: controls.length,
      },
    };
  }

  /**
   * Get a single control by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a control by ID' })
  @ApiResponse({ status: 200, description: 'Control returned successfully' })
  @ApiResponse({ status: 404, description: 'Control not found' })
  async findOne(@Param('id') id: string) {
    const control = await this.controlsService.findOne(id);

    return {
      success: true,
      data: control,
    };
  }

  /**
   * Update a control
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a control' })
  @ApiResponse({ status: 200, description: 'Control updated successfully' })
  @ApiResponse({ status: 404, description: 'Control not found' })
  async update(@Param('id') id: string, @Body() updateData: Partial<Control>) {
    const control = await this.controlsService.update(id, updateData);

    return {
      success: true,
      data: control,
    };
  }

  /**
   * Get statistics about controls
   */
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get controls statistics' })
  @ApiResponse({ status: 200, description: 'Statistics returned successfully' })
  async getStats() {
    const total = await this.controlsService.count();

    return {
      success: true,
      data: {
        total,
      },
    };
  }
}
