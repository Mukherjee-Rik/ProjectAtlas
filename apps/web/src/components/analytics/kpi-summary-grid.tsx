'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, DollarSign, ShoppingBag, Users, Percent } from 'lucide-react';
import type { KpiCard } from '@/services/analytics.service';

interface KpiSummaryGridProps {
  kpis: KpiCard[];
  isLoading?: boolean;
  onKpiClick?: (kpiKey: string) => void;
}

export function KpiSummaryGrid({ kpis, isLoading, onKpiClick }: KpiSummaryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-card/60 animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        No KPI metrics available for the selected period.
      </div>
    );
  }

  const formatValue = (val: number, unit: KpiCard['unit']) => {
    if (unit === 'INR') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    if (unit === 'PERCENT') {
      return `${val.toFixed(1)}%`;
    }
    if (unit === 'MINUTES') {
      return `${val} min`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const isPositive = kpi.trend === 'UP';
        const isNegative = kpi.trend === 'DOWN';

        return (
          <div
            key={kpi.key}
            onClick={() => onKpiClick?.(kpi.key)}
            className="group relative bg-card hover:bg-accent/40 border border-border hover:border-primary/40 rounded-xl p-5 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.name}
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
                {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
                <span>
                  {kpi.changePercentage > 0 ? `+${kpi.changePercentage}%` : `${kpi.changePercentage}%`}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {formatValue(kpi.value, kpi.unit)}
              </span>
            </div>

            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>vs prev: {formatValue(kpi.previousValue, kpi.unit)}</span>
              <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Drill down →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
