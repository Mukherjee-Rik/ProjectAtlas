'use client';

import React from 'react';
import Link from 'next/link';
import { ReportBuilderWizard } from '@/components/reports/report-builder-wizard';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function CreateReportPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Custom Report Builder</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure metrics, groupings, filters, date ranges, and custom chart visualizations
          </p>
        </div>
      </div>

      {/* Main Wizard */}
      <ReportBuilderWizard />
    </div>
  );
}
