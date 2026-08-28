'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

interface TelemetryOverview {
  status: 'HEALTHY' | 'DEGRADED';
  components: {
    api: { status: string };
    database: { status: string; latencyMs?: number; error?: string };
    queue: { status: string; details?: any };
    memory: { status: string; details?: { heapUsedMb: number; rssMb: number } };
  };
  telemetry: {
    throughput: { totalRequests: number; requestsPerMinute: number; requestsPerSecond: string };
    latencyMs: { avg: number; p50: number; p95: number; p99: number };
    errors: { total4xx: number; total5xx: number; errorRatePercent: number };
    memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
    uptimeSeconds: number;
  };
  queue: {
    totalJobs: number;
    waiting: number;
    active: number;
    completed: number;
    retrying: number;
    deadLetter: number;
  };
  topEndpoints: Array<{
    method: string;
    path: string;
    totalRequests: number;
    totalErrors: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
  }>;
}

interface DeadLetterJob {
  id: string;
  type: string;
  restaurantId?: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  completedAt?: string;
}

export function PlatformMonitoringDashboard() {
  const [overview, setOverview] = useState<TelemetryOverview | null>(null);
  const [deadLetterJobs, setDeadLetterJobs] = useState<DeadLetterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const [overviewData, deadLetterData] = await Promise.all([
        apiClient.get<any>('/monitoring/overview').catch(() => null),
        apiClient.get<any>('/monitoring/dead-letter').catch(() => []),
      ]);
      const extractedOverview = (overviewData as any)?.data ?? overviewData ?? null;
      const extractedDeadLetter = Array.isArray(deadLetterData) ? deadLetterData : (deadLetterData as any)?.data ?? [];
      setOverview(extractedOverview);
      setDeadLetterJobs(extractedDeadLetter);
    } catch (err) {
      console.error('Failed to load telemetry overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchMonitoringData, 5000);
    return () => clearInterval(interval);
  }, [fetchMonitoringData, autoRefresh]);

  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      await apiClient.post(`/monitoring/dead-letter/${jobId}/retry`, {});
      await fetchMonitoringData();
    } catch (err) {
      console.error('Failed to retry job:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHealthy = overview?.status === 'HEALTHY';

  return (
    <div className="space-y-6">
      {/* Header with live refresh toggle */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Production Infrastructure & Telemetry</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isHealthy ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-atlas-error/10 text-atlas-error border border-atlas-error/20'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isHealthy ? 'bg-primary animate-pulse' : 'bg-atlas-error'}`} />
              {isHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time latency percentiles, database probes, background queue states, and error tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {autoRefresh ? '● Live Refresh (5s)' : '○ Paused'}
          </button>
          <button
            type="button"
            onClick={fetchMonitoringData}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-border transition-colors"
          >
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* Component Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">API Gateway</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">HTTP / Express</p>
          <p className="text-xs text-primary mt-1 font-mono">Uptime: {formatUptime(overview?.telemetry?.uptimeSeconds || 0)}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">PostgreSQL Database</span>
            <span className={`h-2 w-2 rounded-full ${overview?.components?.database?.status === 'UP' ? 'bg-primary' : 'bg-atlas-error'}`} />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">Prisma ORM</p>
          <p className="text-xs text-primary mt-1 font-mono">
            Latency: {overview?.components?.database?.latencyMs ?? 0} ms (UP)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Background Queue</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">Async Engine</p>
          <p className="text-xs text-primary mt-1 font-mono">
            {overview?.queue?.active || 0} active • {overview?.queue?.waiting || 0} waiting
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Memory Footprint</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">{overview?.telemetry?.memory?.heapUsedMb ?? 0} MB</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            RSS: {overview?.telemetry?.memory?.rssMb ?? 0} MB
          </p>
        </div>
      </div>

      {/* Latency Percentiles & Throughput Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latency Percentiles */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Latency Percentiles</h3>
            <span className="text-xs font-mono text-muted-foreground">Rolling Samples</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary p-3 text-center border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">P50 (Median)</span>
              <p className="text-lg font-bold text-primary mt-1">{overview?.telemetry?.latencyMs?.p50 ?? 0} ms</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">P95</span>
              <p className="text-lg font-bold text-atlas-warning mt-1">{overview?.telemetry?.latencyMs?.p95 ?? 0} ms</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">P99</span>
              <p className="text-lg font-bold text-atlas-error mt-1">{overview?.telemetry?.latencyMs?.p99 ?? 0} ms</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Average API Latency</span>
            <span className="font-mono text-foreground font-semibold">{overview?.telemetry?.latencyMs?.avg ?? 0} ms</span>
          </div>
        </div>

        {/* Throughput & Volume */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Throughput & Traffic</h3>
            <span className="text-xs font-mono text-muted-foreground">Live Rate</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Requests per Minute</span>
              <span className="font-mono text-sm font-bold text-foreground">{overview?.telemetry?.throughput?.requestsPerMinute ?? 0} req/min</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Handled Requests</span>
              <span className="font-mono text-sm font-bold text-primary">
                {(overview?.telemetry?.throughput?.totalRequests ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Error Rate</span>
              <span className={`font-mono text-sm font-bold ${(overview?.telemetry?.errors?.errorRatePercent ?? 0) > 5 ? 'text-atlas-error' : 'text-primary'}`}>
                {overview?.telemetry?.errors?.errorRatePercent ?? '0.00'}%
              </span>
            </div>
          </div>
        </div>

        {/* Queue States */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Queue Engine Lifecycle</h3>
            <span className="text-xs font-mono text-muted-foreground">{overview?.queue?.totalJobs ?? 0} Jobs</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-secondary p-2.5 border border-border">
              <span className="text-muted-foreground">Completed</span>
              <p className="text-base font-bold text-primary mt-0.5">{overview?.queue?.completed ?? 0}</p>
            </div>
            <div className="rounded-lg bg-secondary p-2.5 border border-border">
              <span className="text-muted-foreground">Active / Running</span>
              <p className="text-base font-bold text-primary mt-0.5">{overview?.queue?.active ?? 0}</p>
            </div>
            <div className="rounded-lg bg-secondary p-2.5 border border-border">
              <span className="text-muted-foreground">Waiting</span>
              <p className="text-base font-bold text-atlas-warning mt-0.5">{overview?.queue?.waiting ?? 0}</p>
            </div>
            <div className="rounded-lg bg-secondary p-2.5 border border-border">
              <span className="text-muted-foreground">Dead Letter / Failed</span>
              <p className="text-base font-bold text-atlas-error mt-0.5">{overview?.queue?.deadLetter ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dead Letter Queue Table */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Dead-Letter & Failed Background Jobs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Jobs that exceeded max retries with exponential backoff</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-muted-foreground border border-border">
            {deadLetterJobs.length} Failed Job(s)
          </span>
        </div>

        {deadLetterJobs.length === 0 ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <p className="text-sm text-primary font-semibold">✓ No Failed Jobs in Dead-Letter Queue</p>
            <p className="text-xs text-muted-foreground mt-1">All background tasks and automation jobs are succeeding normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground font-mono uppercase">
                <tr>
                  <th className="pb-2">Job ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Attempts</th>
                  <th className="pb-2">Last Error</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {deadLetterJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-secondary">
                    <td className="py-2.5 font-mono text-primary">{job.id}</td>
                    <td className="py-2.5 font-semibold">{job.type}</td>
                    <td className="py-2.5 font-mono text-atlas-warning">{job.attempts}/{job.maxAttempts}</td>
                    <td className="py-2.5 text-atlas-error font-mono max-w-xs truncate">{job.lastError || 'Unknown error'}</td>
                    <td className="py-2.5 text-muted-foreground">{new Date(job.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingId === job.id}
                        className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 font-semibold transition-all"
                      >
                        {retryingId === job.id ? 'Retrying...' : '↻ Re-Queue'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Endpoints Latency & Volume Table */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Top Active API Endpoints</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Track endpoint throughput and latency bottlenecks</p>
          </div>
        </div>

        {overview?.topEndpoints && overview.topEndpoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground font-mono uppercase">
                <tr>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint Path</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Errors</th>
                  <th className="pb-2">Avg Latency</th>
                  <th className="pb-2">P95 Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {overview.topEndpoints.map((ep, idx) => (
                  <tr key={idx} className="hover:bg-secondary">
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        ep.method === 'GET' ? 'bg-atlas-info/10 text-atlas-info' : ep.method === 'POST' ? 'bg-primary/10 text-primary' : 'bg-atlas-warning/10 text-atlas-warning'
                      }`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{ep.path}</td>
                    <td className="py-2.5 font-mono">{ep.totalRequests}</td>
                    <td className="py-2.5 font-mono text-atlas-error">{ep.totalErrors}</td>
                    <td className="py-2.5 font-mono">{ep.avgLatencyMs} ms</td>
                    <td className="py-2.5 font-mono text-atlas-warning">{ep.p95LatencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">No endpoint requests recorded yet.</p>
        )}
      </div>
    </div>
  );
}
