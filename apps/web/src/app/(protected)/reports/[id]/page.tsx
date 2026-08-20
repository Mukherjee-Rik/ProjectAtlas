'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  reportsService,
  type CustomReport,
  type ReportExecutionResult,
} from '@/services/reports.service';
import { ReportVisualizer } from '@/components/reports/report-visualizer';
import { ReportScheduleModal } from '@/components/reports/report-schedule-modal';
import {
  ArrowLeft,
  Play,
  Download,
  Clock,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Database,
  Sparkles,
} from 'lucide-react';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<CustomReport | null>(null);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const loadReportAndRun = async () => {
    setLoading(true);
    try {
      const repRes = await reportsService.getReport(reportId);
      setReport(repRes.data);

      setExecuting(true);
      const runRes = await reportsService.runReport(reportId);
      setExecutionResult(runRes.data);
    } catch (err) {
      console.error('Failed to load and execute report:', err);
    } finally {
      setLoading(false);
      setExecuting(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      loadReportAndRun();
    }
  }, [reportId]);

  const handleDuplicate = async () => {
    try {
      const res = await reportsService.duplicateReport(reportId);
      router.push(`/reports/${res.data.id}`);
    } catch (err) {
      console.error('Failed to duplicate report:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this custom report?')) return;
    try {
      await reportsService.deleteReport(reportId);
      router.push('/reports');
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handleExport = () => {
    window.open(`/api/v1/reports/${reportId}/export`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                {report?.dataSource || 'REPORT'}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {report?.name || 'Loading Report...'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {report?.description || 'Custom report definition'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadReportAndRun()}
            disabled={executing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold shadow-xs transition-all"
          >
            <Play className="w-3.5 h-3.5 text-primary" />
            {executing ? 'Executing...' : 'Refresh Data'}
          </button>

          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold shadow-xs transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            Schedule
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleDuplicate}
            title="Duplicate Report"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            title="Delete Report"
            className="p-2 rounded-xl border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Results Visualizer */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-64 rounded-xl bg-card/60 animate-pulse border border-border/50" />
          <div className="h-44 rounded-xl bg-card/60 animate-pulse border border-border/50" />
        </div>
      ) : executionResult ? (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Generated for: <strong className="text-foreground">{executionResult.dateRange.startDate}</strong> to{' '}
              <strong className="text-foreground">{executionResult.dateRange.endDate}</strong> ({executionResult.dateRange.preset})
            </span>
            <span>Generated at: {new Date(executionResult.generatedAt).toLocaleTimeString()}</span>
          </div>

          <ReportVisualizer data={executionResult} />
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
          Report execution failed to return records.
        </div>
      )}

      {/* Schedule Modal */}
      {report && (
        <ReportScheduleModal
          reportId={report.id}
          reportName={report.name}
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={() => alert('Recurring schedule activated successfully!')}
        />
      )}
    </div>
  );
}
