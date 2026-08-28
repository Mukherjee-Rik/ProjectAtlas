'use client';

import React from 'react';
import type { CustomerCohortResponse } from '@/services/analytics.service';

interface CustomerCohortTableProps {
  data?: CustomerCohortResponse['data'];
  isLoading?: boolean;
}

export function CustomerCohortTable({ data, isLoading }: CustomerCohortTableProps) {
  if (isLoading) {
    return <div className="h-80 rounded-xl bg-card animate-pulse border border-border" />;
  }

  if (!data) return null;

  const { summary, cohortRetentionMatrix } = data;

  const getHeatmapColor = (pct: number) => {
    if (pct >= 70) return 'bg-primary/25 text-primary font-bold border border-primary/30';
    if (pct >= 40) return 'bg-primary/15 text-primary font-semibold border border-primary/20';
    if (pct >= 20) return 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/20';
    if (pct > 0) return 'bg-secondary text-muted-foreground border border-border/40';
    return 'bg-background text-muted-foreground/40';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">Customer Intelligence & Retention Cohorts</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Acquisition cohorts tracked across subsequent months (Month 0 = 100%)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-secondary border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">Total Unique Customers</span>
          <div className="text-xl font-bold text-foreground mt-1">{summary.totalCustomers.toLocaleString()}</div>
        </div>
        <div className="bg-secondary border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">Average Lifetime Value (CLV)</span>
          <div className="text-xl font-bold text-primary mt-1">₹{summary.averageLifetimeValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-secondary border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">Repeat Customer Rate</span>
          <div className="text-xl font-bold text-primary mt-1">{summary.repeatRate}%</div>
        </div>
      </div>

      {/* Cohort Heatmap Table */}
      <div className="table-responsive rounded-xl border border-border bg-card">
        <table className="w-full text-center text-xs border-collapse">
          <thead className="bg-secondary border-b border-border">
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="text-left p-3 font-semibold">Cohort Month</th>
              <th className="p-3 font-semibold">Acquired</th>
              <th className="p-3 font-semibold">M0</th>
              <th className="p-3 font-semibold">M1</th>
              <th className="p-3 font-semibold">M2</th>
              <th className="p-3 font-semibold">M3</th>
              <th className="p-3 font-semibold">M4</th>
              <th className="p-3 font-semibold">M5</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cohortRetentionMatrix.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No customer cohort data recorded yet.
                </td>
              </tr>
            ) : (
              cohortRetentionMatrix.map((row) => (
                <tr key={row.cohortMonth} className="hover:bg-secondary transition-colors">
                  <td className="text-left p-3 font-semibold text-foreground">{row.cohortMonth}</td>
                  <td className="p-3 font-medium text-muted-foreground">{row.newCustomersCount}</td>
                  {row.retentionPercentages.map((pct, idx) => (
                    <td key={idx} className="p-1.5">
                      <div className={`py-1.5 px-2 rounded-lg text-xs transition-colors ${getHeatmapColor(pct)}`}>
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
