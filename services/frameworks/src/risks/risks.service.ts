import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk } from './entities/risk.entity';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

/**
 * Service for managing organizational risks
 * Provides CRUD operations for risk management
 */
@Injectable()
export class RisksService {
  constructor(
    @InjectRepository(Risk)
    private riskRepository: Repository<Risk>,
  ) {}

  /**
   * Create a new risk
   * Required fields: riskId, title
   * Validates that riskId is unique
   */
  async create(createRiskDto: CreateRiskDto): Promise<Risk> {
    // Check for duplicate riskId
    const existing = await this.riskRepository.findOne({
      where: { riskId: createRiskDto.riskId },
    });

    if (existing) {
      throw new BadRequestException(
        `Risk with ID ${createRiskDto.riskId} already exists`,
      );
    }

    const risk = this.riskRepository.create(createRiskDto);
    return this.riskRepository.save(risk);
  }

  /**
   * Retrieve all risks
   * Returns all risks in the system
   */
  async findAll(): Promise<Risk[]> {
    return this.riskRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find a single risk by UUID
   * Throws NotFoundException if risk doesn't exist
   */
  async findOne(id: string): Promise<Risk> {
    const risk = await this.riskRepository.findOne({
      where: { id },
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    return risk;
  }

  /**
   * Update an existing risk
   * Throws NotFoundException if risk doesn't exist
   * Supports partial updates
   */
  async update(id: string, updateRiskDto: UpdateRiskDto): Promise<Risk> {
    const risk = await this.findOne(id);

    // Merge updates with existing risk
    Object.assign(risk, updateRiskDto);

    return this.riskRepository.save(risk);
  }

  /**
   * Delete a risk
   * Throws NotFoundException if risk doesn't exist
   * Performs hard delete (no soft delete)
   */
  async remove(id: string): Promise<void> {
    const risk = await this.findOne(id);
    await this.riskRepository.remove(risk);
  }
}
