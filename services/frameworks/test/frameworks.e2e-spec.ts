import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FrameworksController } from '../src/frameworks/frameworks.controller';
import { FrameworksService } from '../src/frameworks/frameworks.service';
import { Framework, FrameworkStatus, FrameworkType } from '../src/frameworks/entities/framework.entity';
import { FrameworkControl, ControlImplementationStatus, ControlPriority } from '../src/frameworks/entities/framework-control.entity';
import { Control } from '../src/controls/entities/control.entity';
import { LoggingInterceptor, TransformInterceptor } from '../src/common/interceptors';

type QueryPredicate<T> = (item: T) => boolean;

class FrameworkQueryBuilder {
  private predicates: QueryPredicate<Framework>[] = [];
  private orderField: keyof Framework = 'name';
  private orderDir: 'ASC' | 'DESC' = 'ASC';
  private offset = 0;
  private limitValue = Infinity;

  constructor(private readonly data: Framework[]) {}

  andWhere(condition: string, params: Record<string, any>): this {
    if (condition.includes('ILIKE :search')) {
      const term = String(params.search || '').replace(/%/g, '').toLowerCase();
      this.predicates.push((f) =>
        [f.name, f.code, f.description].some((field) =>
          (field || '').toLowerCase().includes(term),
        ),
      );
    }

    if (condition.includes('framework.type = :type')) {
      this.predicates.push((f) => f.type === params.type);
    }

    if (condition.includes('framework.status = :status')) {
      this.predicates.push((f) => f.status === params.status);
    }

    if (condition.includes('framework.ownerId = :ownerId')) {
      this.predicates.push((f) => f.ownerId === params.ownerId);
    }

    if (condition.includes('framework.tags && :tags')) {
      const tags: string[] = params.tags || [];
      this.predicates.push((f) => Array.isArray(f.tags) && f.tags.some((tag) => tags.includes(tag)));
    }

    if (condition.includes('framework.industries && :industries')) {
      const industries: string[] = params.industries || [];
      this.predicates.push(
        (f) => Array.isArray(f.industries) && f.industries.some((ind) => industries.includes(ind)),
      );
    }

    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC'): this {
    this.orderField = field.replace('framework.', '') as keyof Framework;
    this.orderDir = direction;
    return this;
  }

  skip(offset: number): this {
    this.offset = offset;
    return this;
  }

  take(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  getManyAndCount(): [Framework[], number] {
    const filtered = this.data.filter((item) => this.predicates.every((p) => p(item)));
    const sorted = [...filtered].sort((a, b) => {
      const aVal = (a as any)[this.orderField];
      const bVal = (b as any)[this.orderField];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.orderDir === 'ASC' ? comparison : -comparison;
    });

    const sliced = sorted.slice(this.offset, this.offset + this.limitValue);
    return [sliced, filtered.length];
  }
}

class ControlQueryBuilder {
  private predicates: QueryPredicate<FrameworkControl>[] = [];
  private updateValues: Partial<FrameworkControl> | null = null;

  constructor(private readonly data: FrameworkControl[]) {}

  where(condition: string, params: Record<string, any>): this {
    this.applyCondition(condition, params);
    return this;
  }

  andWhere(condition: string, params: Record<string, any>): this {
    this.applyCondition(condition, params);
    return this;
  }

  update(): this {
    // No-op marker for update pipeline
    return this;
  }

  set(values: Partial<FrameworkControl>): this {
    this.updateValues = values;
    return this;
  }

  getMany(): FrameworkControl[] {
    return this.data.filter((item) => this.predicates.every((p) => p(item)));
  }

  async execute(): Promise<{ affected: number }> {
    if (!this.updateValues) return { affected: 0 };

    const targets = this.getMany();
    targets.forEach((control) => Object.assign(control, this.updateValues));
    return { affected: targets.length };
  }

  private applyCondition(condition: string, params: Record<string, any>) {
    if (condition.includes('id IN')) {
      const ids: string[] = params.controlIds || [];
      this.predicates.push((c) => ids.includes(c.id));
    }

    if (condition.includes('frameworkId = :frameworkId')) {
      const id = params.frameworkId;
      this.predicates.push((c) => c.frameworkId === id);
    }
  }
}

class InMemoryFrameworkRepository {
  private frameworks: Framework[] = [];

