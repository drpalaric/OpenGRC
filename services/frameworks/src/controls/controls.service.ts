import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Control } from './entities/control.entity';

/**
 * Service for managing controls from the master library
 * Provides read-only access to all controls (SCF, CIS, NIST, custom, etc.)
 */
@Injectable()
export class ControlsService {
  constructor(
    @InjectRepository(Control)
    private readonly controlsRepository: Repository<Control>,
  ) {}

  /**
   * Find all controls with optional filtering
   * @param filters Optional filters (domain, search, source)
   * @returns Array of controls
   */
  async findAll(filters?: { domain?: string; search?: string; source?: string }): Promise<Control[]> {
    const where: any = {};

    if (filters?.domain) {
      where.domain = filters.domain;
    }

    if (filters?.source) {
      where.source = filters.source;
    }

    return this.controlsRepository.find({
      where,
      order: { id: 'ASC' },
    });
  }

  /**
   * Find a single control by UUID
   * @param id Control UUID
   * @returns Single control
   * @throws NotFoundException if control not found
   */
  async findOne(id: string): Promise<Control> {
    const control = await this.controlsRepository.findOne({
      where: { id },
    });

    if (!control) {
      throw new NotFoundException(`Control with UUID ${id} not found`);
    }

    return control;
  }

  /**
   * Find a single control by control ID (business identifier)
   * @param controlId Control ID (e.g., 'AST-01')
   * @returns Single control
   * @throws NotFoundException if control not found
   */
  async findByControlId(controlId: string): Promise<Control> {
    const control = await this.controlsRepository.findOne({
      where: { controlId },
    });

    if (!control) {
      throw new NotFoundException(`Control with ID ${controlId} not found`);
    }

    return control;
  }

  /**
   * Search controls by name or description
   * @param query Search query string
   * @returns Array of matching controls
   */
  async search(query: string): Promise<Control[]> {
    return this.controlsRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
      order: { id: 'ASC' },
    });
  }

  /**
   * Update a control
   * @param id Control ID
   * @param updateData Partial control data to update
   * @returns Updated control
   * @throws NotFoundException if control not found
   */
  async update(id: string, updateData: Partial<Control>): Promise<Control> {
    const control = await this.findOne(id); // This will throw NotFoundException if not found

    // Merge update data with existing control
    Object.assign(control, updateData);

    return this.controlsRepository.save(control);
  }

  /**
   * Get total count of controls
   * @returns Total number of controls in the database
   */
  async count(): Promise<number> {
    return this.controlsRepository.count();
  }
}
