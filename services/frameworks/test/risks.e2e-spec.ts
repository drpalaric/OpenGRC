import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RisksController } from '../src/risks/risks.controller';
import { RisksService } from '../src/risks/risks.service';
import { Risk } from '../src/risks/entities/risk.entity';
import { RiskControl } from '../src/risks/entities/risk-control.entity';
import { LoggingInterceptor, TransformInterceptor } from '../src/common/interceptors';

type RepositoryArgs<T> = {
  riskControlRepo: InMemoryRiskControlRepository;
};

class InMemoryRiskRepository {
  private risks: Risk[] = [];

  constructor(private readonly args: RepositoryArgs<Risk>) {}

  create(data: Partial<Risk>): Risk {
    const now = new Date();
    return {
      ...(data as Risk),
      id: data.id ?? randomUUID(),
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };
  }

  async save(risk: Risk): Promise<Risk> {
    const existingIndex = this.risks.findIndex(r => r.id === risk.id);
    const now = new Date();
    const record = { ...risk, updatedAt: now };

    if (existingIndex === -1) {
      this.risks.push(record);
    } else {
      this.risks[existingIndex] = record;
    }

    return record;
  }

  async find(options?: { relations?: string[]; order?: Record<string, 'ASC' | 'DESC'> }): Promise<Risk[]> {
    const withRelations = this.risks.map(risk => this.attachRelations(risk, options?.relations));

    if (options?.order?.createdAt === 'DESC') {
      return [...withRelations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return withRelations;
  }

  async findOne(options: { where: Partial<Risk>; relations?: string[] }): Promise<Risk | null> {
    const { where, relations } = options;
    const match = this.risks.find(
      risk => (where.id && risk.id === where.id) || (where.riskId && risk.riskId === where.riskId),
    );

    if (!match) return null;
    return this.attachRelations(match, relations);
  }

  async remove(risk: Risk): Promise<Risk> {
    this.risks = this.risks.filter(r => r.id !== risk.id);
    await this.args.riskControlRepo.delete({ riskId: risk.id });
    return risk;
  }

  clear() {
    this.risks = [];
  }

  private attachRelations(risk: Risk, relations?: string[]): Risk {
    if (!relations?.includes('riskControls')) {
      return risk;
    }

    const riskControls = this.args.riskControlRepo.findByRiskId(risk.id);
    return { ...risk, riskControls };
  }
}

class InMemoryRiskControlRepository {
  private records: RiskControl[] = [];

  create(data: Partial<RiskControl>): RiskControl {
    return {
      ...(data as RiskControl),
      id: data.id ?? randomUUID(),
      createdAt: data.createdAt ?? new Date(),
      riskId: data.riskId!,
      controlId: data.controlId!,
    };
  }

  async save(entries: RiskControl[] | RiskControl): Promise<RiskControl[] | RiskControl> {
    const list = Array.isArray(entries) ? entries : [entries];
    list.forEach(entry => {
      const existingIndex = this.records.findIndex(rc => rc.id === entry.id);
      if (existingIndex === -1) {
        this.records.push(entry);
      } else {
        this.records[existingIndex] = entry;
      }
    });

    return entries;
  }

  async delete(criteria: { riskId: string }): Promise<{ affected: number }> {
    const before = this.records.length;
    this.records = this.records.filter(rc => rc.riskId !== criteria.riskId);
    return { affected: before - this.records.length };
  }

  clear() {
    this.records = [];
  }

  findByRiskId(riskId: string): RiskControl[] {
    return this.records.filter(rc => rc.riskId === riskId);
  }
}

describe('Risks API (e2e) - In-Memory', () => {
  let app: INestApplication;
  let riskRepo: InMemoryRiskRepository;
  let riskControlRepo: InMemoryRiskControlRepository;

  beforeAll(async () => {
    riskControlRepo = new InMemoryRiskControlRepository();
    riskRepo = new InMemoryRiskRepository({ riskControlRepo });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RisksController],
      providers: [
        RisksService,
        { provide: getRepositoryToken(Risk), useValue: riskRepo },
        { provide: getRepositoryToken(RiskControl), useValue: riskControlRepo },
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
    riskRepo.clear();
    riskControlRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/frameworks/risks', () => {
    it('creates a risk without linked controls', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-001',
          title: 'Data Breach Risk',
          description: 'Risk of unauthorized data access',
        })
        .expect(201);

      expect(res.body.data.riskId).toBe('RISK-001');
      expect(res.body.data.linkedControls).toEqual([]);
    });

    it('creates a risk with linked controls', async () => {
      const controlA = randomUUID();
      const controlB = randomUUID();

      const res = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-002',
          title: 'Unauthorized Access',
          description: 'Risk of unauthorized system access',
          linkedControls: [controlA, controlB],
        })
        .expect(201);

      expect(res.body.data.linkedControls).toEqual(
        expect.arrayContaining([controlA, controlB]),
      );
    });

