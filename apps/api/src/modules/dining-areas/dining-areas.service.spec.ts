import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiningAreasService } from './dining-areas.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('DiningAreasService', () => {
  let service: DiningAreasService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      diningArea: {
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
        DiningAreasService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DiningAreasService>(DiningAreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw ConflictException if duplicate code in branch', async () => {
    prismaService.diningArea.findUnique.mockResolvedValue({ id: 'da-1', code: 'INDOOR' });

    await expect(
      service.create('branch-a', {
        name: 'Indoor Dining',
        code: 'INDOOR',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create dining area when valid', async () => {
    prismaService.diningArea.findUnique.mockResolvedValue(null);
    const mockArea = {
      id: 'da-1',
      branchId: 'branch-a',
      name: 'Indoor Dining',
      code: 'INDOOR',
    };
    prismaService.diningArea.create.mockResolvedValue(mockArea);

    const result = await service.create('branch-a', {
      name: 'Indoor Dining',
      code: 'INDOOR',
    });

    expect(result).toEqual(mockArea);
  });

  it('findAll should filter by branchId', async () => {
    await service.findAll('branch-a');
    expect(prismaService.diningArea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { branchId: 'branch-a' },
      }),
    );
  });
});
