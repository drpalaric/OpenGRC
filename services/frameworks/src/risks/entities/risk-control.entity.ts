import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Risk } from './risk.entity';
import { Control } from '../../controls/entities/control.entity';

/**
 * Junction table for many-to-many relationship between Risks and Controls
 *
 * This table represents the linkage between risks and the controls that mitigate them.
 * Using a junction table provides:
 * - Proper database normalization
 * - Efficient JOIN operations
 * - Referential integrity with foreign keys
 * - Ability to add metadata about the relationship
 */
@Entity('risk_controls')
export class RiskControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to Risk
   */
  @Column('uuid')
  riskId: string;

  /**
   * Foreign key to Control
   */
  @Column('uuid')
  controlId: string;

  /**
   * Relationship to Risk entity
   */
  @ManyToOne(() => Risk, risk => risk.riskControls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riskId' })
  risk: Risk;

  /**
   * Relationship to Control entity
   */
  @ManyToOne(() => Control, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controlId' })
  control: Control;

  /**
   * When this control was linked to the risk
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Optional: Who linked this control (for audit trail)
   * Can be populated later when user auth is implemented
   */
  @Column({ nullable: true })
  createdBy?: string;

  /**
   * Optional: Notes about why this control mitigates this risk
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
