'use client';

import React from 'react';
import Link from 'next/link';
import { ReportBuilderWizard } from '@/components/reports/report-builder-wizard';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function CreateReportPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="p-2 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-primary transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Custom Report Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure metrics, groupings, filters, date ranges, and custom chart visualizations.
          </p>
        </div>
      </div>

      {/* Main Wizard */}
      <ReportBuilderWizard />
    </div>
  );
}
