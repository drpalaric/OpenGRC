import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Framework } from './entities/framework.entity';
import { FrameworkControl } from './entities/framework-control.entity';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { CreateFrameworkControlDto } from './dto/create-framework-control.dto';
import { UpdateFrameworkControlDto } from './dto/update-framework-control.dto';
import { FilterFrameworkDto } from './dto/filter-framework.dto';
import { PaginatedResponse } from '../common';

@Injectable()
export class FrameworksService {
  constructor(
    @InjectRepository(Framework)
    private frameworkRepository: Repository<Framework>,
    @InjectRepository(FrameworkControl)
    private frameworkControlRepository: Repository<FrameworkControl>,
  ) {}

  async create(createFrameworkDto: CreateFrameworkDto): Promise<Framework> {
    const existing = await this.frameworkRepository.findOne({
      where: { code: createFrameworkDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Framework with code ${createFrameworkDto.code} already exists`,
      );
    }

    const framework = this.frameworkRepository.create(createFrameworkDto);
    return this.frameworkRepository.save(framework);
  }

  async findAll(
    filterDto: FilterFrameworkDto,
  ): Promise<PaginatedResponse<Framework>> {
    const {
      search,
      type,
      status,
      ownerId,
      tags,
      industries,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = filterDto;

    const query = this.frameworkRepository.createQueryBuilder('framework');

    if (search) {
      query.andWhere(
        '(framework.name ILIKE :search OR framework.code ILIKE :search OR framework.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      query.andWhere('framework.type = :type', { type });
    }

    if (status) {
      query.andWhere('framework.status = :status', { status });
    }

    if (ownerId) {
      query.andWhere('framework.ownerId = :ownerId', { ownerId });
    }

    if (tags && tags.length > 0) {
      query.andWhere('framework.tags && :tags', { tags });
    }

    if (industries && industries.length > 0) {
      query.andWhere('framework.industries && :industries', { industries });
    }

    query.orderBy(`framework.${sortBy}`, sortOrder);

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Framework> {
    const framework = await this.frameworkRepository.findOne({
      where: { id },
      relations: ['frameworkControls'],
    });

    if (!framework) {
      throw new NotFoundException(`Framework with ID ${id} not found`);
    }

    return framework;
  }

  async findByCode(code: string): Promise<Framework> {
    const framework = await this.frameworkRepository.findOne({
      where: { code },
      relations: ['frameworkControls'],
    });

    if (!framework) {
      throw new NotFoundException(`Framework with code ${code} not found`);
    }

    return framework;
  }

  async update(
    id: string,
    updateFrameworkDto: UpdateFrameworkDto,
  ): Promise<Framework> {
    const framework = await this.findOne(id);

    if (updateFrameworkDto.code && updateFrameworkDto.code !== framework.code) {
      const existing = await this.frameworkRepository.findOne({
        where: { code: updateFrameworkDto.code },
      });
      if (existing) {
        throw new BadRequestException(
          `Framework with code ${updateFrameworkDto.code} already exists`,
        );
      }
    }

    Object.assign(framework, updateFrameworkDto);
    return this.frameworkRepository.save(framework);
  }

  async remove(id: string): Promise<void> {
    const framework = await this.findOne(id);
    await this.frameworkRepository.remove(framework);
  }

  // Framework Control operations
  // Controls can be created with or without a framework association
async addControl(
  createControlDto: CreateFrameworkControlDto,
): Promise<FrameworkControl> {

  // Normalize empty string to null
  if (createControlDto.frameworkId === '') {
    createControlDto.frameworkId = null;
  }

  // If frameworkId exists, verify it
  if (createControlDto.frameworkId) {
    await this.findOne(createControlDto.frameworkId);
  }

  // Create control ONCE, explicitly setting frameworkId
  const control = this.frameworkControlRepository.create({
    ...createControlDto,
    frameworkId: createControlDto.frameworkId ?? null,
  });

  const savedControl = await this.frameworkControlRepository.save(control);

  // Update progress ONLY if assigned
  if (savedControl.frameworkId) {
    await this.updateFrameworkProgress(savedControl.frameworkId);
  }

  return savedControl;
}

  // Find controls for a framework with optional domain filter (exact match)
  async findControls(frameworkId: string, domain?: string): Promise<FrameworkControl[]> {
    await this.findOne(frameworkId); // Verify framework exists

    // Build where clause with optional domain filter
    const whereClause: any = { frameworkId };
    if (domain) {
      whereClause.domain = domain; // Exact match only
    }

    return this.frameworkControlRepository.find({
      where: whereClause,
      order: { requirementId: 'ASC' },
    });
  }

  async findAllControls(): Promise<FrameworkControl[]> {
    return this.frameworkControlRepository.find();
  }

  async findControl(id: string): Promise<FrameworkControl> {
    const control = await this.frameworkControlRepository.findOne({
      where: { id },
    });

    if (!control) {
      throw new NotFoundException(`Framework control with ID ${id} not found`);
    }

    return control;
  }

  async updateControl(
    id: string,
    updateControlDto: UpdateFrameworkControlDto,
  ): Promise<FrameworkControl> {
    const control = await this.findControl(id);
    const oldFrameworkId = control.frameworkId;
    
    // Defensive: works even if class-transformer isn't running
    if (updateControlDto.frameworkId === '') updateControlDto.frameworkId = null;
    
    Object.assign(control, updateControlDto);

    const updated = await this.frameworkControlRepository.save(control);

    // Update framework progress for the old framework id the control as moved
    if (oldFrameworkId && oldFrameworkId !== updated.frameworkId) {
      await this.updateFrameworkProgress(oldFrameworkId);
    }

    // Update progress for the new/current framework
    if (updated.frameworkId) {
      await this.updateFrameworkProgress(updated.frameworkId);
    }

    return updated;
  }

  async removeControl(id: string): Promise<void> {
    const control = await this.findControl(id);
    const frameworkId = control.frameworkId;
    await this.frameworkControlRepository.remove(control);

    // Update framework progress
    if (frameworkId) {
      await this.updateFrameworkProgress(frameworkId);
    }
  }

  // Progress tracking
  async updateFrameworkProgress(frameworkId: string): Promise<Framework> {
    const framework = await this.findOne(frameworkId);
    const controls = await this.findControls(frameworkId);

    framework.totalControls = controls.length;
    framework.implementedControls = controls.filter(
      (c) => c.implementationStatus === 'implemented',
    ).length;
    framework.partiallyImplementedControls = controls.filter(
      (c) => c.implementationStatus === 'partially_implemented',
    ).length;
    framework.notImplementedControls = controls.filter(
      (c) => c.implementationStatus === 'not_implemented',
    ).length;

    if (framework.totalControls > 0) {
      framework.completionPercentage = Number(
        (
          ((framework.implementedControls +
            framework.partiallyImplementedControls * 0.5) /
            framework.totalControls) *
          100
        ).toFixed(2),
      );
    }

    return this.frameworkRepository.save(framework);
  }

  // Risk reporting
  async getFrameworkRiskReport(frameworkId: string): Promise<any> {
    const framework = await this.findOne(frameworkId);
    const controls = await this.findControls(frameworkId);

    const controlsWithRisks = controls.filter((c) => c.linkedRiskId);

    // Calculate risk distribution
    const riskDistribution = {
      critical: controls.filter((c) => c.riskLevel === 'critical').length,
      high: controls.filter((c) => c.riskLevel === 'high').length,
      medium: controls.filter((c) => c.riskLevel === 'medium').length,
      low: controls.filter((c) => c.riskLevel === 'low').length,
    };

    // Update framework risk metrics
    framework.criticalRisks = riskDistribution.critical;
    framework.highRisks = riskDistribution.high;
    framework.mediumRisks = riskDistribution.medium;
    framework.lowRisks = riskDistribution.low;
    framework.lastAssessmentDate = new Date();

    await this.frameworkRepository.save(framework);

    return {
      frameworkId: framework.id,
      frameworkName: framework.name,
      totalControls: framework.totalControls,
      controlsWithRisks: controlsWithRisks.length,
      riskDistribution,
      completionPercentage: framework.completionPercentage,
      lastAssessmentDate: framework.lastAssessmentDate,
      nextAssessmentDate: framework.nextAssessmentDate,
      recommendations: this.generateRecommendations(framework, riskDistribution),
    };
  }

  private generateRecommendations(
    framework: Framework,
    riskDistribution: any,
  ): string[] {
    const recommendations: string[] = [];

    if (riskDistribution.critical > 0) {
      recommendations.push(
        `Address ${riskDistribution.critical} critical risk(s) immediately`,
      );
    }

    if (framework.completionPercentage < 50) {
      recommendations.push(
        'Framework completion is below 50%. Prioritize control implementation.',
      );
    }

    if (framework.notImplementedControls > framework.totalControls * 0.3) {
      recommendations.push(
        'More than 30% of controls are not implemented. Create an implementation plan.',
      );
    }

    if (riskDistribution.high + riskDistribution.critical > 5) {
      recommendations.push(
        'Multiple high/critical risks detected. Consider risk treatment plans.',
      );
    }

    return recommendations;
  }

  // Bulk operations
  async bulkImportControls(
    frameworkId: string,
    controls: CreateFrameworkControlDto[],
  ): Promise<FrameworkControl[]> {
    await this.findOne(frameworkId); // Verify framework exists

    const controlsToSave = controls.map((dto) =>
      this.frameworkControlRepository.create({ ...dto, frameworkId }),
    );

    const saved = await this.frameworkControlRepository.save(controlsToSave);

    // Update framework progress
    await this.updateFrameworkProgress(frameworkId);

    return saved;
  }
}
