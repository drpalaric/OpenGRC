import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { RiskControl } from './risk-control.entity';

/**
 * Risk entity for managing organizational risks
 * Tracks inherent and residual risk levels, treatments, and linked controls
 */
@Entity('risks')
export class Risk extends BaseEntity {
  /**
   * Custom risk identifier (required)
   * User-defined ID for risk tracking
   */
  @Column({ unique: true })
  riskId: string;

  /**
   * Risk title (required)
   */
  @Column()
  title: string;

  /**
   * Detailed risk description
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Inherent likelihood before controls
   * Values: very_low, low, medium, high, critical
   */
  @Column({ nullable: true })
  inherentLikelihood?: string;

  /**
   * Inherent impact before controls
   * Values: very_low, low, medium, high, critical
   */
  @Column({ nullable: true })
  inherentImpact?: string;

  /**
   * Residual likelihood after controls
   * Values: very_low, low, medium, high, critical
   */
  @Column({ nullable: true })
  residualLikelihood?: string;

  /**
   * Residual impact after controls
   * Values: very_low, low, medium, high, critical
   */
  @Column({ nullable: true })
  residualImpact?: string;

  /**
   * Overall risk level (calculated from likelihood × impact)
   * Will be calculated on backend later
   */
  @Column({ nullable: true })
  riskLevel?: string;

  /**
   * Risk treatment strategy
   * Values: Accept, Mitigate, Transfer, Avoid
   */
  @Column({ nullable: true })
  treatment?: string;

  /**
   * Identified threats for this risk
   */
  @Column({ type: 'text', nullable: true })
  threats?: string;

  /**
   * Controls linked to this risk (many-to-many via junction table)
   * This relationship provides proper normalization and allows metadata
   */
  @OneToMany(() => RiskControl, riskControl => riskControl.risk, {
    cascade: true,
    eager: false // Load on demand to avoid performance issues
  })
  riskControls: RiskControl[];

  /**
   * DEPRECATED: Old array-based storage (kept temporarily for migration)
   * Will be removed after data migration to junction table
   */
  @Column({ type: 'text', array: true, nullable: true })
  linkedControls?: string[];

  /**
   * Stakeholders with visibility into this risk
   * Will be user IDs in the future
   */
  @Column({ type: 'simple-array', nullable: true })
  stakeholders?: string[];

  /**
   * User who created this risk
   */
  @Column({ nullable: true })
  creator?: string;

  /**
   * Business unit owning this risk
   */
  @Column({ nullable: true })
  businessUnit?: string;

  /**
   * Risk owner responsible for management
   */
  @Column({ nullable: true })
  riskOwner?: string;

  /**
   * Assets affected by this risk
   */
  @Column({ type: 'text', nullable: true })
  assets?: string;
}
