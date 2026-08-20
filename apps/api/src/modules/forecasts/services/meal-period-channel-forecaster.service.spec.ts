import { Test, TestingModule } from '@nestjs/testing';
import { MealPeriodChannelForecasterService } from './meal-period-channel-forecaster.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('MealPeriodChannelForecasterService', () => {
  let service: MealPeriodChannelForecasterService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      order: {
        findMany: jest.fn().mockResolvedValue([
          {
            totalAmount: '1000',
            orderType: 'DINE_IN',
            createdAt: new Date('2026-08-10T13:00:00Z'),
          },
          {
            totalAmount: '2000',
            orderType: 'DELIVERY',
            createdAt: new Date('2026-08-10T20:00:00Z'),
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPeriodChannelForecasterService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MealPeriodChannelForecasterService>(MealPeriodChannelForecasterService);
  });

  it('should forecast meal periods and channels accurately', async () => {
    const res = await service.forecastMealPeriodsAndChannels('rest-1', 80000, 600);

    expect(res.mealPeriods.length).toBe(4);
    expect(res.channels.length).toBeGreaterThan(0);

    const totalPeriodSales = res.mealPeriods.reduce((s, m) => s + m.predictedSales, 0);
    expect(totalPeriodSales).toBeGreaterThan(0);
  });

  it('should generate 7x24 demand heatmap matrix', async () => {
    const heatmap = await service.generateDemandHeatmap('rest-1');

    expect(heatmap.length).toBe(7); // 7 days of week
    expect(heatmap[0].length).toBe(24); // 24 hours
    expect(heatmap[0][0].intensity).toBeDefined();
  });
});
