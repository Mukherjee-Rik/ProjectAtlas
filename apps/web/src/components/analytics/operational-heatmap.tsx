'use client';

import React from 'react';
import type { DemandMatrixResponse } from '@/services/analytics.service';

interface OperationalHeatmapProps {
  data?: DemandMatrixResponse['data'];
  isLoading?: boolean;
}

export function OperationalHeatmap({ data, isLoading }: OperationalHeatmapProps) {
  if (isLoading) {
    return <div className="h-72 rounded-xl bg-card animate-pulse border border-border" />;
  }

  if (!data || data.demandMatrix.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card">
        No operational heatmap data available.
      </div>
    );
  }

  const { demandMatrix, peakHourSummary, totalOrdersSampled } = data;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getCellColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-primary text-background font-bold shadow-sm';
    if (intensity >= 0.5) return 'bg-primary/70 text-background font-semibold';
    if (intensity >= 0.25) return 'bg-primary/40 text-foreground';
    if (intensity > 0) return 'bg-primary/15 text-primary border border-primary/25';
    return 'bg-secondary text-muted-foreground/30';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground">7×24 Operational Demand Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Concentration of order volume by day of week and hour of day
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Sampled: <span className="font-semibold text-primary">{totalOrdersSampled} orders</span>
        </div>
      </div>

      <div className="table-responsive pb-2">
        <div className="min-w-[700px] space-y-1.5">
          {/* Header Hours */}
          <div className="grid grid-cols-25 gap-1 text-[10px] text-muted-foreground text-center font-medium">
            <div className="text-left font-bold text-foreground">Day</div>
            {hours.map((h) => (
              <div key={h} className="truncate">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {days.map((dayName, dIdx) => (
            <div key={dayName} className="grid grid-cols-25 gap-1 items-center">
              <div className="text-xs font-semibold text-foreground text-left">{dayName}</div>
              {hours.map((h) => {
                const cell = demandMatrix.find((c) => c.dayOfWeek === dIdx && c.hour === h);
                const intensity = cell?.intensity || 0;
                const count = cell?.orderCount || 0;
                const vol = cell?.totalVolume || 0;

                return (
                  <div
                    key={h}
                    title={`${dayName} @ ${h}:00 - ${count} orders (₹${vol.toLocaleString('en-IN')})`}
                    className={`h-7 rounded text-[10px] font-semibold flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${getCellColor(
                      intensity,
                    )}`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
        <span>Low Traffic</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-secondary" />
          <div className="w-4 h-4 rounded bg-primary/15 border border-primary/25" />
          <div className="w-4 h-4 rounded bg-primary/40" />
          <div className="w-4 h-4 rounded bg-primary/70" />
          <div className="w-4 h-4 rounded bg-primary" />
        </div>
        <span>Peak Traffic ({peakHourSummary.maxOrdersInSingleHour} orders/hr)</span>
      </div>
    </div>
  );
}