  create(data: Partial<Framework>): Framework {
    const now = new Date();
    return {
      id: data.id ?? randomUUID(),
      code: data.code ?? '',
      name: data.name ?? '',
      description: data.description ?? '',
      type: data.type ?? FrameworkType.COMPLIANCE,
      status: data.status ?? FrameworkStatus.DRAFT,
      version: data.version ?? '',
      publisher: data.publisher ?? '',
      effectiveDate: data.effectiveDate ?? new Date(0),
      expirationDate: data.expirationDate ?? new Date(0),
      certificationBody: data.certificationBody ?? '',
      industries: data.industries ?? [],
      regions: data.regions ?? [],
      scope: data.scope ?? '',
      objectives: data.objectives ?? '',
      ownerId: data.ownerId ?? '',
      tags: data.tags ?? [],
      customFields: data.customFields ?? {},
      totalControls: data.totalControls ?? 0,
      implementedControls: data.implementedControls ?? 0,
      partiallyImplementedControls: data.partiallyImplementedControls ?? 0,
      notImplementedControls: data.notImplementedControls ?? 0,
      completionPercentage: data.completionPercentage ?? 0,
      criticalRisks: data.criticalRisks ?? 0,
      highRisks: data.highRisks ?? 0,
      mediumRisks: data.mediumRisks ?? 0,
      lowRisks: data.lowRisks ?? 0,
      totalRiskScore: data.totalRiskScore ?? 0,
      lastAssessmentDate: data.lastAssessmentDate ?? new Date(0),
      nextAssessmentDate: data.nextAssessmentDate ?? new Date(0),
      metadata: data.metadata ?? {},
      frameworkControls: data.frameworkControls ?? [],
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };
  }

  async save(framework: Framework): Promise<Framework> {
    const idx = this.frameworks.findIndex((f) => f.id === framework.id);
    const record = { ...framework, updatedAt: new Date() };
    if (idx === -1) {
      this.frameworks.push(record);
    } else {
      this.frameworks[idx] = record;
    }
    return record;
  }

  async find(): Promise<Framework[]> {
    return [...this.frameworks];
  }

  async findOne(options: { where: Partial<Framework>; relations?: string[] }): Promise<Framework | null> {
    const target = this.frameworks.find(
      (f) => (options.where.id && f.id === options.where.id) || (options.where.code && f.code === options.where.code),
    );
    return target ? { ...target } : null;
  }

  async remove(framework: Framework): Promise<Framework> {
    this.frameworks = this.frameworks.filter((f) => f.id !== framework.id);
    return framework;
  }

  createQueryBuilder(): FrameworkQueryBuilder {
    return new FrameworkQueryBuilder(this.frameworks);
  }

  clear() {
    this.frameworks = [];
  }
}

class InMemoryFrameworkControlRepository {
  private controls: FrameworkControl[] = [];

  create(data: Partial<FrameworkControl>): FrameworkControl {
    const now = new Date();
    return {
      id: data.id ?? randomUUID(),
      frameworkId: data.frameworkId ?? null,
      framework: data.framework ?? null,
      controlCode: data.controlCode ?? '',
      externalControlId: data.externalControlId ?? '',
      requirementId: data.requirementId ?? '',
      title: data.title ?? '',
      description: data.description ?? '',
      rationale: data.rationale ?? '',
      guidance: data.guidance ?? '',
      implementationStatus: data.implementationStatus ?? ControlImplementationStatus.NOT_IMPLEMENTED,
      priority: data.priority ?? ControlPriority.MEDIUM,
      category: data.category ?? '',
      domain: data.domain ?? '',
      controlFamilies: data.controlFamilies ?? [],
      mappedControls: data.mappedControls ?? [],
      ownerId: data.ownerId ?? '',
      ownerEmail: data.ownerEmail ?? '',
      implementationDate: data.implementationDate ?? new Date(0),
      lastReviewDate: data.lastReviewDate ?? new Date(0),
      nextReviewDate: data.nextReviewDate ?? new Date(0),
      implementationNotes: data.implementationNotes ?? '',
      testingProcedure: data.testingProcedure ?? '',
      procedures: data.procedures ?? '',
      requiresEvidence: data.requiresEvidence ?? false,
      evidenceCount: data.evidenceCount ?? 0,
      evidenceIds: data.evidenceIds ?? [],
      linkedRiskId: data.linkedRiskId ?? '',
      riskLevel: data.riskLevel ?? '',
      customFields: (data as any).customFields ?? {},
      metadata: (data as any).metadata ?? {},
      tags: data.tags ?? [],
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };
  }

