import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FrameworksService } from './frameworks.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { CreateFrameworkControlDto } from './dto/create-framework-control.dto';
import { UpdateFrameworkControlDto } from './dto/update-framework-control.dto';
import { FilterFrameworkDto } from './dto/filter-framework.dto';
import { Framework } from './entities/framework.entity';
import { FrameworkControl } from './entities/framework-control.entity';

@ApiTags('frameworks')
@Controller()
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new framework' })
  @ApiResponse({
    status: 201,
    description: 'Framework created successfully',
    type: Framework,
  })
  create(@Body() createFrameworkDto: CreateFrameworkDto) {
    return this.frameworksService.create(createFrameworkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all frameworks with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Frameworks retrieved successfully',
  })
  findAll(@Query() filterDto: FilterFrameworkDto) {
    return this.frameworksService.findAll(filterDto);
  }

  // Specific routes BEFORE parameterized routes to avoid conflicts
  @Get('code/:code')
  @ApiOperation({ summary: 'Get framework by code' })
  @ApiParam({ name: 'code', description: 'Framework code' })
  @ApiResponse({
    status: 200,
    description: 'Framework retrieved successfully',
    type: Framework,
  })
  findByCode(@Param('code') code: string) {
    return this.frameworksService.findByCode(code);
  }

  @Get('controls')
  @ApiOperation({ summary: 'Get all controls' })
  @ApiResponse({
    status: 200,
    description: 'Controls retrieved successfully',
  })
  async findAllControls() {
    return this.frameworksService.findAllControls();
  }

  @Post('controls')
  @ApiOperation({ summary: 'Create a new framework control' })
  @ApiResponse({
    status: 201,
    description: 'Framework control created successfully',
    type: FrameworkControl,
  })
  createControl(@Body() createFrameworkControlDto: CreateFrameworkControlDto) {
    return this.frameworksService.addControl(createFrameworkControlDto);
  }

  @Get('controls/:id')
  @ApiOperation({ summary: 'Get framework control by ID' })
  @ApiParam({ name: 'id', description: 'Control ID' })
  @ApiResponse({
    status: 200,
    description: 'Control retrieved successfully',
    type: FrameworkControl,
  })
  findControl(@Param('id') id: string) {
    return this.frameworksService.findControl(id);
  }

  @Put('controls/:id')
  @ApiOperation({ summary: 'Update framework control' })
  @ApiParam({ name: 'id', description: 'Control ID' })
  @ApiResponse({
    status: 200,
    description: 'Control updated successfully',
    type: FrameworkControl,
  })
  updateControl(
    @Param('id') id: string,
    @Body() updateControlDto: UpdateFrameworkControlDto,
  ) {
    return this.frameworksService.updateControl(id, updateControlDto);
  }

  @Delete('controls/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete framework control' })
  @ApiParam({ name: 'id', description: 'Control ID' })
  @ApiResponse({ status: 204, description: 'Control deleted successfully' })
  removeControl(@Param('id') id: string) {
    return this.frameworksService.removeControl(id);
  }

  // Framework-specific routes with :id parameter
  @Get(':id')
  @ApiOperation({ summary: 'Get framework by ID' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Framework retrieved successfully',
    type: Framework,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.frameworksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update framework' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Framework updated successfully',
    type: Framework,
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateFrameworkDto: UpdateFrameworkDto) {
    return this.frameworksService.update(id, updateFrameworkDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete framework' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({ status: 204, description: 'Framework deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.frameworksService.remove(id);
  }

  @Get(':id/controls')
  @ApiOperation({ summary: 'Get all controls for a framework with optional domain filter' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Controls retrieved successfully',
  })
  findControls(
    @Param('id', ParseUUIDPipe) frameworkId: string,
    @Query('domain') domain?: string,
  ) {
    return this.frameworksService.findControls(frameworkId, domain);
  }

  @Post(':id/controls/add-bulk')
  @ApiOperation({ summary: 'Bulk add existing controls to a framework (reassign)' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Controls added to framework successfully',
  })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  bulkAddControls(
    @Param('id', ParseUUIDPipe) frameworkId: string,
    @Body() body: { controlIds: string[] },
  ) {
    return this.frameworksService.bulkAddControlsToFramework(
      frameworkId,
      body.controlIds,
    );
  }

  @Post(':id/controls/remove-bulk')
  @ApiOperation({ summary: 'Bulk remove controls from a framework (unlink, not delete)' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Controls removed from framework successfully',
  })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  bulkRemoveControls(
    @Param('id', ParseUUIDPipe) frameworkId: string,
    @Body() body: { controlIds: string[] },
  ) {
    return this.frameworksService.bulkRemoveControlsFromFramework(
      frameworkId,
      body.controlIds,
    );
  }

  // Progress tracking
  @Post(':id/progress/update')
  @ApiOperation({ summary: 'Update framework progress metrics' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Progress updated successfully',
    type: Framework,
  })
  updateProgress(@Param('id', ParseUUIDPipe) frameworkId: string) {
    return this.frameworksService.updateFrameworkProgress(frameworkId);
  }

  // Risk reporting
  @Get(':id/risk-report')
  @ApiOperation({ summary: 'Get framework risk report' })
  @ApiParam({ name: 'id', description: 'Framework ID' })
  @ApiResponse({
    status: 200,
    description: 'Risk report generated successfully',
  })
  getRiskReport(@Param('id', ParseUUIDPipe) frameworkId: string) {
    return this.frameworksService.getFrameworkRiskReport(frameworkId);
  }
}