    it('rejects duplicate riskId values', async () => {
      await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-DUP',
          title: 'First Risk',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-DUP',
          title: 'Duplicate Risk',
        })
        .expect(400);
    });
  });

  describe('GET /api/frameworks/risks', () => {
    it('returns all risks with linkedControls arrays', async () => {
      const controlId = randomUUID();

      await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-LIST-1',
          title: 'List Test Risk',
          linkedControls: [controlId],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-LIST-2',
          title: 'No Controls Risk',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/frameworks/risks')
        .expect(200);

      const risk1 = res.body.data.find((r: any) => r.riskId === 'RISK-LIST-1');
      const risk2 = res.body.data.find((r: any) => r.riskId === 'RISK-LIST-2');

      expect(risk1.linkedControls).toEqual([controlId]);
      expect(risk2.linkedControls).toEqual([]);
    });
  });

  describe('GET /api/frameworks/risks/:id', () => {
    it('returns a single risk with linkedControls', async () => {
      const controlIds = [randomUUID(), randomUUID()];

      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-GET-1',
          title: 'Get Test Risk',
          linkedControls: controlIds,
        })
        .expect(201);

      const riskUuid = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/frameworks/risks/${riskUuid}`)
        .expect(200);

      expect(res.body.data.id).toBe(riskUuid);
      expect(res.body.data.linkedControls).toEqual(expect.arrayContaining(controlIds));
    });

    it('returns 404 for non-existent risks', async () => {
      await request(app.getHttpServer())
        .get('/api/frameworks/risks/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PUT /api/frameworks/risks/:id', () => {
    it('replaces linked controls when provided', async () => {
      const initialControls = [randomUUID(), randomUUID()];
      const newControls = [randomUUID()];

      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-UPD-1',
          title: 'Update Test Risk',
          linkedControls: initialControls,
        })
        .expect(201);

      const riskUuid = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/frameworks/risks/${riskUuid}`)
        .send({ linkedControls: newControls })
        .expect(200);

      expect(res.body.data.linkedControls).toEqual(newControls);
    });

    it('preserves linked controls when not provided', async () => {
      const controlId = randomUUID();

      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-UPD-2',
          title: 'Original Title',
          linkedControls: [controlId],
        })
        .expect(201);

      const riskUuid = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/frameworks/risks/${riskUuid}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.linkedControls).toEqual([controlId]);
    });

    it('clears linked controls when an empty array is sent', async () => {
      const controlId = randomUUID();

      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-UPD-3',
          title: 'Clear Controls Risk',
          linkedControls: [controlId],
        })
        .expect(201);

      const riskUuid = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/frameworks/risks/${riskUuid}`)
        .send({ linkedControls: [] })
        .expect(200);

      expect(res.body.data.linkedControls).toEqual([]);
    });
  });

  describe('DELETE /api/frameworks/risks/:id', () => {
    it('deletes a risk and its junction entries', async () => {
      const controlId = randomUUID();

      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-DEL-1',
          title: 'Delete Me',
          linkedControls: [controlId],
        })
        .expect(201);

      const riskUuid = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/frameworks/risks/${riskUuid}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/frameworks/risks/${riskUuid}`)
        .expect(404);
    });
  });

  describe('Data Integrity', () => {
    it('generates UUIDs for new risks', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/frameworks/risks')
        .send({
          riskId: 'RISK-UUID',
          title: 'UUID Test',
        })
        .expect(201);

      const id = res.body.data.id as string;
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});
