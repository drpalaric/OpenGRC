import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Control Entity
 * Master library of all security controls from various frameworks (SCF, CIS, NIST, custom, etc.)
 * This table is the source of truth for control definitions.
 * Implementation details are stored in framework_controls table.
 */
@Entity('controls')
export class Control {
  // UUID primary key
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Business identifier (e.g., AST-01, CIS-1.1) - editable and unique
  @Column({ type: 'text', unique: true })
  controlId: string;

  @Column({ type: 'text', default: 'SCF' })
  source: string; // SCF, CIS, NIST, Custom, etc.

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  domain: string;

  @Column({ type: 'text', nullable: true })
  procedure: string;

  @Column({ type: 'text', nullable: true })
  maturity: string;

  // Compliance mapping fields
  @Column({ type: 'text', nullable: true, name: 'nist80053' })
  nist80053: string;

  @Column({ type: 'text', nullable: true, name: 'nist_csf' })
  nistCsf: string;

  @Column({ type: 'text', nullable: true, name: 'iso27k' })
  iso27k: string;

  @Column({ type: 'text', nullable: true, name: 'pci4' })
  pci4: string;

  // MITRE ATT&CK mapping
  @Column({ type: 'text', nullable: true })
  mitre: string;

  @Column({ type: 'text', nullable: true })
  evidence: string;

  @Column({ type: 'text', nullable: true })
  policy: string;
}
