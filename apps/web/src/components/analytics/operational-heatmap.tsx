'use client';

import React from 'react';
import type { DemandMatrixResponse } from '@/services/analytics.service';

interface OperationalHeatmapProps {
  data?: DemandMatrixResponse['data'];
  isLoading?: boolean;
}

export function OperationalHeatmap({ data, isLoading }: OperationalHeatmapProps) {
  if (isLoading) {
    return <div className="h-72 rounded-xl bg-card/60 animate-pulse border border-border/50" />;
  }

  if (!data || data.demandMatrix.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        No operational heatmap data available.
      </div>
    );
  }

  const { demandMatrix, peakHourSummary, totalOrdersSampled } = data;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getCellColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-primary text-primary-foreground';
    if (intensity >= 0.5) return 'bg-primary/70 text-primary-foreground';
    if (intensity >= 0.25) return 'bg-primary/40 text-foreground';
    if (intensity > 0) return 'bg-primary/15 text-foreground';
    return 'bg-muted/40 text-muted-foreground/30';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-semibold text-foreground">7×24 Operational Demand Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Concentration of order volume by day of week and hour of day
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Sampled: <span className="font-semibold text-foreground">{totalOrdersSampled} orders</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
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
                    className={`h-7 rounded text-[10px] font-semibold flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs ${getCellColor(
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

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <span>Low Traffic</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-muted/40" />
          <div className="w-4 h-4 rounded bg-primary/15" />
          <div className="w-4 h-4 rounded bg-primary/40" />
          <div className="w-4 h-4 rounded bg-primary/70" />
          <div className="w-4 h-4 rounded bg-primary" />
        </div>
        <span>Peak Traffic ({peakHourSummary.maxOrdersInSingleHour} orders/hr)</span>
      </div>
    </div>
  );
}
