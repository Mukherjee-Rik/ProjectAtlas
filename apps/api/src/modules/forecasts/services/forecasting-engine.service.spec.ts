import { Test, TestingModule } from '@nestjs/testing';
import { ForecastingEngineService } from './forecasting-engine.service';
import { FeatureEngineeringService, DailyFeatureVector } from './feature-engineering.service';
import { ForecastAccuracyService } from './forecast-accuracy.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('ForecastingEngineService & Accuracy Framework', () => {
  let engine: ForecastingEngineService;
  let accuracyService: ForecastAccuracyService;
  let featureEngineMock: any;
  let prismaMock: any;

  const mockHistorical: DailyFeatureVector[] = [
    {
      date: '2026-08-01',
      dayOfWeek: 6, // Sat
      isWeekend: true,
      dayOfMonth: 1,
      month: 8,
      grossSales: 50000,
      netSales: 45000,
      totalOrders: 400,
      averageOrderValue: 125,
      lag1dSales: 48000,
      lag7dSales: 49000,
      lag14dSales: 47000,
      lag21dSales: 46000,
      lag28dSales: 45000,
      rolling7dMeanSales: 48000,
      rolling7dMeanOrders: 390,
      rolling7dStdSales: 2000,
    },
    {
      date: '2026-08-02',
      dayOfWeek: 0, // Sun
      isWeekend: true,
      dayOfMonth: 2,
      month: 8,
      grossSales: 55000,
      netSales: 50000,
      totalOrders: 440,
      averageOrderValue: 125,
      lag1dSales: 50000,
      lag7dSales: 52000,
      lag14dSales: 51000,
      lag21dSales: 49000,
      lag28dSales: 48000,
      rolling7dMeanSales: 49000,
      rolling7dMeanOrders: 400,
      rolling7dStdSales: 2500,
    },
  ];

  beforeEach(async () => {
    featureEngineMock = {
      buildHistoricalFeatures: jest.fn().mockResolvedValue(mockHistorical),
    };

    prismaMock = {
      forecastAccuracy: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastingEngineService,
        ForecastAccuracyService,
        { provide: FeatureEngineeringService, useValue: featureEngineMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    engine = module.get<ForecastingEngineService>(ForecastingEngineService);
    accuracyService = module.get<ForecastAccuracyService>(ForecastAccuracyService);
  });

  it('should generate sales forecast with valid prediction intervals and confidence', async () => {
    const res = await engine.generateSalesForecast('rest-1', undefined, 7);

    expect(res).toBeDefined();
    expect(res.horizon).toBe('7D');
    expect(res.dailyProjections.length).toBe(7);

    res.dailyProjections.forEach((p) => {
      expect(p.predictedSales).toBeGreaterThan(0);
      expect(p.lowerBoundSales).toBeGreaterThanOrEqual(0);
      expect(p.upperBoundSales).toBeGreaterThanOrEqual(p.predictedSales);
      expect(p.confidence).toBeGreaterThanOrEqual(60);
      expect(p.confidence).toBeLessThanOrEqual(95);
    });

    expect(res.hourlyProjections.length).toBe(24);
  });

  it('should accurately calculate WAPE without zero-division error', () => {
    const actuals = [1000, 2000, 3000, 0];
    const predictions = [1100, 1900, 3100, 100];

    // Total actuals = 6000
    // Total abs errors = 100 + 100 + 100 + 100 = 400
    // WAPE = (400 / 6000) * 100 = 6.67%
    const wape = accuracyService.computeWape(actuals, predictions);
    expect(Math.round(wape * 100) / 100).toBe(6.67);
  });
});
