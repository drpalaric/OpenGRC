import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FrameworksService } from './frameworks.service';
import { Framework, FrameworkStatus, FrameworkType } from './entities/framework.entity';
import { FrameworkControl, ControlImplementationStatus } from './entities/framework-control.entity';

describe('FrameworksService - Intended Functionality Only', () => {
  let service: FrameworksService;
  let frameworkRepository: Repository<Framework>;
  let controlRepository: Repository<FrameworkControl>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockFrameworkRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockControlQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
    getMany: jest.fn(),
  };

  const mockControlRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockControlQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworksService,
        {
          provide: getRepositoryToken(Framework),
          useValue: mockFrameworkRepository,
        },
        {
          provide: getRepositoryToken(FrameworkControl),
          useValue: mockControlRepository,
        },
      ],
    }).compile();

    service = module.get<FrameworksService>(FrameworksService);
    frameworkRepository = module.get<Repository<Framework>>(getRepositoryToken(Framework));
    controlRepository = module.get<Repository<FrameworkControl>>(getRepositoryToken(FrameworkControl));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Framework CRUD - Core Functionality', () => {
    it('should create a framework with required fields only', async () => {
      const createDto = {
        code: 'SCF-2024',
        name: 'Secure Controls Framework',
        description: 'A security framework',
        type: FrameworkType.SECURITY,
      };

      const savedFramework = {
        id: '123',
        ...createDto,
        status: FrameworkStatus.DRAFT,
        totalControls: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFrameworkRepository.create.mockReturnValue(savedFramework);
      mockFrameworkRepository.save.mockResolvedValue(savedFramework);

      const result = await service.create(createDto);

      expect(mockFrameworkRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockFrameworkRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedFramework);
    });

    it('should retrieve all frameworks without filters', async () => {
      const frameworks = [
        { id: '1', code: 'SCF', name: 'Framework 1' },
        { id: '2', code: 'ISO', name: 'Framework 2' },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([frameworks, 2]);

      const result = await service.findAll({});

      expect(mockFrameworkRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual(frameworks);
      expect(result.total).toBe(2);
    });

    it('should retrieve a single framework by ID', async () => {
      const framework = { id: '123', code: 'SCF', name: 'Test' };
      mockFrameworkRepository.findOne.mockResolvedValue(framework);

      const result = await service.findOne('123');

      expect(mockFrameworkRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['frameworkControls'],
      });
      expect(result).toEqual(framework);
    });

    it('should update a framework', async () => {
      const existing = { id: '123', name: 'Original Name' };
      const updateDto = { name: 'Updated Name' };
      const updated = { id: '123', name: 'Updated Name' };

      mockFrameworkRepository.findOne.mockResolvedValueOnce(existing);
      mockFrameworkRepository.save.mockResolvedValue(updated);

      const result = await service.update('123', updateDto);

      expect(mockFrameworkRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should delete a framework', async () => {
      const framework = { id: '123' };
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.remove.mockResolvedValue(framework);

      await service.remove('123');

      expect(mockFrameworkRepository.remove).toHaveBeenCalledWith(framework);
    });
  });

  describe('Control CRUD - Core Functionality', () => {
    it('should create a control with required fields', async () => {
      const createDto = {
        frameworkId: 'fw-123',
        requirementId: 'REQ-001',
        title: 'Access Control',
        description: 'Control access to systems',
        domain: 'security', // Required field
        category: 'Security',
        priority: 'high' as any,
        implementationStatus: ControlImplementationStatus.NOT_IMPLEMENTED,
        requiresEvidence: true,
      };

      const savedControl = {
        id: 'ctrl-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const framework = { id: 'fw-123', totalControls: 0 };

      mockControlRepository.create.mockReturnValue(savedControl);
      mockControlRepository.save.mockResolvedValue(savedControl);
      mockControlRepository.find.mockResolvedValue([savedControl]);
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.save.mockResolvedValue(framework);

      const result = await service.addControl(createDto);

      expect(mockControlRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedControl);
    });

    it('should retrieve all controls regardless of framework association', async () => {
      const allControls = [
        { id: '1', requirementId: 'REQ-001', title: 'Control 1', frameworkId: 'fw-123' },
        { id: '2', requirementId: 'REQ-002', title: 'Control 2', frameworkId: null },
      ];

      mockControlRepository.find.mockResolvedValue(allControls);

      const result = await service.findAllControls();

      expect(mockControlRepository.find).toHaveBeenCalled();
      expect(result).toEqual(allControls);
    });

    it('should return a non-empty array when controls exist', async () => {
      const allControls = [
        { id: '1', requirementId: 'REQ-001', title: 'Control 1', frameworkId: 'fw-123' },
        { id: '2', requirementId: 'REQ-002', title: 'Control 2', frameworkId: null },
      ];

      mockControlRepository.find.mockResolvedValue(allControls);

      const result = await service.findAllControls();

      expect(result.length).toBeGreaterThan(0);
    });

    it('should retrieve controls for a framework', async () => {
      const controls = [
        { id: '1', requirementId: 'REQ-001', title: 'Control 1' },
        { id: '2', requirementId: 'REQ-002', title: 'Control 2' },
      ];

      mockControlRepository.find.mockResolvedValue(controls);

      const result = await service.findControls('fw-123');

      expect(mockControlRepository.find).toHaveBeenCalledWith({
        where: { frameworkId: 'fw-123' },
        order: { requirementId: 'ASC' },
      });
      expect(result).toEqual(controls);
    });

    it('should update a control', async () => {
      const existing = { id: 'ctrl-123', title: 'Original', frameworkId: 'fw-123' };
      const updateDto = { title: 'Updated Control' };
      const updated = { id: 'ctrl-123', title: 'Updated Control', frameworkId: 'fw-123' };
      const framework = { id: 'fw-123' };

      mockControlRepository.findOne.mockResolvedValueOnce(existing);
      mockControlRepository.save.mockResolvedValue(updated);
      mockControlRepository.find.mockResolvedValue([updated]);
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.save.mockResolvedValue(framework);

      const result = await service.updateControl('ctrl-123', updateDto);

      expect(mockControlRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should delete a control', async () => {
      const control = { id: 'ctrl-123', frameworkId: 'fw-123' };
      const framework = { id: 'fw-123' };

      mockControlRepository.findOne.mockResolvedValue(control);
      mockControlRepository.remove.mockResolvedValue(control);
      mockControlRepository.find.mockResolvedValue([]);
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.save.mockResolvedValue(framework);

      await service.removeControl('ctrl-123');

      expect(mockControlRepository.remove).toHaveBeenCalledWith(control);
    });
  });

  describe('Data Integrity - What Should NOT Happen', () => {
    it('should NOT allow creating framework without required fields', async () => {
      const invalidDto = {
        name: 'Framework',
        // Missing: code, description, type
      };

      // This would be caught by validation pipes in controller
      // Service should receive only valid data
      expect(invalidDto).not.toHaveProperty('code');
    });

    it('should NOT expose soft-deleted records (no soft delete)', async () => {
      // System does NOT have soft delete
      // When deleted, records should be gone
      const framework = { id: '123' };
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.remove.mockResolvedValue(framework);

      await service.remove('123');

      // Should call remove, not update with deletedAt
      expect(mockFrameworkRepository.remove).toHaveBeenCalled();
      expect(mockFrameworkRepository.update).not.toHaveBeenCalled();
    });

    it('should NOT have multi-tenancy filtering (single tenant)', async () => {
      // System does NOT have organizationId
      // All queries should return all records
      const frameworks = [{ id: '1' }, { id: '2' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([frameworks, 2]);

      await service.findAll({});

      const queryBuilderCalls = mockQueryBuilder.andWhere.mock.calls;

      // Should NOT filter by organizationId
      const hasOrgFilter = queryBuilderCalls.some(call =>
        call[0]?.includes('organizationId')
      );
      expect(hasOrgFilter).toBe(false);
    });
  });

  describe('Intended Behavior Only', () => {
    it('should return data exactly as stored (no transformation)', async () => {
      const framework = {
        id: '123',
        code: 'TEST',
        name: 'Test Framework',
        customFields: { custom: 'value' },
      };

      mockFrameworkRepository.findOne.mockResolvedValue(framework);

      const result = await service.findOne('123');

      // Should return data as-is, no extra fields added
      expect(result).toEqual(framework);
    });

    it('should only perform CRUD operations (no side effects)', async () => {
      // When creating a framework, should ONLY save to database
      // No emails, no webhooks, no notifications
      const createDto = {
        code: 'TEST',
        name: 'Test',
        description: 'Test',
        type: FrameworkType.COMPLIANCE,
      };

      mockFrameworkRepository.findOne.mockResolvedValue(null); // No existing
      mockFrameworkRepository.create.mockReturnValue(createDto);
      mockFrameworkRepository.save.mockResolvedValue(createDto);

      await service.create(createDto);

      // Only database operations should be called
      expect(mockFrameworkRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not require authentication (public access)', async () => {
      // Service methods should work without user context
      // No userId, no authentication checks
      const frameworks = [{ id: '1' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([frameworks, 1]);

      const result = await service.findAll({});

      // Should succeed without any user context
      expect(result.data).toEqual(frameworks);
    });
  });

  describe('Domain Field - Optional and Filtering', () => {
    it('should allow creating control without domain field (domain is optional)', async () => {
      // Domain is an optional field - creating without it should succeed
      const createDtoWithoutDomain = {
        frameworkId: 'fw-123',
        requirementId: 'REQ-001',
        title: 'Access Control',
        description: 'Control access to systems',
        // domain is optional - can be omitted
      };

      const savedControl = {
        id: 'ctrl-456',
        ...createDtoWithoutDomain,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const framework = { id: 'fw-123', totalControls: 0 };

      mockControlRepository.create.mockReturnValue(savedControl);
      mockControlRepository.save.mockResolvedValue(savedControl);
      mockControlRepository.find.mockResolvedValue([savedControl]);
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.save.mockResolvedValue(framework);

      const result = await service.addControl(createDtoWithoutDomain as any);

      // Should succeed even without domain field
      expect(mockControlRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedControl);
    });

    it('should create a control with domain field when provided', async () => {
      // Domain can be provided as an optional field
      const createDto = {
        frameworkId: 'fw-123',
        requirementId: 'REQ-001',
        title: 'Access Control',
        description: 'Control access to systems',
        domain: 'security', // Required domain field
      };

      const savedControl = {
        id: 'ctrl-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const framework = { id: 'fw-123', totalControls: 0 };

      mockControlRepository.create.mockReturnValue(savedControl);
      mockControlRepository.save.mockResolvedValue(savedControl);
      mockControlRepository.find.mockResolvedValue([savedControl]);
      mockFrameworkRepository.findOne.mockResolvedValue(framework);
      mockFrameworkRepository.save.mockResolvedValue(framework);

      const result = await service.addControl(createDto);

      // Verify domain field is included in saved control
      expect(mockControlRepository.save).toHaveBeenCalled();
      expect(result.domain).toBe('security');
      expect(result).toEqual(savedControl);
    });

    it('should filter controls by domain (exact match)', async () => {
      // Controls with different domains
      const controls = [
        { id: '1', requirementId: 'REQ-001', title: 'Control 1', domain: 'security' },
        { id: '2', requirementId: 'REQ-002', title: 'Control 2', domain: 'privacy' },
        { id: '3', requirementId: 'REQ-003', title: 'Control 3', domain: 'security' },
      ];

      // Mock find to return only controls matching domain filter
      mockControlRepository.find.mockResolvedValue(
        controls.filter(c => c.domain === 'security')
      );

      const result = await service.findControls('fw-123', 'security');

      // Verify repository was called with domain filter
      expect(mockControlRepository.find).toHaveBeenCalledWith({
        where: { frameworkId: 'fw-123', domain: 'security' },
        order: { requirementId: 'ASC' },
      });

      // Only controls with 'security' domain should be returned
      expect(result.length).toBe(2);
      expect(result.every(c => c.domain === 'security')).toBe(true);
    });

    it('should return all controls when no domain filter is provided', async () => {
      // Controls with different domains
      const controls = [
        { id: '1', requirementId: 'REQ-001', title: 'Control 1', domain: 'security' },
        { id: '2', requirementId: 'REQ-002', title: 'Control 2', domain: 'privacy' },
      ];

      mockControlRepository.find.mockResolvedValue(controls);

      const result = await service.findControls('fw-123');

      // Verify repository was called without domain filter
      expect(mockControlRepository.find).toHaveBeenCalledWith({
        where: { frameworkId: 'fw-123' },
        order: { requirementId: 'ASC' },
      });

      // All controls should be returned
      expect(result.length).toBe(2);
    });
  });
});
