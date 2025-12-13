import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common';
import { FrameworkControl } from './framework-control.entity';

export enum FrameworkType {
  SECURITY = 'security',
  PRIVACY = 'privacy',
  COMPLIANCE = 'compliance',
  RISK = 'risk',
  CUSTOM = 'custom',
}

export enum FrameworkStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('frameworks')
export class Framework extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: FrameworkType,
    default: FrameworkType.COMPLIANCE,
  })
  type: FrameworkType;

  @Column({
    type: 'enum',
    enum: FrameworkStatus,
    default: FrameworkStatus.DRAFT,
  })
  status: FrameworkStatus;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  publisher: string;

  @Column({ type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  certificationBody: string;

  @Column({ type: 'simple-array', nullable: true })
  industries: string[];

  @Column({ type: 'simple-array', nullable: true })
  regions: string[];

  @Column({ type: 'text', nullable: true })
  scope: string;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  // Progress tracking
  @Column({ type: 'int', default: 0 })
  totalControls: number;

  @Column({ type: 'int', default: 0 })
  implementedControls: number;

  @Column({ type: 'int', default: 0 })
  partiallyImplementedControls: number;

  @Column({ type: 'int', default: 0 })
  notImplementedControls: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  // Risk reporting fields
  @Column({ type: 'int', default: 0 })
  criticalRisks: number;

  @Column({ type: 'int', default: 0 })
  highRisks: number;

  @Column({ type: 'int', default: 0 })
  mediumRisks: number;

  @Column({ type: 'int', default: 0 })
  lowRisks: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalRiskScore: number;

  @Column({ type: 'date', nullable: true })
  lastAssessmentDate: Date;

  @Column({ type: 'date', nullable: true })
  nextAssessmentDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => FrameworkControl, (fc) => fc.framework, { cascade: true })
  frameworkControls: FrameworkControl[];
}
