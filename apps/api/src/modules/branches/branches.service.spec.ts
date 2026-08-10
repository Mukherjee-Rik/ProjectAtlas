import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('BranchesService', () => {
  let service: BranchesService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      restaurant: {
        findFirst: jest.fn(),
      },
      branch: {
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
        BranchesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw ForbiddenException if restaurant does not belong to tenant', async () => {
    prismaService.restaurant.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tenant-a', {
        restaurantId: 'rest-b',
        name: 'Branch B',
        code: 'B-01',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('create should throw ConflictException if duplicate code for same restaurant', async () => {
    prismaService.restaurant.findFirst.mockResolvedValue({ id: 'rest-a', tenantId: 'tenant-a' });
    prismaService.branch.findUnique.mockResolvedValue({ id: 'b-1', code: 'AGT-01' });

    await expect(
      service.create('tenant-a', {
        restaurantId: 'rest-a',
        name: 'Agartala Branch',
        code: 'AGT-01',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create branch when valid', async () => {
    prismaService.restaurant.findFirst.mockResolvedValue({ id: 'rest-a', tenantId: 'tenant-a' });
    prismaService.branch.findUnique.mockResolvedValue(null);
    const mockBranch = {
      id: 'b-1',
      restaurantId: 'rest-a',
      name: 'Agartala Branch',
      code: 'AGT-01',
    };
    prismaService.branch.create.mockResolvedValue(mockBranch);

    const result = await service.create('tenant-a', {
      restaurantId: 'rest-a',
      name: 'Agartala Branch',
      code: 'AGT-01',
    });

    expect(result).toEqual(mockBranch);
  });

  it('findAll should query by tenantId', async () => {
    await service.findAll('tenant-a', 'rest-a');
    expect(prismaService.branch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          restaurant: { tenantId: 'tenant-a' },
          restaurantId: 'rest-a',
        },
      }),
    );
  });
});
