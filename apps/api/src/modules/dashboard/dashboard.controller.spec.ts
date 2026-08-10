import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: any;

  beforeEach(async () => {
    dashboardService = {
      getOverview: jest.fn().mockResolvedValue({
        users: { total: 10, active: 8, admins: 2 },
        recentUsers: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getOverview should call dashboardService.getOverview', async () => {
    const result = await controller.getOverview();

    expect(dashboardService.getOverview).toHaveBeenCalled();
    expect(result).toEqual({
      users: { total: 10, active: 8, admins: 2 },
      recentUsers: [],
    });
  });
});
