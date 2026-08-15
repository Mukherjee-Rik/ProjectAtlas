import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
  });

  it('should record requests and compute latency percentiles accurately', () => {
    // Record 100 requests with varying latencies: 1ms to 100ms
    for (let i = 1; i <= 100; i++) {
      metrics.recordRequest('GET', '/api/orders', 200, i);
    }

    const overview = metrics.getSystemOverview();
    expect(overview.status).toBe('HEALTHY');
    expect(overview.throughput.totalRequests).toBe(100);
    expect(overview.latencyMs.p50).toBe(51); // 50th percentile of 1..100
    expect(overview.latencyMs.p95).toBe(96); // 95th percentile
    expect(overview.latencyMs.p99).toBe(100); // 99th percentile
    expect(overview.errors.total4xx).toBe(0);
    expect(overview.errors.total5xx).toBe(0);
  });

  it('should calculate error rate percentage for 4xx and 5xx responses', () => {
    metrics.recordRequest('GET', '/api/menus', 200, 20);
    metrics.recordRequest('GET', '/api/menus', 200, 30);
    metrics.recordRequest('POST', '/api/orders', 400, 15);
    metrics.recordRequest('GET', '/api/reports', 500, 80);

    const overview = metrics.getSystemOverview();
    expect(overview.throughput.totalRequests).toBe(4);
    expect(overview.errors.total4xx).toBe(1);
    expect(overview.errors.total5xx).toBe(1);
    expect(overview.errors.errorRatePercent).toBe(50);
  });

  it('should record and rank top active endpoints', () => {
    metrics.recordRequest('GET', '/api/orders', 200, 10);
    metrics.recordRequest('GET', '/api/orders', 200, 12);
    metrics.recordRequest('GET', '/api/menus', 200, 5);

    const top = metrics.getTopEndpoints();
    expect(top.length).toBe(2);
    expect(top[0].path).toBe('/api/orders');
    expect(top[0].totalRequests).toBe(2);
    expect(top[1].path).toBe('/api/menus');
    expect(top[1].totalRequests).toBe(1);
  });
});
