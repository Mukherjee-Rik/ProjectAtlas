import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: any;

  beforeEach(async () => {
    dashboardService = {
      getRestaurantOverview: jest.fn().mockResolvedValue({
        users: { total: 10, active: 8, admins: 2 },
        recentUsers: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        TtlCacheService,
        { provide: DashboardService, useValue: dashboardService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getOverview should call dashboardService.getRestaurantOverview', async () => {
    const result = await controller.getOverview();

    expect(dashboardService.getRestaurantOverview).toHaveBeenCalled();
    expect(result).toEqual({
      users: { total: 10, active: 8, admins: 2 },
      recentUsers: [],
    });
  });
});
