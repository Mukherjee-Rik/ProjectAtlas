'use client';

import React from 'react';
import type { HourlyProjectedPoint } from '@/services/forecasts.service';
import { Clock, Flame } from 'lucide-react';

interface PeakHoursForecastProps {
  hourlyPoints: HourlyProjectedPoint[];
}

export function PeakHoursForecast({ hourlyPoints }: PeakHoursForecastProps) {
  if (!hourlyPoints || hourlyPoints.length === 0) return null;

  // Filter operational hours (e.g. 10 AM to 11 PM)
  const activeHours = hourlyPoints.filter((h) => h.hour >= 10 && h.hour <= 23);
  const maxOrders = Math.max(...activeHours.map((h) => h.predictedOrders), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Tomorrow's Peak Hours & Workload Forecast</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hourly order volume predictions to assist with kitchen prep and staffing schedules
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Heat Bar Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {activeHours.map((h) => {
          const heightPct = Math.max(Math.round((h.predictedOrders / maxOrders) * 100), 10);
          return (
            <div
              key={h.hour}
              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                h.isPeak
                  ? 'border-primary/50 bg-primary/10 shadow-xs'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">{h.timeLabel}</span>
                {h.isPeak && <Flame className="w-3.5 h-3.5 text-primary animate-pulse" />}
              </div>

              <div>
                <div className="text-base font-bold text-foreground">{h.predictedOrders}</div>
                <div className="text-[10px] text-muted-foreground">orders expected</div>
              </div>

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  style={{ width: `${heightPct}%` }}
                  className={`h-full rounded-full ${h.isPeak ? 'bg-primary' : 'bg-muted-foreground/60'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
