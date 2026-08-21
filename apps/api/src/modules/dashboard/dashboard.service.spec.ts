import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      restaurant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'r-1', tenantId: 't-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'r-1', tenantId: 't-1' }),
      },
      order: {
        count: jest.fn().mockResolvedValue(10),
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 5000 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      table: {
        count: jest.fn().mockResolvedValue(5),
      },
      menuItem: {
        count: jest.fn().mockResolvedValue(20),
      },
      tenantMembership: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return aggregated overview numbers and recent orders', async () => {
    const result = await service.getRestaurantOverview({ id: 'u-1', role: 'PLATFORM_ADMIN' }, 'r-1');

    expect(result).toHaveProperty('metrics');
    expect(result.metrics.totalOrders).toBe(10);
    expect(result.metrics.totalSales).toBe(5000);
    expect(result.metrics.activeTables).toBe(5);
    expect(result.metrics.menuItems).toBe(20);
    expect(result.metrics.staffCount).toBe(4);
  });
});
