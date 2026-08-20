'use client';

import React from 'react';
import type { ReportExecutionResult } from '@/services/reports.service';

interface ReportVisualizerProps {
  data: ReportExecutionResult;
  className?: string;
}

export function ReportVisualizer({ data, className = '' }: ReportVisualizerProps) {
  const { visualization, columns, rows, summary } = data;
  const visType = visualization?.type || 'TABLE';

  if (!rows || rows.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card/40">
        <p className="text-sm font-semibold text-foreground">No data found</p>
        <p className="text-xs text-muted-foreground mt-1">
          There are no matching operational records for the selected filters and date range.
        </p>
      </div>
    );
  }

  // Helper to format values
  const formatCell = (val: any, unit?: string) => {
    if (typeof val === 'number') {
      if (unit === 'INR') return `₹${val.toLocaleString('en-IN')}`;
      if (unit === 'PERCENT') return `${val}%`;
      return val.toLocaleString();
    }
    return String(val ?? '');
  };

  const primaryMetricCol = columns.find((c) => c.key !== 'dimensionLabel');
  const metricKey = primaryMetricCol?.key || columns[1]?.key;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Cards Renderer */}
      {visType === 'KPI_CARD' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.filter((c) => c.key !== 'dimensionLabel').map((col) => {
            const sumVal = rows.reduce((s, r) => s + (typeof r[col.key] === 'number' ? r[col.key] : 0), 0);
            return (
              <div key={col.key} className="bg-card border border-border rounded-xl p-5 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {formatCell(sumVal, col.unit)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Across {rows.length} {data.dateRange.preset.toLowerCase().replace(/_/g, ' ')} records
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart Renderer */}
      {visType === 'BAR_CHART' && metricKey && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h4 className="text-sm font-bold text-foreground mb-4">{visualization.title || 'Bar Chart Breakdown'}</h4>
          <div className="space-y-3">
            {(() => {
              const maxVal = Math.max(...rows.map((r) => r[metricKey] || 0), 1);
              return rows.map((row, idx) => {
                const val = row[metricKey] || 0;
                const widthPct = Math.max(Math.round((val / maxVal) * 100), 4);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="font-semibold text-foreground">{row.dimensionLabel}</span>
                      <span className="text-muted-foreground">{formatCell(val, primaryMetricCol?.unit)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-primary rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Donut / Share Chart Renderer */}
      {visType === 'DONUT_CHART' && metricKey && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h4 className="text-sm font-bold text-foreground mb-4">{visualization.title || 'Distribution Share'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((row, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-foreground">{row.dimensionLabel}</div>
                  <div className="text-[10px] text-muted-foreground">{primaryMetricCol?.label}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{formatCell(row[metricKey], primaryMetricCol?.unit)}</div>
                  {row.REVENUE_SHARE_PERCENT !== undefined && (
                    <div className="text-primary font-semibold text-[10px]">{row.REVENUE_SHARE_PERCENT}% share</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Table Renderer */}
      {(visType === 'TABLE' || visType === 'LINE_CHART' || visType === 'AREA_CHART' || visType === 'KPI_CARD') && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {visualization.title || `${data.reportName} Data Table`}
            </h4>
            <span className="text-xs text-muted-foreground">{rows.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase text-[10px]">
                  {columns.map((col) => (
                    <th key={col.key} className="py-3 px-4 font-semibold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="py-3 px-4 font-medium">
                        {col.key === 'dimensionLabel' ? (
                          <span className="font-semibold text-foreground">{row.dimensionLabel}</span>
                        ) : (
                          formatCell(row[col.key], col.unit)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
