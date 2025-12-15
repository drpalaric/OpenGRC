import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RisksService } from './risks.service';
import { Risk } from './entities/risk.entity';
import { RiskControl } from './entities/risk-control.entity';
import { RiskLevel, RiskTreatment } from './dto/create-risk.dto';
import { NotFoundException } from '@nestjs/common';

/**
 * Risk Service Tests - TDD Implementation
 * Tests core CRUD functionality following intended behavior
 * Updated to test junction table implementation for linkedControls
 */
describe('RisksService - Core Functionality', () => {
  let service: RisksService;
  let riskRepository: Repository<Risk>;
  let riskControlRepository: Repository<RiskControl>;

  const mockRiskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockRiskControlRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisksService,
        {
          provide: getRepositoryToken(Risk),
          useValue: mockRiskRepository,
        },
        {
          provide: getRepositoryToken(RiskControl),
          useValue: mockRiskControlRepository,
        },
      ],
    }).compile();

    service = module.get<RisksService>(RisksService);
    riskRepository = module.get<Repository<Risk>>(getRepositoryToken(Risk));
    riskControlRepository = module.get<Repository<RiskControl>>(getRepositoryToken(RiskControl));
  });

  afterEach(() => {
    jest.resetAllMocks();
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

      const riskWithRelations = {
        ...savedRisk,
        riskControls: [],
        linkedControls: [],
      };

      // Mock duplicate check
      mockRiskRepository.findOne.mockResolvedValueOnce(null);
      // Mock risk creation
      mockRiskRepository.create.mockReturnValue(savedRisk);
      mockRiskRepository.save.mockResolvedValue(savedRisk);
      // Mock findOne call at the end
      mockRiskRepository.findOne.mockResolvedValueOnce(riskWithRelations);

      const result = await service.create(createDto);

      expect(mockRiskRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRiskRepository.save).toHaveBeenCalledWith(savedRisk);
      expect(result.riskId).toBe('RISK-001');
      expect(result.title).toBe('Data Breach Risk');
      expect(result.linkedControls).toEqual([]);
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
        linkedControls: ['ctrl-uuid-001', 'ctrl-uuid-002'],
        stakeholders: ['user-001', 'user-002'],
        creator: 'admin-user',
        businessUnit: 'IT Security',
        riskOwner: 'CISO',
        assets: 'Customer database, Financial systems',
      };

      const { linkedControls, ...riskData } = createDto;

      const savedRisk = {
        id: 'uuid-456',
        ...riskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const junctionEntries = [
        { id: 'junction-1', riskId: 'uuid-456', controlId: 'ctrl-uuid-001', createdAt: new Date() },
        { id: 'junction-2', riskId: 'uuid-456', controlId: 'ctrl-uuid-002', createdAt: new Date() },
      ];

      const riskWithRelations = {
        ...savedRisk,
        riskControls: junctionEntries,
        linkedControls: ['ctrl-uuid-001', 'ctrl-uuid-002'],
      };

      // Mock duplicate check
      mockRiskRepository.findOne.mockResolvedValueOnce(null);
      // Mock risk creation
      mockRiskRepository.create.mockReturnValue(savedRisk);
      mockRiskRepository.save.mockResolvedValue(savedRisk);
      // Mock junction entry creation
      mockRiskControlRepository.create
        .mockReturnValueOnce(junctionEntries[0])
        .mockReturnValueOnce(junctionEntries[1]);
      mockRiskControlRepository.save.mockResolvedValue(junctionEntries);
      // Mock findOne call at the end
      mockRiskRepository.findOne.mockResolvedValueOnce(riskWithRelations);

      const result = await service.create(createDto);

      expect(mockRiskControlRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRiskControlRepository.save).toHaveBeenCalled();
      expect(result.linkedControls).toEqual(['ctrl-uuid-001', 'ctrl-uuid-002']);
      expect(result.stakeholders).toEqual(['user-001', 'user-002']);
      expect(result.inherentLikelihood).toBe(RiskLevel.HIGH);
      expect(result.treatment).toBe(RiskTreatment.MITIGATE);
    });

  });

  describe('findAll - List All Risks', () => {
    it('should return all risks with linkedControls array', async () => {
      const risks = [
        {
          id: '1',
          riskId: 'RISK-001',
          title: 'Risk 1',
          riskControls: [
            { id: 'rc-1', controlId: 'ctrl-uuid-1', riskId: '1' }
          ]
        },
        {
          id: '2',
          riskId: 'RISK-002',
          title: 'Risk 2',
          riskControls: []
        },
        {
          id: '3',
          riskId: 'RISK-003',
          title: 'Risk 3',
          riskControls: [
            { id: 'rc-2', controlId: 'ctrl-uuid-2', riskId: '3' },
            { id: 'rc-3', controlId: 'ctrl-uuid-3', riskId: '3' }
          ]
        },
      ];

      mockRiskRepository.find.mockResolvedValue(risks);

      const result = await service.findAll();

      expect(mockRiskRepository.find).toHaveBeenCalledWith({
        relations: ['riskControls'],
        order: { createdAt: 'DESC' }
      });
      expect(result.length).toBe(3);
      expect(result[0].linkedControls).toEqual(['ctrl-uuid-1']);
      expect(result[1].linkedControls).toEqual([]);
      expect(result[2].linkedControls).toEqual(['ctrl-uuid-2', 'ctrl-uuid-3']);
    });

    it('should return empty array when no risks exist', async () => {
      mockRiskRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('findOne - Get Risk by ID', () => {
    it('should return a risk with linkedControls array when valid ID provided', async () => {
      const risk = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Data Breach Risk',
        inherentLikelihood: RiskLevel.HIGH,
        riskControls: [
          { id: 'rc-1', controlId: 'ctrl-uuid-001', riskId: 'uuid-123' }
        ],
      };

      mockRiskRepository.findOne.mockResolvedValue(risk);

      const result = await service.findOne('uuid-123');

      expect(mockRiskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        relations: ['riskControls'],
      });
      expect(result.id).toBe('uuid-123');
      expect(result.riskId).toBe('RISK-001');
      expect(result.linkedControls).toEqual(['ctrl-uuid-001']);
    });

    it('should throw NotFoundException when risk does not exist', async () => {
      mockRiskRepository.findOne.mockResolvedValue(null);

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

      const riskWithRelations = {
        ...updated,
        riskControls: [],
        linkedControls: [],
      };

      mockRiskRepository.findOne.mockResolvedValueOnce(existing);
      mockRiskRepository.save.mockResolvedValue(updated);
      mockRiskRepository.findOne.mockResolvedValueOnce(riskWithRelations);

      const result = await service.update('uuid-123', updateDto);

      expect(mockRiskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
      expect(mockRiskRepository.save).toHaveBeenCalledWith(updated);
      expect(result.title).toBe('Updated Title');
      expect(result.inherentLikelihood).toBe(RiskLevel.HIGH);
    });

    it('should update linked controls by deleting old and creating new junction entries', async () => {
      const existing = {
        id: 'uuid-123',
        riskId: 'RISK-001',
        title: 'Risk',
      };

      const updateDto = {
        linkedControls: ['ctrl-uuid-001', 'ctrl-uuid-002', 'ctrl-uuid-003'],
      };

      const updated = {
        ...existing,
      };

      const newJunctionEntries = [
        { id: 'rc-1', riskId: 'uuid-123', controlId: 'ctrl-uuid-001' },
        { id: 'rc-2', riskId: 'uuid-123', controlId: 'ctrl-uuid-002' },
        { id: 'rc-3', riskId: 'uuid-123', controlId: 'ctrl-uuid-003' },
      ];

      const riskWithRelations = {
        ...updated,
        riskControls: newJunctionEntries,
        linkedControls: ['ctrl-uuid-001', 'ctrl-uuid-002', 'ctrl-uuid-003'],
      };

      mockRiskRepository.findOne.mockResolvedValueOnce(existing);
      mockRiskRepository.save.mockResolvedValue(updated);
      mockRiskControlRepository.delete.mockResolvedValue({ affected: 1 });
      mockRiskControlRepository.create
        .mockReturnValueOnce(newJunctionEntries[0])
        .mockReturnValueOnce(newJunctionEntries[1])
        .mockReturnValueOnce(newJunctionEntries[2]);
      mockRiskControlRepository.save.mockResolvedValue(newJunctionEntries);
      mockRiskRepository.findOne.mockResolvedValueOnce(riskWithRelations);

      const result = await service.update('uuid-123', updateDto);

      expect(mockRiskControlRepository.delete).toHaveBeenCalledWith({ riskId: 'uuid-123' });
      expect(mockRiskControlRepository.create).toHaveBeenCalledTimes(3);
      expect(mockRiskControlRepository.save).toHaveBeenCalled();
      expect(result.linkedControls).toEqual(['ctrl-uuid-001', 'ctrl-uuid-002', 'ctrl-uuid-003']);
    });

    it('should throw NotFoundException when updating non-existent risk', async () => {
      mockRiskRepository.findOne.mockResolvedValue(null);

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
        riskControls: [],
        linkedControls: [],
      };

      mockRiskRepository.findOne.mockResolvedValue(risk);
      mockRiskRepository.remove.mockResolvedValue(risk);

      await service.remove('uuid-123');

      expect(mockRiskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        relations: ['riskControls'],
      });
      expect(mockRiskRepository.remove).toHaveBeenCalledWith(risk);
    });

    it('should throw NotFoundException when deleting non-existent risk', async () => {
      mockRiskRepository.findOne.mockResolvedValue(null);

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

      mockRiskRepository.findOne.mockResolvedValue(existingRisk);

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

      const savedWithRelations = {
        ...saved,
        riskControls: [],
        linkedControls: [],
      };

      // Reset mock for this test
      mockRiskRepository.findOne.mockResolvedValueOnce(null);
      mockRiskRepository.create.mockReturnValue(saved);
      mockRiskRepository.save.mockResolvedValue(saved);
      mockRiskRepository.findOne.mockResolvedValueOnce(savedWithRelations);

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

      const savedWithRelations = {
        ...saved,
        riskControls: [],
        linkedControls: [],
      };

      // Reset mock for this test
      mockRiskRepository.findOne.mockResolvedValueOnce(null);
      mockRiskRepository.create.mockReturnValue(saved);
      mockRiskRepository.save.mockResolvedValue(saved);
      mockRiskRepository.findOne.mockResolvedValueOnce(savedWithRelations);

      const result = await service.create(validDto);

      expect(result.treatment).toBe(RiskTreatment.TRANSFER);
    });
  });

  /**
   * Junction Table Specific Tests
   * Tests the many-to-many relationship implementation
   */
  describe('Junction Table - RiskControl Relationship', () => {
    it('should create junction entries when creating risk with linkedControls', async () => {
      const createDto = {
        riskId: 'RISK-JUNCTION',
        title: 'Test Junction',
        linkedControls: ['ctrl-a', 'ctrl-b'],
      };

      const { linkedControls, ...riskData } = createDto;

      const savedRisk = {
        id: 'uuid-junction',
        ...riskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const junctionEntries = [
        { id: 'rc-a', riskId: 'uuid-junction', controlId: 'ctrl-a' },
        { id: 'rc-b', riskId: 'uuid-junction', controlId: 'ctrl-b' },
      ];

      const finalRisk = {
        ...savedRisk,
        riskControls: junctionEntries,
        linkedControls: ['ctrl-a', 'ctrl-b'],
      };

      mockRiskRepository.findOne.mockResolvedValueOnce(null);
      mockRiskRepository.create.mockReturnValue(savedRisk);
      mockRiskRepository.save.mockResolvedValue(savedRisk);
      mockRiskControlRepository.create
        .mockReturnValueOnce(junctionEntries[0])
        .mockReturnValueOnce(junctionEntries[1]);
      mockRiskControlRepository.save.mockResolvedValue(junctionEntries);
      mockRiskRepository.findOne.mockResolvedValueOnce(finalRisk);

      const result = await service.create(createDto);

      expect(mockRiskControlRepository.create).toHaveBeenCalledWith({
        riskId: 'uuid-junction',
        controlId: 'ctrl-a',
      });
      expect(mockRiskControlRepository.create).toHaveBeenCalledWith({
        riskId: 'uuid-junction',
        controlId: 'ctrl-b',
      });
      expect(mockRiskControlRepository.save).toHaveBeenCalledWith(junctionEntries);
      expect(result.linkedControls).toEqual(['ctrl-a', 'ctrl-b']);
    });

    it('should format riskControls as linkedControls array for backward compatibility', async () => {
      const risk = {
        id: 'uuid-format',
        riskId: 'RISK-FORMAT',
        title: 'Format Test',
        riskControls: [
          { id: 'rc-1', controlId: 'control-x', riskId: 'uuid-format' },
          { id: 'rc-2', controlId: 'control-y', riskId: 'uuid-format' },
          { id: 'rc-3', controlId: 'control-z', riskId: 'uuid-format' },
        ],
      };

      mockRiskRepository.findOne.mockResolvedValue(risk);

      const result = await service.findOne('uuid-format');

      expect(result.linkedControls).toEqual(['control-x', 'control-y', 'control-z']);
      expect(result.linkedControls.length).toBe(3);
    });

    it('should delete old junction entries when updating linkedControls', async () => {
      const existing = {
        id: 'uuid-update',
        riskId: 'RISK-UPDATE',
        title: 'Update Test',
      };

      const updateDto = {
        linkedControls: ['new-ctrl-1', 'new-ctrl-2'],
      };

      const newJunctions = [
        { id: 'rc-new-1', riskId: 'uuid-update', controlId: 'new-ctrl-1' },
        { id: 'rc-new-2', riskId: 'uuid-update', controlId: 'new-ctrl-2' },
      ];

      const finalRisk = {
        ...existing,
        riskControls: newJunctions,
        linkedControls: ['new-ctrl-1', 'new-ctrl-2'],
      };

      mockRiskRepository.findOne.mockResolvedValueOnce(existing);
      mockRiskRepository.save.mockResolvedValue(existing);
      mockRiskControlRepository.delete.mockResolvedValue({ affected: 2 });
      mockRiskControlRepository.create
        .mockReturnValueOnce(newJunctions[0])
        .mockReturnValueOnce(newJunctions[1]);
      mockRiskControlRepository.save.mockResolvedValue(newJunctions);
      mockRiskRepository.findOne.mockResolvedValueOnce(finalRisk);

      const result = await service.update('uuid-update', updateDto);

      expect(mockRiskControlRepository.delete).toHaveBeenCalledWith({ riskId: 'uuid-update' });
      expect(mockRiskControlRepository.create).toHaveBeenCalledTimes(2);
      expect(result.linkedControls).toEqual(['new-ctrl-1', 'new-ctrl-2']);
    });
  });
});
