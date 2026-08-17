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
        <div className="h-6 w-6 border-2 border-[#2AFEB7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHealthy = overview?.status === 'HEALTHY';

  return (
    <div className="space-y-6">
      {/* Header with live refresh toggle */}
      <div className="flex items-center justify-between border-b border-[#26313C] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#F5F7FA]">Production Infrastructure & Telemetry</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {isHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}
            </span>
          </div>
          <p className="text-xs text-[#9AA6B2] mt-1">
            Real-time latency percentiles, database probes, background queue states, and error tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-[#2AFEB7]/10 text-[#2AFEB7] border-[#2AFEB7]/30 hover:bg-[#2AFEB7]/20'
                : 'bg-[#18212B] text-[#9AA6B2] border-[#26313C] hover:text-[#F5F7FA]'
            }`}
          >
            {autoRefresh ? '● Live Refresh (5s)' : '○ Paused'}
          </button>
          <button
            type="button"
            onClick={fetchMonitoringData}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-xs text-[#F5F7FA] hover:bg-[#26313C] transition-colors"
          >
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* Component Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9AA6B2]">API Gateway</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xl font-bold text-[#F5F7FA] mt-2">HTTP / Express</p>
          <p className="text-xs text-emerald-400 mt-1 font-mono">Uptime: {formatUptime(overview?.telemetry?.uptimeSeconds || 0)}</p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9AA6B2]">PostgreSQL Database</span>
            <span className={`h-2 w-2 rounded-full ${overview?.components?.database?.status === 'UP' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
          <p className="text-xl font-bold text-[#F5F7FA] mt-2">Prisma ORM</p>
          <p className="text-xs text-emerald-400 mt-1 font-mono">
            Latency: {overview?.components?.database?.latencyMs ?? 0} ms (UP)
          </p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9AA6B2]">Background Queue</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xl font-bold text-[#F5F7FA] mt-2">Async Engine</p>
          <p className="text-xs text-[#2AFEB7] mt-1 font-mono">
            {overview?.queue?.active || 0} active • {overview?.queue?.waiting || 0} waiting
          </p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9AA6B2]">Memory Footprint</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xl font-bold text-[#F5F7FA] mt-2">{overview?.telemetry?.memory?.heapUsedMb ?? 0} MB</p>
          <p className="text-xs text-[#9AA6B2] mt-1 font-mono">
            RSS: {overview?.telemetry?.memory?.rssMb ?? 0} MB
          </p>
        </div>
      </div>

      {/* Latency Percentiles & Throughput Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latency Percentiles */}
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Latency Percentiles</h3>
            <span className="text-xs font-mono text-[#9AA6B2]">Rolling Samples</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#18212B] p-3 text-center border border-[#26313C]">
              <span className="text-[10px] font-mono text-[#9AA6B2] uppercase">P50 (Median)</span>
              <p className="text-lg font-bold text-[#2AFEB7] mt-1">{overview?.telemetry?.latencyMs?.p50 ?? 0} ms</p>
            </div>
            <div className="rounded-lg bg-[#18212B] p-3 text-center border border-[#26313C]">
              <span className="text-[10px] font-mono text-[#9AA6B2] uppercase">P95</span>
              <p className="text-lg font-bold text-amber-400 mt-1">{overview?.telemetry?.latencyMs?.p95 ?? 0} ms</p>
            </div>
            <div className="rounded-lg bg-[#18212B] p-3 text-center border border-[#26313C]">
              <span className="text-[10px] font-mono text-[#9AA6B2] uppercase">P99</span>
              <p className="text-lg font-bold text-red-400 mt-1">{overview?.telemetry?.latencyMs?.p99 ?? 0} ms</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#26313C] flex items-center justify-between text-xs text-[#9AA6B2]">
            <span>Average API Latency</span>
            <span className="font-mono text-[#F5F7FA] font-semibold">{overview?.telemetry?.latencyMs?.avg ?? 0} ms</span>
          </div>
        </div>

        {/* Throughput & Volume */}
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Throughput & Traffic</h3>
            <span className="text-xs font-mono text-[#9AA6B2]">Live Rate</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9AA6B2]">Requests per Minute</span>
              <span className="font-mono text-sm font-bold text-[#F5F7FA]">{overview?.telemetry?.throughput?.requestsPerMinute ?? 0} req/min</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9AA6B2]">Total Handled Requests</span>
              <span className="font-mono text-sm font-bold text-[#2AFEB7]">
                {(overview?.telemetry?.throughput?.totalRequests ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9AA6B2]">Error Rate</span>
              <span className={`font-mono text-sm font-bold ${(overview?.telemetry?.errors?.errorRatePercent ?? 0) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                {overview?.telemetry?.errors?.errorRatePercent ?? '0.00'}%
              </span>
            </div>
          </div>
        </div>

        {/* Queue States */}
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Queue Engine Lifecycle</h3>
            <span className="text-xs font-mono text-[#9AA6B2]">{overview?.queue?.totalJobs ?? 0} Jobs</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-[#18212B] p-2.5 border border-[#26313C]">
              <span className="text-[#9AA6B2]">Completed</span>
              <p className="text-base font-bold text-emerald-400 mt-0.5">{overview?.queue?.completed ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#18212B] p-2.5 border border-[#26313C]">
              <span className="text-[#9AA6B2]">Active / Running</span>
              <p className="text-base font-bold text-[#2AFEB7] mt-0.5">{overview?.queue?.active ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#18212B] p-2.5 border border-[#26313C]">
              <span className="text-[#9AA6B2]">Waiting</span>
              <p className="text-base font-bold text-amber-400 mt-0.5">{overview?.queue?.waiting ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#18212B] p-2.5 border border-[#26313C]">
              <span className="text-[#9AA6B2]">Dead Letter / Failed</span>
              <p className="text-base font-bold text-red-400 mt-0.5">{overview?.queue?.deadLetter ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dead Letter Queue Table */}
      <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Dead-Letter & Failed Background Jobs</h3>
            <p className="text-xs text-[#9AA6B2] mt-0.5">Jobs that exceeded max retries with exponential backoff</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded bg-[#18212B] text-[#9AA6B2] border border-[#26313C]">
            {deadLetterJobs.length} Failed Job(s)
          </span>
        </div>

        {deadLetterJobs.length === 0 ? (
          <div className="rounded-lg border border-[#26313C] bg-[#18212B]/40 p-8 text-center">
            <p className="text-sm text-emerald-400 font-semibold">✓ No Failed Jobs in Dead-Letter Queue</p>
            <p className="text-xs text-[#9AA6B2] mt-1">All background tasks and automation jobs are succeeding normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#26313C] text-[#9AA6B2] font-mono uppercase">
                <tr>
                  <th className="pb-2">Job ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Attempts</th>
                  <th className="pb-2">Last Error</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26313C]/60 text-[#F5F7FA]">
                {deadLetterJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#18212B]">
                    <td className="py-2.5 font-mono text-[#2AFEB7]">{job.id}</td>
                    <td className="py-2.5 font-semibold">{job.type}</td>
                    <td className="py-2.5 font-mono text-amber-400">{job.attempts}/{job.maxAttempts}</td>
                    <td className="py-2.5 text-red-400 font-mono max-w-xs truncate">{job.lastError || 'Unknown error'}</td>
                    <td className="py-2.5 text-[#9AA6B2]">{new Date(job.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingId === job.id}
                        className="px-2.5 py-1 rounded bg-[#2AFEB7]/10 text-[#2AFEB7] hover:bg-[#2AFEB7]/20 border border-[#2AFEB7]/30 font-semibold transition-all"
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
      <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Top Active API Endpoints</h3>
            <p className="text-xs text-[#9AA6B2] mt-0.5">Track endpoint throughput and latency bottlenecks</p>
          </div>
        </div>

        {overview?.topEndpoints && overview.topEndpoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#26313C] text-[#9AA6B2] font-mono uppercase">
                <tr>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint Path</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Errors</th>
                  <th className="pb-2">Avg Latency</th>
                  <th className="pb-2">P95 Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26313C]/60 text-[#F5F7FA]">
                {overview.topEndpoints.map((ep, idx) => (
                  <tr key={idx} className="hover:bg-[#18212B]">
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{ep.path}</td>
                    <td className="py-2.5 font-mono">{ep.totalRequests}</td>
                    <td className="py-2.5 font-mono text-red-400">{ep.totalErrors}</td>
                    <td className="py-2.5 font-mono">{ep.avgLatencyMs} ms</td>
                    <td className="py-2.5 font-mono text-amber-400">{ep.p95LatencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[#9AA6B2] py-4 text-center">No endpoint requests recorded yet.</p>
        )}
      </div>
    </div>
  );
}
