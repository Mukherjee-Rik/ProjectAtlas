import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantMembershipsService } from './tenant-memberships.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SubscriptionUsageService } from '../subscriptions/subscription-usage.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

describe('TenantMembershipsService', () => {
  let service: TenantMembershipsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u-1' }),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 't-1' }),
      },
      restaurant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'r-1' }),
      },
      tenantMembership: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtlCacheService,
        TenantMembershipsService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: SubscriptionUsageService,
          useValue: { checkLimit: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<TenantMembershipsService>(TenantMembershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw ConflictException if membership already exists', async () => {
    prismaService.tenantMembership.findUnique.mockResolvedValue({ id: 'tm-1' });

    await expect(
      service.create({ userId: 'u-1', tenantId: 't-1', role: 'USER' as any }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create membership if clean', async () => {
    prismaService.tenantMembership.findUnique.mockResolvedValue(null);
    const mockMembership = {
      id: 'tm-1',
      userId: 'u-1',
      tenantId: 't-1',
      role: 'USER',
    };
    prismaService.tenantMembership.create.mockResolvedValue(mockMembership);

    const result = await service.create({
      userId: 'u-1',
      tenantId: 't-1',
      role: 'USER' as any,
    });

    expect(result).toEqual(mockMembership);
  });
});
