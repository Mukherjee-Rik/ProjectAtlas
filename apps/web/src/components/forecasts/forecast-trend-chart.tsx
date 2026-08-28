'use client';

import React from 'react';
import type { ProjectedPoint } from '@/services/forecasts.service';
import { Calendar, TrendingUp } from 'lucide-react';

interface ForecastTrendChartProps {
  projections: ProjectedPoint[];
  horizon: string;
}

export function ForecastTrendChart({ projections, horizon }: ForecastTrendChartProps) {
  if (!projections || projections.length === 0) return null;

  const maxVal = Math.max(...projections.map((p) => p.upperBoundSales), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Revenue Projection Curve & Prediction Bands</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expected daily sales with 90% confidence intervals (Lower – Upper Bounds)
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30">
          {horizon} Forecast
        </span>
      </div>

      {/* Visual Bar Matrix */}
      <div className="space-y-3 pt-2">
        {projections.map((p) => {
          const expectedPct = Math.round((p.predictedSales / maxVal) * 100);
          const lowerPct = Math.round((p.lowerBoundSales / maxVal) * 100);
          const upperPct = Math.round((p.upperBoundSales / maxVal) * 100);

          return (
            <div key={p.date} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{p.dayName}</span>
                  <span className="text-muted-foreground text-[11px]">({p.date})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-[11px]">
                    Range: ₹{p.lowerBoundSales.toLocaleString('en-IN')} – ₹{p.upperBoundSales.toLocaleString('en-IN')}
                  </span>
                  <strong className="text-primary font-bold">
                    ₹{p.predictedSales.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Range & Value Progress Meter */}
              <div className="h-3 w-full bg-secondary rounded-full relative overflow-hidden flex items-center border border-border/50">
                {/* Confidence band background */}
                <div
                  style={{
                    left: `${lowerPct}%`,
                    width: `${Math.max(upperPct - lowerPct, 4)}%`,
                  }}
                  className="absolute h-full bg-primary/25 rounded-full"
                />
                {/* Expected point pill */}
                <div
                  style={{
                    width: `${Math.max(expectedPct, 4)}%`,
                  }}
                  className="h-full bg-primary rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Projections Data Table */}
      <div className="table-responsive pt-4 border-t border-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-secondary border-b border-border">
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3.5 font-semibold">Date & Day</th>
              <th className="py-3 px-3.5 font-semibold">Expected Sales</th>
              <th className="py-3 px-3.5 font-semibold">Prediction Range</th>
              <th className="py-3 px-3.5 font-semibold">Expected Orders</th>
              <th className="py-3 px-3.5 font-semibold">Projected AOV</th>
              <th className="py-3 px-3.5 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projections.map((p) => (
              <tr key={p.date} className="hover:bg-secondary transition-colors">
                <td className="py-3 px-3.5 font-semibold text-foreground">
                  {p.dayName} <span className="font-normal text-muted-foreground text-[11px]">({p.date})</span>
                </td>
                <td className="py-3 px-3.5 font-bold text-primary">
                  ₹{p.predictedSales.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3.5 text-muted-foreground">
                  ₹{p.lowerBoundSales.toLocaleString('en-IN')} – ₹{p.upperBoundSales.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3.5 font-medium text-foreground">
                  {p.predictedOrders} orders
                </td>
                <td className="py-3 px-3.5 font-medium text-foreground">
                  ₹{p.predictedAov.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3.5">
                  <span className="font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded text-[10px]">
                    {p.confidence}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
