'use client';

import React from 'react';
import type { DemandHeatmapCell } from '@/services/forecasts.service';
import { Flame, Clock } from 'lucide-react';

interface OperationalDemandHeatmapProps {
  matrix: DemandHeatmapCell[][];
}

export function OperationalDemandHeatmap({ matrix }: OperationalDemandHeatmapProps) {
  if (!matrix || matrix.length === 0) return null;

  // Active hours (8 AM to 11 PM)
  const hoursToShow = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  const getCellColor = (intensity: DemandHeatmapCell['intensity']) => {
    switch (intensity) {
      case 'PEAK':
        return 'bg-purple-600/90 text-white font-bold border-purple-500';
      case 'HIGH':
        return 'bg-rose-500/80 text-white font-bold border-rose-400';
      case 'MODERATE':
        return 'bg-amber-500/70 text-black font-semibold border-amber-400';
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-foreground border-border/40';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">7×24 Operational Demand Intensity Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Projected hourly order density across days of the week to guide staffing and kitchen preparedness
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
            <span>Low (&lt;10)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/70 border border-amber-400" />
            <span>Moderate (10-25)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/80 border border-rose-400" />
            <span>High (25-45)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-600/90 border border-purple-500" />
            <span>Peak Rush (&gt;45)</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-[11px] w-28">
                Day of Week
              </th>
              {hoursToShow.map((h) => (
                <th key={h} className="py-2 px-1 text-[10px] font-semibold text-muted-foreground">
                  {h % 12 === 0 ? 12 : h % 12}{h >= 12 ? 'p' : 'a'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {matrix.map((row, dIdx) => (
              <tr key={dIdx} className="hover:bg-muted/20 transition-colors">
                <td className="py-2.5 px-3 text-left font-bold text-foreground text-xs whitespace-nowrap">
                  {row[0]?.dayName}
                </td>
                {hoursToShow.map((h) => {
                  const cell = row.find((c) => c.hour === h) || row[h];
                  const colorClass = getCellColor(cell?.intensity || 'LOW');
                  return (
                    <td key={h} className="p-1">
                      <div
                        title={`${cell?.dayName} at ${cell?.timeLabel}: ~${cell?.predictedOrders} orders (${cell?.intensity} intensity)`}
                        className={`h-8 rounded-lg flex items-center justify-center text-[10px] border transition-transform hover:scale-105 cursor-pointer ${colorClass}`}
                      >
                        {cell?.predictedOrders || 0}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
