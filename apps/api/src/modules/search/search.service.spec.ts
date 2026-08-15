import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrismaService = {
    restaurant: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ tenantId: 't1' }),
    },
    menuItem: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    table: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    tenantMembership: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'owner@test.com' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty results for queries under 2 characters', async () => {
    const res = await service.globalSearch('a', 'u1', 'OWNER', 'r1');
    expect(res.pages).toHaveLength(0);
    expect(prisma.menuItem.findMany).not.toHaveBeenCalled();
  });

  it('should query menu items and orders with correct tenant scoping', async () => {
    await service.globalSearch('paneer', 'u1', 'OWNER', 'r1');

    expect(prisma.menuItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: {
            menu: {
              restaurantId: 'r1',
            },
          },
          name: { contains: 'paneer', mode: 'insensitive' },
        }),
      }),
    );

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          restaurantId: 'r1',
        }),
      }),
    );
  });

  it('should support platform admin global queries without restaurant scope', async () => {
    await service.globalSearch('sweta', 'u1', 'PLATFORM_ADMIN');

    expect(prisma.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'sweta', mode: 'insensitive' } },
            { slug: { contains: 'sweta', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });
});
