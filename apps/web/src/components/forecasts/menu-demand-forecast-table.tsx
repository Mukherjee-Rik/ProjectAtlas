'use client';

import React from 'react';
import type { ItemDemandForecast } from '@/services/forecasts.service';
import { Utensils, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MenuDemandForecastTableProps {
  demandList: ItemDemandForecast[];
}

export function MenuDemandForecastTable({ demandList }: MenuDemandForecastTableProps) {
  if (!demandList || demandList.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
        No item demand history recorded yet for item-level forecasting.
      </div>
    );
  }

  const getTrendBadge = (trend: ItemDemandForecast['trend']) => {
    if (trend === 'INCREASING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded">
          <TrendingUp className="w-3 h-3" />
          Rising Demand
        </span>
      );
    }
    if (trend === 'DECREASING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
          <TrendingDown className="w-3 h-3" />
          Softening
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded">
        <Minus className="w-3 h-3" />
        Stable
      </span>
    );
  };

  return (
    <div className="table-responsive rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border bg-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tomorrow's Menu Demand & Portion Forecast</h3>
        </div>
        <span className="text-xs text-muted-foreground">{demandList.length} items evaluated</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-secondary border-b border-border">
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Dish Name</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Expected Portions</th>
              <th className="py-3 px-4 font-semibold">Likely Range</th>
              <th className="py-3 px-4 font-semibold">Projected Revenue</th>
              <th className="py-3 px-4 font-semibold">Demand Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {demandList.slice(0, 10).map((item) => (
              <tr key={item.menuItemId} className="hover:bg-secondary transition-colors">
                <td className="py-3 px-4 font-bold text-foreground">
                  {item.name}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {item.category}
                </td>
                <td className="py-3 px-4 font-bold text-primary">
                  {item.predictedPortionsTomorrow} portions
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {item.portionRangeLower} – {item.portionRangeUpper}
                </td>
                <td className="py-3 px-4 font-semibold text-foreground">
                  ₹{item.predictedRevenueTomorrow.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4">
                  {getTrendBadge(item.trend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
