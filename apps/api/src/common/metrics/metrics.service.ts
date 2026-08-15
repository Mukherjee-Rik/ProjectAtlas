import { Injectable, Logger } from '@nestjs/common';

export interface EndpointMetric {
  path: string;
  method: string;
  totalRequests: number;
  totalErrors: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  private readonly latencies: number[] = [];
  private readonly maxLatencySamples = 5000;

  private totalRequests = 0;
  private totalErrors4xx = 0;
  private totalErrors5xx = 0;
  private recentRequestsInLastMinute: number[] = [];

  private readonly endpointMap = new Map<string, { requests: number; errors: number; latencies: number[] }>();

  recordRequest(method: string, path: string, statusCode: number, durationMs: number) {
    const now = Date.now();
    this.totalRequests++;

    if (statusCode >= 400 && statusCode < 500) {
      this.totalErrors4xx++;
    } else if (statusCode >= 500) {
      this.totalErrors5xx++;
    }

    // Rolling latency window
    this.latencies.push(durationMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }

    // Rolling 1-minute throughput window
    this.recentRequestsInLastMinute.push(now);
    const oneMinAgo = now - 60000;
    while (this.recentRequestsInLastMinute.length > 0 && this.recentRequestsInLastMinute[0] < oneMinAgo) {
      this.recentRequestsInLastMinute.shift();
    }

    // Per-endpoint telemetry (normalized path)
    const normalizedPath = path.split('?')[0];
    const key = `${method} ${normalizedPath}`;
    let ep = this.endpointMap.get(key);
    if (!ep) {
      ep = { requests: 0, errors: 0, latencies: [] };
      this.endpointMap.set(key, ep);
    }
    ep.requests++;
    if (statusCode >= 400) ep.errors++;
    ep.latencies.push(durationMs);
    if (ep.latencies.length > 500) ep.latencies.shift();
  }

  getSystemOverview() {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const count = sortedLatencies.length;

    const p50 = count > 0 ? sortedLatencies[Math.floor(count * 0.5)] : 0;
    const p95 = count > 0 ? sortedLatencies[Math.floor(count * 0.95)] : 0;
    const p99 = count > 0 ? sortedLatencies[Math.floor(count * 0.99)] : 0;
    const avgLatency = count > 0 ? Math.round(sortedLatencies.reduce((a, b) => a + b, 0) / count) : 0;

    const totalErrors = this.totalErrors4xx + this.totalErrors5xx;
    const errorRatePercent = this.totalRequests > 0 ? ((totalErrors / this.totalRequests) * 100).toFixed(2) : '0.00';
    const requestsPerMinute = this.recentRequestsInLastMinute.length;

    return {
      status: 'HEALTHY',
      uptimeSeconds,
      throughput: {
        totalRequests: this.totalRequests,
        requestsPerMinute,
        requestsPerSecond: (requestsPerMinute / 60).toFixed(2),
      },
      errors: {
        total4xx: this.totalErrors4xx,
        total5xx: this.totalErrors5xx,
        errorRatePercent: parseFloat(errorRatePercent),
      },
      latencyMs: {
        avg: avgLatency,
        p50,
        p95,
        p99,
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      cpu: {
        userUsec: process.cpuUsage().user,
        systemUsec: process.cpuUsage().system,
      },
    };
  }

  getTopEndpoints(): EndpointMetric[] {
    const result: EndpointMetric[] = [];
    for (const [key, data] of this.endpointMap.entries()) {
      const [method, path] = key.split(' ');
      const sorted = [...data.latencies].sort((a, b) => a - b);
      const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
      const avg = sorted.length > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;

      result.push({
        method,
        path,
        totalRequests: data.requests,
        totalErrors: data.errors,
        avgLatencyMs: avg,
        p95LatencyMs: p95,
      });
    }

    return result.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10);
  }
}
