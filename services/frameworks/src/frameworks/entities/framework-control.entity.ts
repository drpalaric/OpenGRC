import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common';
import { Framework } from './framework.entity';

export enum ControlImplementationStatus {
  NOT_IMPLEMENTED = 'not_implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  IMPLEMENTED = 'implemented',
  NOT_APPLICABLE = 'not_applicable',
}

export enum ControlPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('framework_controls')
export class FrameworkControl extends BaseEntity {
  // Framework ID is optional - controls can exist independently or be associated with a framework
  @Column({ type: 'uuid', nullable: true })
  frameworkId?: string | null;

  @ManyToOne(() => Framework, { nullable: true })
  @JoinColumn({ name: 'frameworkId' })
  framework?: Framework | null;

  // Reference to control in controls service (by code or ID)
  @Column({ nullable: true })
  controlCode: string;

  @Column({ type: 'uuid', nullable: true })
  externalControlId: string;

  // Framework-specific control information
  @Column()
  requirementId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  rationale: string;

  @Column({ type: 'text', nullable: true })
  guidance: string;

  @Column({
    type: 'enum',
    enum: ControlImplementationStatus,
    default: ControlImplementationStatus.NOT_IMPLEMENTED,
  })
  implementationStatus: ControlImplementationStatus;

  @Column({
    type: 'enum',
    enum: ControlPriority,
    default: ControlPriority.MEDIUM,
  })
  priority: ControlPriority;

  @Column({ nullable: true })
  category: string;

  // Domain field - required for categorizing controls (e.g., 'security', 'privacy', 'compliance')
  @Column({ type: 'simple-array', nullable: true })
  domain: string;

  @Column({ type: 'simple-array', nullable: true })
  controlFamilies: string[];

  @Column({ type: 'simple-array', nullable: true })
  mappedControls: string[];

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @Column({ nullable: true })
  ownerEmail: string;

  @Column({ type: 'date', nullable: true })
  implementationDate: Date;

  @Column({ type: 'date', nullable: true })
  lastReviewDate: Date;

  @Column({ type: 'date', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'text', nullable: true })
  implementationNotes: string;

  @Column({ type: 'text', nullable: true })
  testingProcedure: string;

  @Column({ default: false })
  requiresEvidence: boolean;

  @Column({ type: 'int', default: 0 })
  evidenceCount: number;

  @Column({ type: 'simple-array', nullable: true })
  evidenceIds: string[];

  // Risk information
  @Column({ type: 'uuid', nullable: true })
  linkedRiskId: string;

  @Column({ nullable: true })
  riskLevel: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
