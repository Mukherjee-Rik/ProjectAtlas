import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TablesService', () => {
  let service: TablesService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      diningArea: {
        findFirst: jest.fn(),
      },
      table: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw ForbiddenException if dining area does not belong to active branch', async () => {
    prismaService.diningArea.findFirst.mockResolvedValue(null);

    await expect(
      service.create('branch-a', {
        diningAreaId: 'da-b',
        name: 'Table 1',
        code: 'T01',
        capacity: 4,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('create should throw ConflictException if duplicate code in dining area', async () => {
    prismaService.diningArea.findFirst.mockResolvedValue({ id: 'da-a', branchId: 'branch-a' });
    prismaService.table.findUnique.mockResolvedValue({ id: 't-1', code: 'T01' });

    await expect(
      service.create('branch-a', {
        diningAreaId: 'da-a',
        name: 'Table 1',
        code: 'T01',
        capacity: 4,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create table when valid', async () => {
    prismaService.diningArea.findFirst.mockResolvedValue({ id: 'da-a', branchId: 'branch-a' });
    prismaService.table.findUnique.mockResolvedValue(null);
    const mockTable = {
      id: 't-1',
      diningAreaId: 'da-a',
      name: 'Table 1',
      code: 'T01',
      capacity: 4,
    };
    prismaService.table.create.mockResolvedValue(mockTable);

    const result = await service.create('branch-a', {
      diningAreaId: 'da-a',
      name: 'Table 1',
      code: 'T01',
      capacity: 4,
    });

    expect(result).toEqual(mockTable);
  });

  it('findAll should filter by branchId', async () => {
    await service.findAll('branch-a', 'da-a');
    expect(prismaService.table.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          diningArea: { branchId: 'branch-a' },
          diningAreaId: 'da-a',
        },
      }),
    );
  });
});
