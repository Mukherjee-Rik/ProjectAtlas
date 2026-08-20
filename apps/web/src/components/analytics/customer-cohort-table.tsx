'use client';

import React from 'react';
import type { CustomerCohortResponse } from '@/services/analytics.service';

interface CustomerCohortTableProps {
  data?: CustomerCohortResponse['data'];
  isLoading?: boolean;
}

export function CustomerCohortTable({ data, isLoading }: CustomerCohortTableProps) {
  if (isLoading) {
    return <div className="h-80 rounded-xl bg-card/60 animate-pulse border border-border/50" />;
  }

  if (!data) return null;

  const { summary, segmentation, cohortRetentionMatrix } = data;

  const getHeatmapColor = (pct: number) => {
    if (pct >= 70) return 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold';
    if (pct >= 40) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold';
    if (pct >= 20) return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    if (pct > 0) return 'bg-muted/60 text-muted-foreground';
    return 'bg-muted/20 text-muted-foreground/40';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Customer Intelligence & Retention Cohorts</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Acquisition cohorts tracked across subsequent months (Month 0 = 100%)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Total Unique Customers</span>
          <div className="text-xl font-bold text-foreground mt-1">{summary.totalCustomers.toLocaleString()}</div>
        </div>
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Average Lifetime Value (CLV)</span>
          <div className="text-xl font-bold text-foreground mt-1">₹{summary.averageLifetimeValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Repeat Customer Rate</span>
          <div className="text-xl font-bold text-emerald-500 mt-1">{summary.repeatRate}%</div>
        </div>
      </div>

      {/* Cohort Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
              <th className="text-left py-2.5 font-semibold">Cohort Month</th>
              <th className="py-2.5 font-semibold">Acquired</th>
              <th className="py-2.5 font-semibold">M0</th>
              <th className="py-2.5 font-semibold">M1</th>
              <th className="py-2.5 font-semibold">M2</th>
              <th className="py-2.5 font-semibold">M3</th>
              <th className="py-2.5 font-semibold">M4</th>
              <th className="py-2.5 font-semibold">M5</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {cohortRetentionMatrix.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No customer cohort data recorded yet.
                </td>
              </tr>
            ) : (
              cohortRetentionMatrix.map((row) => (
                <tr key={row.cohortMonth} className="hover:bg-muted/20">
                  <td className="text-left py-3 font-semibold text-foreground">{row.cohortMonth}</td>
                  <td className="py-3 font-medium text-muted-foreground">{row.newCustomersCount}</td>
                  {row.retentionPercentages.map((pct, idx) => (
                    <td key={idx} className="p-1">
                      <div className={`py-1.5 px-2 rounded text-xs transition-colors ${getHeatmapColor(pct)}`}>
                        {pct > 0 ? `${pct}%` : '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
