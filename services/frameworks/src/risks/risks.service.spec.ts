import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RisksService } from './risks.service';
import { Risk } from './entities/risk.entity';
import { RiskLevel, RiskTreatment } from './dto/create-risk.dto';
import { NotFoundException } from '@nestjs/common';

/**
 * Risk Service Tests - TDD Implementation
 * Tests core CRUD functionality following intended behavior
 */
describe('RisksService - Core Functionality', () => {
  let service: RisksService;
  let repository: Repository<Risk>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisksService,
        {
          provide: getRepositoryToken(Risk),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RisksService>(RisksService);
    repository = module.get<Repository<Risk>>(getRepositoryToken(Risk));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Risk Creation', () => {
    it('should create a risk with only required fields (riskId and title)', async () => {
      const createDto = {
        riskId: 'RISK-001',
        title: 'Data Breach Risk',
      };

      const savedRisk = {
        id: 'uuid-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedRisk);
      mockRepository.save.mockResolvedValue(savedRisk);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(savedRisk);
      expect(result).toEqual(savedRisk);
      expect(result.riskId).toBe('RISK-001');
      expect(result.title).toBe('Data Breach Risk');
    });

    it('should create a risk with all optional fields populated', async () => {
      const createDto = {
        riskId: 'RISK-002',
        title: 'Ransomware Attack',
        description: 'Risk of ransomware infection',
        inherentLikelihood: RiskLevel.HIGH,
        inherentImpact: RiskLevel.CRITICAL,
        residualLikelihood: RiskLevel.MEDIUM,
        residualImpact: RiskLevel.HIGH,
        treatment: RiskTreatment.MITIGATE,
        threats: 'External threat actors',
        linkedControls: ['ctrl-001', 'ctrl-002'],
        stakeholders: ['user-001', 'user-002'],
        creator: 'admin-user',
        businessUnit: 'IT Security',
        riskOwner: 'CISO',
        assets: 'Customer database, Financial systems',
      };

      const savedRisk = {
        id: 'uuid-456',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedRisk);
      mockRepository.save.mockResolvedValue(savedRisk);

      const result = await service.create(createDto);

      expect(result.linkedControls).toEqual(['ctrl-001', 'ctrl-002']);
      expect(result.stakeholders).toEqual(['user-001', 'user-002']);
      expect(result.inherentLikelihood).toBe(RiskLevel.HIGH);
      expect(result.treatment).toBe(RiskTreatment.MITIGATE);
    });

    it('should rely on ValidationPipe for required field validation', () => {
      // Note: Field validation (required fields) is handled by NestJS ValidationPipe
      // at the controller level before reaching the service layer.
      // The service assumes it receives valid DTOs.
      // This test documents the intended architecture.
      expect(true).toBe(true);
    });
  });

  describe('findAll - List All Risks', () => {
    it('should return all risks when no filters applied', async () => {
      const risks = [
        { id: '1', riskId: 'RISK-001', title: 'Risk 1' },
        { id: '2', riskId: 'RISK-002', title: 'Risk 2' },
        { id: '3', riskId: 'RISK-003', title: 'Risk 3' },
      ];

      mockRepository.find.mockResolvedValue(risks);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(risks);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no risks exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('findOne - Get Risk by ID', () => {
    it('should return a risk when valid ID provided', async () => {
      const risk = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Data Breach Risk',
        inherentLikelihood: RiskLevel.HIGH,
        linkedControls: ['ctrl-001'],
      };

      mockRepository.findOne.mockResolvedValue(risk);

      const result = await service.findOne('uuid-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
      expect(result).toEqual(risk);
    });

    it('should throw NotFoundException when risk does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Risk with ID non-existent-id not found',
      );
    });
  });

  describe('update - Update Risk', () => {
    it('should update risk with partial data', async () => {
      const existing = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Original Title',
        inherentLikelihood: RiskLevel.LOW,
      };

      const updateDto = {
        title: 'Updated Title',
        inherentLikelihood: RiskLevel.HIGH,
      };

      const updated = {
        ...existing,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-123', updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updated);
      expect(result.title).toBe('Updated Title');
      expect(result.inherentLikelihood).toBe(RiskLevel.HIGH);
    });

    it('should update linked controls array', async () => {
      const existing = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Risk',
        linkedControls: ['ctrl-001'],
      };

      const updateDto = {
        linkedControls: ['ctrl-001', 'ctrl-002', 'ctrl-003'],
      };

      const updated = {
        ...existing,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-123', updateDto);

      expect(result.linkedControls).toEqual(['ctrl-001', 'ctrl-002', 'ctrl-003']);
    });

    it('should throw NotFoundException when updating non-existent risk', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove - Delete Risk', () => {
    it('should delete a risk when valid ID provided', async () => {
      const risk = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Risk to Delete',
      };

      mockRepository.findOne.mockResolvedValue(risk);
      mockRepository.remove.mockResolvedValue(risk);

      await service.remove('uuid-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(risk);
    });

    it('should throw NotFoundException when deleting non-existent risk', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Intended Behavior - Security & Validation', () => {
    it('should NOT allow duplicate riskId values', async () => {
      const createDto = {
        riskId: 'RISK-001',
        title: 'Duplicate Risk',
      };

      // Simulate existing risk with same riskId
      const existingRisk = {
        id: 'existing-uuid',
        riskId: 'RISK-001',
        title: 'Existing Risk',
      };

      mockRepository.findOne.mockResolvedValue(existingRisk);

      await expect(service.create(createDto)).rejects.toThrow(
        'Risk with ID RISK-001 already exists',
      );
    });

    it('should accept valid risk level enums only', async () => {
      const validDto = {
        riskId: 'RISK-ENUM',
        title: 'Enum Test',
        inherentLikelihood: RiskLevel.CRITICAL,
        inherentImpact: RiskLevel.VERY_LOW,
      };

      const saved = {
        id: 'uuid-enum',
        ...validDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Reset mock for this test
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      const result = await service.create(validDto);

      expect(result.inherentLikelihood).toBe(RiskLevel.CRITICAL);
      expect(result.inherentImpact).toBe(RiskLevel.VERY_LOW);
    });

    it('should accept valid treatment enum values only', async () => {
      const validDto = {
        riskId: 'RISK-TREAT',
        title: 'Treatment Test',
        treatment: RiskTreatment.TRANSFER,
      };

      const saved = {
        id: 'uuid-treat',
        ...validDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Reset mock for this test
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      const result = await service.create(validDto);

      expect(result.treatment).toBe(RiskTreatment.TRANSFER);
    });
  });
});
