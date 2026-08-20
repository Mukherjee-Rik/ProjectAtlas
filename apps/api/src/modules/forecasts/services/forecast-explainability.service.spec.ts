import { Test, TestingModule } from '@nestjs/testing';
import { ForecastExplainabilityService } from './forecast-explainability.service';
import { FeatureEngineeringService, DailyFeatureVector } from './feature-engineering.service';

describe('ForecastExplainabilityService', () => {
  let service: ForecastExplainabilityService;
  let featureEngineMock: any;

  const mockHistorical: DailyFeatureVector[] = [
    {
      date: '2026-08-01',
      dayOfWeek: 5, // Fri
      isWeekend: false,
      dayOfMonth: 1,
      month: 8,
      grossSales: 60000,
      netSales: 54000,
      totalOrders: 450,
      averageOrderValue: 133,
      lag1dSales: 50000,
      lag7dSales: 58000,
      lag14dSales: 56000,
      lag21dSales: 55000,
      lag28dSales: 54000,
      rolling7dMeanSales: 52000,
      rolling7dMeanOrders: 400,
      rolling7dStdSales: 2500,
    },
  ];

  beforeEach(async () => {
    featureEngineMock = {
      buildHistoricalFeatures: jest.fn().mockResolvedValue(mockHistorical),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastExplainabilityService,
        { provide: FeatureEngineeringService, useValue: featureEngineMock },
      ],
    }).compile();

    service = module.get<ForecastExplainabilityService>(ForecastExplainabilityService);
  });

  it('should decompose forecast into 4 causal factors with human explanation', async () => {
    const explanation = await service.explainForecast('rest-1', 65000);

    expect(explanation).toBeDefined();
    expect(explanation.predictedSales).toBe(65000);
    expect(explanation.factors.length).toBe(4);
    expect(explanation.summaryText).toContain('Expected');
    expect(explanation.factors[0].description).toBeDefined();
  });
});
