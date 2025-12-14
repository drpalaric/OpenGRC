import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FrameworksModule } from '../src/frameworks/frameworks.module';
import { Framework, FrameworkType } from '../src/frameworks/entities/framework.entity';
import { FrameworkControl } from '../src/frameworks/entities/framework-control.entity';
import { TransformInterceptor, LoggingInterceptor } from '../src/common/interceptors';

describe('Frameworks API (e2e) - Intended Functionality', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'grcadmin',
          password: process.env.DB_PASS || 'changeme',
          database: process.env.DB_NAME || 'grc_test',
          entities: [Framework, FrameworkControl],
          synchronize: true, // Auto-sync for tests
          dropSchema: true, // Clean slate for each test run
        }),
        FrameworksModule,
      ],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TransformInterceptor,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation as production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/frameworks');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/frameworks - Create Framework', () => {
    it('should create a framework with valid data', () => {
      return request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'SCF-2024',
          name: 'Secure Controls Framework',
          description: 'A comprehensive security framework',
          type: 'security',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.code).toBe('SCF-2024');
          expect(res.body.data.name).toBe('Secure Controls Framework');
          expect(res.body.data.status).toBe('draft');
        });
    });

    it('should reject framework without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          name: 'Incomplete Framework',
          // Missing: code, description, type
        })
        .expect(400);
    });

    it('should NOT require authentication', () => {
      // No Authorization header needed
      return request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'PUBLIC-001',
          name: 'Public Framework',
          description: 'Public access test',
          type: 'compliance',
        })
        .expect(201);
    });
  });

  describe('GET /api/frameworks - List Frameworks', () => {
    it('should return all frameworks', async () => {
      // Create test frameworks
      await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'TEST-001',
          name: 'Test Framework 1',
          description: 'Test',
          type: 'security',
        });

      await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'TEST-002',
          name: 'Test Framework 2',
          description: 'Test',
          type: 'compliance',
        });

      return request(app.getHttpServer())
        .get('/api/frameworks')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          expect(res.body.total).toBeGreaterThanOrEqual(2);
        });
    });

    it('should NOT filter by organizationId (single tenant)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/frameworks')
        .expect(200);

      // All frameworks should be returned, no tenant filtering
      expect(response.body.data).toBeInstanceOf(Array);

      // Data should NOT have organizationId field
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).not.toHaveProperty('organizationId');
      }
    });
  });

  describe('GET /api/frameworks/:id - Get Single Framework', () => {
    it('should return a framework by ID', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'GET-TEST',
          name: 'Get Test Framework',
          description: 'Test',
          type: 'security',
        });

      const id = createRes.body.data.id;

      return request(app.getHttpServer())
        .get(`/api/frameworks/${id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(id);
          expect(res.body.data.code).toBe('GET-TEST');
        });
    });

    it('should return 404 for non-existent framework', () => {
      return request(app.getHttpServer())
        .get('/api/frameworks/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PUT /api/frameworks/:id - Update Framework', () => {
    it('should update a framework', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'UPDATE-TEST',
          name: 'Original Name',
          description: 'Original description',
          type: 'security',
        });

      const id = createRes.body.data.id;

      return request(app.getHttpServer())
        .put(`/api/frameworks/${id}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('Updated Name');
          expect(res.body.data.description).toBe('Updated description');
        });
    });
  });

  describe('DELETE /api/frameworks/:id - Delete Framework', () => {
    it('should hard delete a framework (not soft delete)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'DELETE-TEST',
          name: 'Delete Test',
          description: 'Will be deleted',
          type: 'security',
        });

      const id = createRes.body.data.id;

      // Delete the framework
      await request(app.getHttpServer())
        .delete(`/api/frameworks/${id}`)
        .expect(204);

      // Should return 404 (not found), proving it's deleted
      await request(app.getHttpServer())
        .get(`/api/frameworks/${id}`)
        .expect(404);
    });

    it('should NOT have deletedAt field (no soft delete)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'SOFT-DELETE-CHECK',
          name: 'Soft Delete Check',
          description: 'Check no soft delete',
          type: 'security',
        });

      const framework = createRes.body.data;

      // Should NOT have deletedAt field
      expect(framework).not.toHaveProperty('deletedAt');
    });

    it('should unlink controls when deleting a framework (keep controls, remove association)', async () => {
      // Create a framework
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'UNLINK-TEST',
          name: 'Unlink Controls Test',
          description: 'Test unlinking controls on framework delete',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Create controls associated with the framework
      const ctrl1Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Control 1',
          description: 'Control that should be unlinked',
          domain: 'security',
        });
      const control1Id = ctrl1Res.body.data.id;

      const ctrl2Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-002',
          title: 'Control 2',
          description: 'Another control that should be unlinked',
          domain: 'compliance',
        });
      const control2Id = ctrl2Res.body.data.id;

      // Delete the framework
      await request(app.getHttpServer())
        .delete(`/api/frameworks/${frameworkId}`)
        .expect(204);

      // Verify framework is deleted
      await request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}`)
        .expect(404);

      // Verify controls still exist but are unlinked (frameworkId is null)
      const control1Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control1Id}`)
        .expect(200);
      expect(control1Check.body.data.id).toBe(control1Id);
      expect(control1Check.body.data.frameworkId).toBeNull();

      const control2Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control2Id}`)
        .expect(200);
      expect(control2Check.body.data.id).toBe(control2Id);
      expect(control2Check.body.data.frameworkId).toBeNull();
    });
  });

  describe('Controls API - Nested Resource', () => {
    it('should create a control for a framework', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'CTRL-TEST',
          name: 'Control Test Framework',
          description: 'For testing controls',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      return request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Access Control',
          description: 'Control user access',
          domain: 'security', // Required field
          category: 'Security',
          priority: 'high',
          implementationStatus: 'not_implemented',
          requiresEvidence: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.requirementId).toBe('REQ-001');
          expect(res.body.data.frameworkId).toBe(frameworkId);
        });
    });

    it('should list controls for a framework', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'LIST-CTRL',
          name: 'List Controls Test',
          description: 'Test',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      // Create controls
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Control 1',
          description: 'Test',
          domain: 'security', // Required field
          category: 'Security',
          priority: 'high',
          implementationStatus: 'not_implemented',
          requiresEvidence: false,
        });

      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-002',
          title: 'Control 2',
          description: 'Test',
          domain: 'compliance', // Required field
          category: 'Security',
          priority: 'medium',
          implementationStatus: 'not_implemented',
          requiresEvidence: false,
        });

      return request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(2);
        });
    });
  });

  describe('Behavior Validation - What Should NOT Happen', () => {
    it('should NOT accept extra unwhitelisted fields', () => {
      return request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'EXTRA-FIELDS',
          name: 'Extra Fields Test',
          description: 'Test',
          type: 'security',
          maliciousField: 'should be rejected',
          anotherField: 'also rejected',
        })
        .expect(400); // Should be rejected by validation
    });

    it('should NOT require authorization header', () => {
      // System has no auth, so Authorization header should be ignored
      return request(app.getHttpServer())
        .get('/api/frameworks')
        .set('Authorization', 'Bearer fake-token')
        .expect(200); // Should work regardless of auth header
    });

    it('should NOT have rate limiting (simple system)', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/frameworks')
      );

      const responses = await Promise.all(requests);

      // All should succeed (no rate limiting)
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('GET /api/frameworks/controls - List All Controls', () => {
    it('should return all controls, including those with and without framework association', async () => {
      // Create a framework to associate with one of the controls
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'GLOBAL-CTRL-TEST',
          name: 'Global Control Test Framework',
          description: 'For testing global control listing',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Create a control with a framework
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'G-REQ-001',
          title: 'Control With Framework',
          description: 'This control is linked to a framework.',
          domain: 'security',
          category: 'Security',
          priority: 'high',
          implementationStatus: 'not_implemented',
          requiresEvidence: true,
        });

      // Create a control without a framework
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: null,
          requirementId: 'G-REQ-002',
          title: 'Control Without Framework',
          description: 'This control is not linked to any framework.',
          domain: 'general',
          category: 'General',
          priority: 'low',
          implementationStatus: 'implemented',
          requiresEvidence: false,
        });

      // Get all controls
      return request(app.getHttpServer())
        .get('/api/frameworks/controls')
        .expect(200)
        .expect((res) => {
          // API returns array directly for this endpoint (not paginated)
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('Data Integrity', () => {
    it('should auto-generate UUIDs for IDs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'UUID-TEST',
          name: 'UUID Test',
          description: 'Test UUID generation',
          type: 'security',
        });

      const id = res.body.data.id;

      // Should be a valid UUID
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should auto-set timestamps on create', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'TIMESTAMP-TEST',
          name: 'Timestamp Test',
          description: 'Test timestamps',
          type: 'security',
        });

      const framework = res.body.data;

      expect(framework.createdAt).toBeDefined();
      expect(framework.updatedAt).toBeDefined();
      expect(new Date(framework.createdAt)).toBeInstanceOf(Date);
    });

    it('should update timestamps on update', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'UPDATE-TS',
          name: 'Update Timestamp',
          description: 'Test',
          type: 'security',
        });

      const id = createRes.body.data.id;
      const originalUpdatedAt = createRes.body.data.updatedAt;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateRes = await request(app.getHttpServer())
        .put(`/api/frameworks/${id}`)
        .send({ name: 'Updated' });

      expect(updateRes.body.data.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('Domain Field - Required and Filtering', () => {
    it('should allow creating control without domain field (domain is optional)', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'DOMAIN-OPT',
          name: 'Domain Optional Test',
          description: 'Test domain as optional',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      // Creating control without domain should succeed
      return request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Access Control',
          description: 'Control without domain',
          // domain is optional - should succeed
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.requirementId).toBe('REQ-001');
          expect(res.body.data.domain).toBeUndefined();
        });
    });

    it('should create a control with domain field', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'DOMAIN-TEST',
          name: 'Domain Test Framework',
          description: 'For testing domain field',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      return request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Security Control',
          description: 'A security control',
          domain: 'security', // Required domain field
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.domain).toBe('security');
          expect(res.body.data.requirementId).toBe('REQ-001');
        });
    });

    it('should filter controls by domain using query parameter', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'FILTER-DOMAIN',
          name: 'Filter Domain Test',
          description: 'Test domain filtering',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      // Create controls with different domains
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Security Control 1',
          description: 'Security control',
          domain: 'security',
        });

      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-002',
          title: 'Privacy Control',
          description: 'Privacy control',
          domain: 'privacy',
        });

      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-003',
          title: 'Security Control 2',
          description: 'Another security control',
          domain: 'security',
        });

      // Filter by domain=security
      return request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls?domain=security`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(2);
          // All returned controls should have domain='security'
          expect(res.body.data.every((c: any) => c.domain === 'security')).toBe(true);
        });
    });

    it('should return all controls when no domain filter is provided', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'NO-FILTER',
          name: 'No Filter Test',
          description: 'Test without domain filter',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      // Create controls with different domains
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Security Control',
          description: 'Security',
          domain: 'security',
        });

      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-002',
          title: 'Privacy Control',
          description: 'Privacy',
          domain: 'privacy',
        });

      // No domain filter - should return all controls
      return request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(2);
        });
    });

    it('should perform exact match filtering (not partial)', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'EXACT-MATCH',
          name: 'Exact Match Test',
          description: 'Test exact matching',
          type: 'security',
        });

      const frameworkId = fwRes.body.data.id;

      // Create control with domain 'security'
      await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Security Control',
          description: 'Security',
          domain: 'security',
        });

      // Filter by 'sec' should NOT match 'security' (exact match only)
      return request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls?domain=sec`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(0); // No partial matches
        });
    });
  });

  describe('POST /api/frameworks/:id/controls/add-bulk - Bulk Add Controls to Framework', () => {
    it('should add multiple existing controls to a framework (assign frameworkId)', async () => {
      // Create a framework
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'BULK-ADD',
          name: 'Bulk Add Test',
          description: 'Test bulk control addition',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Create controls without a framework (unlinked)
      const ctrl1Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: null,
          requirementId: 'REQ-001',
          title: 'Unlinked Control 1',
          description: 'Control to be added',
          domain: 'security',
        });
      const control1Id = ctrl1Res.body.data.id;

      const ctrl2Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: null,
          requirementId: 'REQ-002',
          title: 'Unlinked Control 2',
          description: 'Another control to be added',
          domain: 'compliance',
        });
      const control2Id = ctrl2Res.body.data.id;

      // Bulk add controls to framework
      await request(app.getHttpServer())
        .post(`/api/frameworks/${frameworkId}/controls/add-bulk`)
        .send({
          controlIds: [control1Id, control2Id],
        })
        .expect(200);

      // Verify controls are now assigned to the framework
      const control1Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control1Id}`)
        .expect(200);
      expect(control1Check.body.data.frameworkId).toBe(frameworkId);

      const control2Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control2Id}`)
        .expect(200);
      expect(control2Check.body.data.frameworkId).toBe(frameworkId);

      // Verify framework has 2 controls
      const frameworkControls = await request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls`)
        .expect(200);
      expect(frameworkControls.body.data.length).toBe(2);
    });

    it('should reassign controls from one framework to another', async () => {
      // Create two frameworks
      const fw1Res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'FW1-REASSIGN',
          name: 'Framework 1',
          description: 'Original framework',
          type: 'security',
        });
      const framework1Id = fw1Res.body.data.id;

      const fw2Res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'FW2-REASSIGN',
          name: 'Framework 2',
          description: 'Target framework',
          type: 'compliance',
        });
      const framework2Id = fw2Res.body.data.id;

      // Create controls in framework 1
      const ctrl1Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: framework1Id,
          requirementId: 'REQ-001',
          title: 'Control in FW1',
          description: 'Will be moved to FW2',
          domain: 'security',
        });
      const control1Id = ctrl1Res.body.data.id;

      // Reassign control from framework1 to framework2
      await request(app.getHttpServer())
        .post(`/api/frameworks/${framework2Id}/controls/add-bulk`)
        .send({
          controlIds: [control1Id],
        })
        .expect(200);

      // Verify control is now in framework2
      const controlCheck = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control1Id}`)
        .expect(200);
      expect(controlCheck.body.data.frameworkId).toBe(framework2Id);

      // Verify framework1 has 0 controls
      const fw1Controls = await request(app.getHttpServer())
        .get(`/api/frameworks/${framework1Id}/controls`)
        .expect(200);
      expect(fw1Controls.body.data.length).toBe(0);

      // Verify framework2 has 1 control
      const fw2Controls = await request(app.getHttpServer())
        .get(`/api/frameworks/${framework2Id}/controls`)
        .expect(200);
      expect(fw2Controls.body.data.length).toBe(1);
    });

    it('should return 404 when trying to add controls to non-existent framework', async () => {
      return request(app.getHttpServer())
        .post('/api/frameworks/00000000-0000-0000-0000-000000000000/controls/add-bulk')
        .send({
          controlIds: ['00000000-0000-0000-0000-000000000001'],
        })
        .expect(404);
    });

    it('should handle empty controlIds array gracefully', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'EMPTY-ADD',
          name: 'Empty Add Test',
          description: 'Test empty array',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Send empty array
      return request(app.getHttpServer())
        .post(`/api/frameworks/${frameworkId}/controls/add-bulk`)
        .send({
          controlIds: [],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.addedCount).toBe(0);
        });
    });

    it('should update framework progress after adding controls', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'PROGRESS-ADD',
          name: 'Progress Test',
          description: 'Test progress update',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Create an implemented control
      const ctrlRes = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: null,
          requirementId: 'REQ-001',
          title: 'Implemented Control',
          description: 'This control is implemented',
          domain: 'security',
          implementationStatus: 'implemented',
        });
      const controlId = ctrlRes.body.data.id;

      // Add control to framework
      await request(app.getHttpServer())
        .post(`/api/frameworks/${frameworkId}/controls/add-bulk`)
        .send({
          controlIds: [controlId],
        })
        .expect(200);

      // Check framework progress
      const frameworkCheck = await request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}`)
        .expect(200);

      expect(frameworkCheck.body.data.totalControls).toBe(1);
      expect(frameworkCheck.body.data.implementedControls).toBe(1);
      expect(frameworkCheck.body.data.completionPercentage).toBe(100);
    });
  });

  describe('POST /api/frameworks/:id/controls/remove-bulk - Bulk Remove Controls from Framework', () => {
    it('should remove multiple controls from a framework (unlink, not delete)', async () => {
      // Create a framework
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'BULK-REMOVE',
          name: 'Bulk Remove Test',
          description: 'Test bulk control removal',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Create multiple controls
      const ctrl1Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-001',
          title: 'Control 1',
          description: 'Control to be removed',
          domain: 'security',
        });
      const control1Id = ctrl1Res.body.data.id;

      const ctrl2Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-002',
          title: 'Control 2',
          description: 'Control to be removed',
          domain: 'compliance',
        });
      const control2Id = ctrl2Res.body.data.id;

      const ctrl3Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId,
          requirementId: 'REQ-003',
          title: 'Control 3',
          description: 'Control to stay',
          domain: 'privacy',
        });
      const control3Id = ctrl3Res.body.data.id;

      // Bulk remove controls 1 and 2
      await request(app.getHttpServer())
        .post(`/api/frameworks/${frameworkId}/controls/remove-bulk`)
        .send({
          controlIds: [control1Id, control2Id],
        })
        .expect(200);

      // Verify controls 1 and 2 are unlinked (frameworkId is null)
      const control1Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control1Id}`)
        .expect(200);
      expect(control1Check.body.data.frameworkId).toBeNull();

      const control2Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control2Id}`)
        .expect(200);
      expect(control2Check.body.data.frameworkId).toBeNull();

      // Verify control 3 is still linked
      const control3Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control3Id}`)
        .expect(200);
      expect(control3Check.body.data.frameworkId).toBe(frameworkId);

      // Verify framework only has 1 control remaining
      const frameworkControls = await request(app.getHttpServer())
        .get(`/api/frameworks/${frameworkId}/controls`)
        .expect(200);
      expect(frameworkControls.body.data.length).toBe(1);
      expect(frameworkControls.body.data[0].id).toBe(control3Id);
    });

    it('should return 404 when trying to remove controls from non-existent framework', async () => {
      return request(app.getHttpServer())
        .post('/api/frameworks/00000000-0000-0000-0000-000000000000/controls/remove-bulk')
        .send({
          controlIds: ['00000000-0000-0000-0000-000000000001'],
        })
        .expect(404);
    });

    it('should handle empty controlIds array gracefully', async () => {
      const fwRes = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'EMPTY-BULK',
          name: 'Empty Bulk Test',
          description: 'Test empty array',
          type: 'security',
        });
      const frameworkId = fwRes.body.data.id;

      // Send empty array
      return request(app.getHttpServer())
        .post(`/api/frameworks/${frameworkId}/controls/remove-bulk`)
        .send({
          controlIds: [],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.removedCount).toBe(0);
        });
    });

    it('should only remove controls that belong to the specified framework', async () => {
      // Create two frameworks
      const fw1Res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'FW1-BULK',
          name: 'Framework 1',
          description: 'First framework',
          type: 'security',
        });
      const framework1Id = fw1Res.body.data.id;

      const fw2Res = await request(app.getHttpServer())
        .post('/api/frameworks')
        .send({
          code: 'FW2-BULK',
          name: 'Framework 2',
          description: 'Second framework',
          type: 'compliance',
        });
      const framework2Id = fw2Res.body.data.id;

      // Create controls for framework 1
      const ctrl1Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: framework1Id,
          requirementId: 'REQ-001',
          title: 'FW1 Control',
          description: 'Control for framework 1',
          domain: 'security',
        });
      const control1Id = ctrl1Res.body.data.id;

      // Create control for framework 2
      const ctrl2Res = await request(app.getHttpServer())
        .post('/api/frameworks/controls')
        .send({
          frameworkId: framework2Id,
          requirementId: 'REQ-002',
          title: 'FW2 Control',
          description: 'Control for framework 2',
          domain: 'compliance',
        });
      const control2Id = ctrl2Res.body.data.id;

      // Try to remove both controls from framework 1 (only control1 should be removed)
      await request(app.getHttpServer())
        .post(`/api/frameworks/${framework1Id}/controls/remove-bulk`)
        .send({
          controlIds: [control1Id, control2Id],
        })
        .expect(200);

      // Verify control1 is unlinked
      const control1Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control1Id}`)
        .expect(200);
      expect(control1Check.body.data.frameworkId).toBeNull();

      // Verify control2 is still linked to framework 2
      const control2Check = await request(app.getHttpServer())
        .get(`/api/frameworks/controls/${control2Id}`)
        .expect(200);
      expect(control2Check.body.data.frameworkId).toBe(framework2Id);
    });
  });
});
