import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk } from './entities/risk.entity';
import { RiskControl } from './entities/risk-control.entity';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

/**
 * Service for managing organizational risks
 * Provides CRUD operations for risk management
 * Manages many-to-many relationships with controls via junction table
 */
@Injectable()
export class RisksService {
  constructor(
    @InjectRepository(Risk)
    private riskRepository: Repository<Risk>,
    @InjectRepository(RiskControl)
    private riskControlRepository: Repository<RiskControl>,
  ) {}

  /**
   * Create a new risk
   * Required fields: riskId, title
   * Validates that riskId is unique
   * Creates junction table entries for linkedControls
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

    // Extract linkedControls from DTO
    const { linkedControls, ...riskData } = createRiskDto;

    // Create the risk entity (without linkedControls array for now)
    const risk = this.riskRepository.create(riskData);
    const savedRisk = await this.riskRepository.save(risk);

    // Create junction table entries for each control
    if (linkedControls && linkedControls.length > 0) {
      const riskControlEntries = linkedControls.map(controlId =>
        this.riskControlRepository.create({
          riskId: savedRisk.id,
          controlId,
        }),
      );
      await this.riskControlRepository.save(riskControlEntries);
    }

    // Return risk with riskControls loaded
    return this.findOne(savedRisk.id);
  }

  /**
   * Retrieve all risks
   * Returns all risks in the system with linked controls
   */
  async findAll(): Promise<any[]> {
    const risks = await this.riskRepository.find({
      relations: ['riskControls'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Add linkedControls array for backward compatibility with frontend
    return risks.map(risk => this.formatRiskWithLinkedControls(risk));
  }

  /**
   * Find a single risk by UUID
   * Throws NotFoundException if risk doesn't exist
   */
  async findOne(id: string): Promise<any> {
    const risk = await this.riskRepository.findOne({
      where: { id },
      relations: ['riskControls'],
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    return this.formatRiskWithLinkedControls(risk);
  }

  /**
   * Format risk to include linkedControls array from junction table
   * Maintains backward compatibility with frontend expecting array of UUIDs
   */
  private formatRiskWithLinkedControls(risk: Risk): any {
    const linkedControls = risk.riskControls?.map(rc => rc.controlId) || [];
    return {
      ...risk,
      linkedControls,
    };
  }

  /**
   * Update an existing risk
   * Throws NotFoundException if risk doesn't exist
   * Supports partial updates
   * Handles linkedControls by updating junction table
   */
  async update(id: string, updateRiskDto: UpdateRiskDto): Promise<any> {
    const risk = await this.riskRepository.findOne({ where: { id } });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    // Extract linkedControls from update DTO
    const { linkedControls, ...riskData } = updateRiskDto;

    // Update risk properties
    Object.assign(risk, riskData);
    await this.riskRepository.save(risk);

    // Handle linkedControls if provided
    if (linkedControls !== undefined) {
      // Delete existing control links
      await this.riskControlRepository.delete({ riskId: id });

      // Create new control links
      if (linkedControls.length > 0) {
        const riskControlEntries = linkedControls.map(controlId =>
          this.riskControlRepository.create({
            riskId: id,
            controlId,
          }),
        );
        await this.riskControlRepository.save(riskControlEntries);
      }
    }

    // Return updated risk with linked controls
    return this.findOne(id);
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