  async save(control: FrameworkControl | FrameworkControl[]): Promise<any> {
    const list = Array.isArray(control) ? control : [control];
    list.forEach((item) => {
      const idx = this.controls.findIndex((c) => c.id === item.id);
      const record = { ...item, updatedAt: new Date() };
      if (idx === -1) {
        this.controls.push(record);
      } else {
        this.controls[idx] = record;
      }
    });
    return control;
  }

  async find(options?: { where?: Partial<FrameworkControl>; order?: any }): Promise<FrameworkControl[]> {
    const where = options?.where || {};
    let result = this.controls.filter((c) => {
      return Object.entries(where).every(([key, value]) => (c as any)[key] === value);
    });

    if (options?.order?.requirementId) {
      result = [...result].sort((a, b) => a.requirementId.localeCompare(b.requirementId));
    }

    return result;
  }

  async findOne(options: { where: Partial<FrameworkControl> }): Promise<FrameworkControl | null> {
    const where = options.where;
    const match = this.controls.find((c) => Object.entries(where).every(([key, value]) => (c as any)[key] === value));
    return match ? { ...match } : null;
  }

  async remove(control: FrameworkControl): Promise<FrameworkControl> {
    this.controls = this.controls.filter((c) => c.id !== control.id);
    return control;
  }

  createQueryBuilder(): ControlQueryBuilder {
    return new ControlQueryBuilder(this.controls);
  }

  clear() {
    this.controls = [];
  }
}

class InMemoryControlRepository {
  private controls: Control[] = [];

  create(data: Partial<Control>): Control {
    return {
      id: data.id ?? randomUUID(),
      controlId: data.controlId ?? '',
      source: data.source ?? 'Custom',
      name: data.name ?? '',
      description: data.description ?? '',
      domain: data.domain ?? '',
      procedure: data.procedure ?? '',
      maturity: data.maturity ?? '',
      nist80053: data.nist80053 ?? '',
      nistCsf: data.nistCsf ?? '',
      iso27k: data.iso27k ?? '',
      pci4: data.pci4 ?? '',
      mitre: data.mitre ?? '',
      evidence: data.evidence ?? '',
      policy: data.policy ?? '',
    } as Control;
  }

  async save(control: Control): Promise<Control> {
    const idx = this.controls.findIndex((c) => c.id === control.id);
    if (idx === -1) {
      this.controls.push(control);
    } else {
      this.controls[idx] = control;
    }
    return control;
  }

  async find(options?: any): Promise<Control[]> {
    return [...this.controls];
  }

  async findOne(options: { where: Partial<Control> }): Promise<Control | null> {
    const control = this.controls.find((c) =>
      (options.where.id && c.id === options.where.id) ||
      (options.where.controlId && c.controlId === options.where.controlId)
    );
    return control ? { ...control } : null;
  }

