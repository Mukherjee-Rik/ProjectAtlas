import { Test, TestingModule } from '@nestjs/testing';
import { ComparisonEngineService } from './comparison-engine.service';

describe('ComparisonEngineService', () => {
  let service: ComparisonEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComparisonEngineService],
    }).compile();

    service = module.get<ComparisonEngineService>(ComparisonEngineService);
  });

  it('should calculate positive growth correctly', () => {
    const res = service.compare(520000, 480000);
    expect(res.currentValue).toBe(520000);
    expect(res.previousValue).toBe(480000);
    expect(res.difference).toBe(40000);
    expect(res.percentageChange).toBe(8.33);
    expect(res.trend).toBe('UP');
  });

  it('should calculate negative growth correctly', () => {
    const res = service.compare(400000, 500000);
    expect(res.difference).toBe(-100000);
    expect(res.percentageChange).toBe(-20.0);
    expect(res.trend).toBe('DOWN');
  });

  it('should handle zero previous value without division-by-zero errors', () => {
    const res = service.compare(1000, 0);
    expect(res.difference).toBe(1000);
    expect(res.percentageChange).toBe(100.0);
    expect(res.trend).toBe('UP');
  });

  it('should handle both zero values gracefully', () => {
    const res = service.compare(0, 0);
    expect(res.difference).toBe(0);
    expect(res.percentageChange).toBe(0);
    expect(res.trend).toBe('FLAT');
  });

  it('should resolve previous period window boundaries', () => {
    const from = new Date('2026-08-01T00:00:00Z');
    const to = new Date('2026-08-31T23:59:59Z');
    const window = service.resolveComparisonWindow(from, to, 'PREVIOUS_PERIOD');
    expect(window.previousTo.getTime()).toBeLessThan(from.getTime());
  });
});
