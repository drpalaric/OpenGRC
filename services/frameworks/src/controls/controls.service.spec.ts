import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ControlsService } from './controls.service';
import { Control } from './entities/control.entity';

describe('ControlsService', () => {
  let service: ControlsService;
  let repository: Repository<Control>;

  const mockControl = {
    id: 'AST-01',
    source: 'SCF',
    name: 'Asset Governance',
    description: 'Mechanisms exist to identify and document asset management roles and responsibilities.',
    domain: 'Asset Management',
    procedure: 'Establish asset management policies',
    maturity: 'Level 2',
    nist80053: 'CM-8',
    nistCsf: 'ID.AM-1',
    iso27k: 'A.8.1.1',
    pci4: '2.4',
    mitre: 'T1087',
    evidence: null,
    policy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlsService,
        {
          provide: getRepositoryToken(Control),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ControlsService>(ControlsService);
    repository = module.get<Repository<Control>>(
      getRepositoryToken(Control),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all controls', async () => {
      const controls = [mockControl];
      jest.spyOn(repository, 'find').mockResolvedValue(controls as any);

      const result = await service.findAll();

      expect(result).toEqual(controls);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return controls filtered by domain', async () => {
      const controls = [mockControl];
      jest.spyOn(repository, 'find').mockResolvedValue(controls as any);

      const result = await service.findAll({ domain: 'Asset Management' });

      expect(result).toEqual(controls);
      expect(repository.find).toHaveBeenCalledWith({
        where: { domain: 'Asset Management' },
        order: { id: 'ASC' },
      });
    });

    it('should return controls filtered by source', async () => {
      const controls = [mockControl];
      jest.spyOn(repository, 'find').mockResolvedValue(controls as any);

      const result = await service.findAll({ source: 'SCF' });

      expect(result).toEqual(controls);
      expect(repository.find).toHaveBeenCalledWith({
        where: { source: 'SCF' },
        order: { id: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a control by id', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockControl as any);

      const result = await service.findOne('AST-01');

      expect(result).toEqual(mockControl);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'AST-01' },
      });
    });

    it('should throw NotFoundException when control not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('INVALID-ID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should search controls by name or description', async () => {
      const controls = [mockControl];
      jest.spyOn(repository, 'find').mockResolvedValue(controls as any);

      const result = await service.search('Asset');

      expect(result).toEqual(controls);
    });
  });

  describe('count', () => {
    it('should return total count of controls', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(271);

      const result = await service.count();

      expect(result).toBe(271);
    });
  });
});