  clear() {
    this.controls = [];
  }
}

describe('Frameworks API (e2e) - In-Memory', () => {
  let app: INestApplication;
  let frameworkRepo: InMemoryFrameworkRepository;
  let controlRepo: InMemoryFrameworkControlRepository;
  let masterControlRepo: InMemoryControlRepository;

  beforeAll(async () => {
    frameworkRepo = new InMemoryFrameworkRepository();
    controlRepo = new InMemoryFrameworkControlRepository();
    masterControlRepo = new InMemoryControlRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FrameworksController],
      providers: [
        FrameworksService,
        { provide: getRepositoryToken(Framework), useValue: frameworkRepo },
        { provide: getRepositoryToken(FrameworkControl), useValue: controlRepo },
        { provide: getRepositoryToken(Control), useValue: masterControlRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
    app.setGlobalPrefix('api/frameworks');
    await app.init();
  });

  beforeEach(() => {
    frameworkRepo.clear();
    controlRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Framework CRUD', () => {
    it('creates, reads, updates, and deletes a framework', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'SCF-2024',
          name: 'Secure Controls Framework',
          description: 'Security framework',
          type: FrameworkType.SECURITY,
        })
        .expect(201);

      const frameworkId = createRes.body.data.id;
      expect(createRes.body.data.status).toBe(FrameworkStatus.DRAFT);

      const listRes = await request(app.getHttpServer()).get('/api/frameworks').expect(200);
      expect(listRes.body.total).toBe(1);
      expect(listRes.body.data[0].code).toBe('SCF-2024');

      const getRes = await request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}`)
        .expect(200);
      expect(getRes.body.data.name).toBe('Secure Controls Framework');

      const updateRes = await request(app.getHttpServer())
        .put(`/api/frameworks/${frameworkId}`)
        .send({ name: 'Updated Framework' })
        .expect(200);
      expect(updateRes.body.data.name).toBe('Updated Framework');

      await request(app.getHttpServer()).delete(`/api/frameworks/${frameworkId}`).expect(204);

      await request(app.getHttpServer()).get(`/api/frameworks/${frameworkId}`).expect(404);
    });
  });

  describe('Framework controls', () => {
    it('returns controls for a framework with domain filtering', async () => {
      const framework = frameworkRepo.create({
        code: 'FW-1',
        name: 'Framework One',
        description: 'Test',
        type: FrameworkType.COMPLIANCE,
      });
      await frameworkRepo.save(framework);

      const c1 = controlRepo.create({
        frameworkId: framework.id,
        requirementId: 'REQ-1',
        title: 'Control 1',
        description: 'desc',
        domain: 'security',
      });
      const c2 = controlRepo.create({
        frameworkId: framework.id,
        requirementId: 'REQ-2',
        title: 'Control 2',
        description: 'desc',
        domain: 'privacy',
      });
      await controlRepo.save([c1, c2]);

      const all = await request(app.getHttpServer())
        .get(`/api/frameworks/${framework.id}/controls`)
        .expect(200);
      expect(all.body.data.length).toBe(2);

      const filtered = await request(app.getHttpServer())
        .get(`/api/frameworks/${framework.id}/controls?domain=security`)
        .expect(200);
      expect(filtered.body.data.length).toBe(1);
      expect(filtered.body.data[0].requirementId).toBe('REQ-1');
    });

    it('bulk adds and removes controls, updating framework links', async () => {
      const framework = await frameworkRepo.save(
        frameworkRepo.create({
          code: 'FW-2',
          name: 'Framework Two',
          description: 'Test',
          type: FrameworkType.SECURITY,
        }),
      );

      const c1 = await controlRepo.save(
        controlRepo.create({
          frameworkId: null,
          requirementId: 'REQ-10',
          title: 'Control 10',
          description: 'desc',
        }),
      );
      const c2 = await controlRepo.save(
        controlRepo.create({
          frameworkId: null,
          requirementId: 'REQ-11',
          title: 'Control 11',
          description: 'desc',
        }),
      );

      const addRes = await request(app.getHttpServer())
        .post(`/api/frameworks/${framework.id}/controls/add-bulk`)
        .send({ controlIds: [c1.id, c2.id] })
        .expect(201);
      expect(addRes.body.data.addedCount).toBe(2);

      const addedControls = await controlRepo.find({ where: { frameworkId: framework.id } });
      expect(addedControls.length).toBe(2);

      const removeRes = await request(app.getHttpServer())
        .post(`/api/frameworks/${framework.id}/controls/remove-bulk`)
        .send({ controlIds: [c1.id] })
        .expect(201);
      expect(removeRes.body.data.removedCount).toBe(1);

      const remaining = await controlRepo.find({ where: { frameworkId: framework.id } });
      expect(remaining.map((c) => c.id)).toEqual([c2.id]);
      const unlinked = await controlRepo.findOne({ where: { id: c1.id } });
      expect(unlinked?.frameworkId).toBeNull();
    });

    it('unlinks controls when deleting a framework', async () => {
      const framework = await frameworkRepo.save(
        frameworkRepo.create({
          code: 'FW-DEL',
          name: 'Framework Delete',
          description: 'Test',
          type: FrameworkType.SECURITY,
        }),
      );

      const ctrl = await controlRepo.save(
        controlRepo.create({
          frameworkId: framework.id,
          requirementId: 'REQ-X',
          title: 'Control X',
          description: 'desc',
        }),
      );

      await request(app.getHttpServer()).delete(`/api/frameworks/${framework.id}`).expect(204);

      const controlAfter = await controlRepo.findOne({ where: { id: (ctrl as FrameworkControl).id } });
      expect(controlAfter?.frameworkId).toBeNull();
    });
  });
});
