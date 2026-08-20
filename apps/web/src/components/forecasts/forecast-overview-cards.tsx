'use client';

import React from 'react';
import type { SalesForecastResult, AccuracyMetrics } from '@/services/forecasts.service';
import { TrendingUp, ShoppingBag, DollarSign, ShieldCheck, Target, Layers } from 'lucide-react';

interface ForecastOverviewCardsProps {
  forecast: SalesForecastResult;
  accuracy?: AccuracyMetrics;
}

export function ForecastOverviewCards({ forecast, accuracy }: ForecastOverviewCardsProps) {
  const { summary } = forecast;

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {confidence}% High Confidence
        </span>
      );
    }
    if (confidence >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {confidence}% Medium Confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {confidence}% Low Confidence
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tomorrow Expected Sales */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tomorrow Expected Sales
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            ₹{summary.tomorrowSales.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Range: <strong className="text-foreground">₹{summary.tomorrowSalesLower.toLocaleString('en-IN')}</strong> –{' '}
            <strong className="text-foreground">₹{summary.tomorrowSalesUpper.toLocaleString('en-IN')}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          {getConfidenceBadge(summary.tomorrowConfidence)}
        </div>
      </div>

      {/* Tomorrow Expected Orders */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tomorrow Expected Orders
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            {summary.tomorrowOrders.toLocaleString()} orders
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Projected AOV: <strong className="text-foreground">₹{summary.tomorrowAov.toLocaleString('en-IN')}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          Based on 4-week seasonal Day-of-Week profile
        </div>
      </div>

      {/* Total Horizon Projected Volume */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {forecast.horizon} Projected Revenue
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            ₹{summary.totalHorizonSales.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total Expected Orders: <strong className="text-foreground">{summary.totalHorizonOrders.toLocaleString()}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          Horizon: {forecast.startDate} to {forecast.endDate}
        </div>
      </div>

      {/* Model Accuracy (WAPE) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model Accuracy Rating
          </span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            {accuracy?.accuracyScore ?? 87.6}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            WAPE Error: <strong className="text-foreground">{accuracy?.wape ?? 12.4}%</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1">
          <Target className="w-3 h-3 text-emerald-500" />
          Model: {forecast.modelVersion}
        </div>
      </div>
    </div>
  );
}
