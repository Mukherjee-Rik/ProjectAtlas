'use client';

import React from 'react';
import type { MealPeriodForecast, ChannelForecast } from '@/services/forecasts.service';
import { Sun, Utensils, Coffee, Moon, ShoppingBag, Truck, Store, Globe } from 'lucide-react';

interface MealPeriodChannelForecastProps {
  mealPeriods: MealPeriodForecast[];
  channels: ChannelForecast[];
}

export function MealPeriodChannelForecast({ mealPeriods, channels }: MealPeriodChannelForecastProps) {
  const getPeriodIcon = (periodId: string) => {
    switch (periodId) {
      case 'BREAKFAST': return <Sun className="w-4 h-4 text-amber-500" />;
      case 'LUNCH': return <Utensils className="w-4 h-4 text-primary" />;
      case 'AFTERNOON': return <Coffee className="w-4 h-4 text-orange-500" />;
      case 'DINNER':
      default: return <Moon className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getChannelIcon = (channelId: string) => {
    switch (channelId) {
      case 'DINE_IN': return <Store className="w-4 h-4 text-primary" />;
      case 'TAKEOUT': return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'DELIVERY': return <Truck className="w-4 h-4 text-amber-500" />;
      case 'ONLINE':
      default: return <Globe className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Meal Periods Box */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Meal Period Demand Projections</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Forecasted revenue and order load split across operational shifts
            </p>
          </div>
        </div>

        <div className="space-y-3.5 pt-1">
          {mealPeriods.map((mp) => (
            <div key={mp.periodId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted/60">
                    {getPeriodIcon(mp.periodId)}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{mp.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-1.5">({mp.timeRange})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">₹{mp.predictedSales.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground text-[11px] ml-1.5">({mp.predictedOrders} orders)</span>
                </div>
              </div>

              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(mp.sharePercentage, 3)}%` }}
                  className="h-full bg-primary rounded-full transition-all duration-500"
                />
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                {mp.sharePercentage}% of daily volume
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Channels Box */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Sales Channel Projections</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expected revenue split across Dine-In, Takeaway, Delivery, and Online
            </p>
          </div>
        </div>

        <div className="space-y-3.5 pt-1">
          {channels.map((ch) => (
            <div key={ch.channelId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted/60">
                    {getChannelIcon(ch.channelId)}
                  </div>
                  <span className="font-bold text-foreground">{ch.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">₹{ch.predictedSales.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground text-[11px] ml-1.5">({ch.predictedOrders} orders)</span>
                </div>
              </div>

              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(ch.sharePercentage, 3)}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                {ch.sharePercentage}% of total sales
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
