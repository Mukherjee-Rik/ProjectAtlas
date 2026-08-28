'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  reportsService,
  type CustomReport,
  type ReportTemplate,
} from '@/services/reports.service';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Sparkles,
  Download,
  ArrowRight,
  Clock,
  CheckCircle2,
  Play,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ReportsHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'schedules'>('reports');
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, tmplRes] = await Promise.all([
        reportsService.listReports(),
        reportsService.listTemplates(),
      ]);
      setReports(repRes?.data ?? []);
      setTemplates(tmplRes?.data ?? []);
    } catch (err) {
      console.error('Failed to load reports hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUseTemplate = async (templateId: string) => {
    setCloningId(templateId);
    try {
      const res = await reportsService.useTemplate(templateId);
      router.push(`/reports/${res.data.id}`);
    } catch (err) {
      console.error('Failed to instantiate template:', err);
      setCloningId(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    try {
      await reportsService.duplicateReport(reportId);
      loadData();
    } catch (err) {
      console.error('Failed to duplicate report:', err);
    }
  };

  const handleDelete = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    setDeletingReportId(reportId);
  };

  const executeDeleteReport = async () => {
    if (!deletingReportId) return;
    setIsDeleting(true);
    try {
      await reportsService.deleteReport(deletingReportId);
      setReports((prev) => prev.filter((r) => r.id !== deletingReportId));
      setDeletingReportId(null);
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Custom Reports & Report Builder</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Build, save, schedule, export, and automate custom analytics reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/reports/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background text-xs font-bold shadow-md hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Custom Report
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-xs font-semibold">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Prebuilt Templates ({templates.length})
        </button>
      </div>

      {/* Tab 1: My Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-card animate-pulse border border-border" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-3">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
              <div className="font-bold text-sm text-foreground">No custom reports created yet</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a custom report from scratch or get started immediately with a prebuilt template.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/reports/create"
                  className="px-4 py-2.5 rounded-lg bg-primary text-background text-xs font-bold hover:bg-primary-hover transition-all"
                >
                  Open Report Builder
                </Link>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-xs font-semibold hover:border-primary transition-all"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => router.push(`/reports/${report.id}`)}
                  className="group bg-card hover:bg-secondary border border-border hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                        {report.dataSource}
                      </span>
                      <span className="text-[10px] text-muted-foreground">v{report.version}</span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground mt-2 group-hover:text-primary transition-colors">
                      {report.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {report.description || 'Custom report definition'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDuplicate(e, report.id)}
                        title="Duplicate report"
                        className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, report.id)}
                        title="Delete report"
                        className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-atlas-error hover:border-atlas-error transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-primary font-semibold flex items-center gap-1">
                      Run Report <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Prebuilt Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-bold text-primary">{tmpl.configuration.visualization.type}</span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-2">{tmpl.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tmpl.description}</p>
              </div>

              <div className="pt-3 border-t border-border/60">
                <button
                  onClick={() => handleUseTemplate(tmpl.id)}
                  disabled={cloningId === tmpl.id}
                  className="w-full py-2.5 rounded-lg text-xs font-bold bg-secondary border border-border hover:bg-primary hover:text-background text-foreground transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {cloningId === tmpl.id ? 'Instantiating...' : 'Use This Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmDialog
        open={!!deletingReportId}
        title="Delete Custom Report?"
        description="Are you sure you want to delete this custom report? This action cannot be undone."
        confirmText="Delete Report"
        confirmLoadingText="Deleting..."
        variant="danger"
        isLoading={isDeleting}
        onConfirm={executeDeleteReport}
        onCancel={() => setDeletingReportId(null)}
      />
    </div>
  );
}
