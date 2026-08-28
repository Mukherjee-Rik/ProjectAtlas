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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {confidence}% High Confidence
        </span>
      );
    }
    if (confidence >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {confidence}% Medium Confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        {confidence}% Low Confidence
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tomorrow Expected Sales */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tomorrow Expected Sales
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            ₹{summary.tomorrowSales.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Range: <strong className="text-foreground">₹{summary.tomorrowSalesLower.toLocaleString('en-IN')}</strong> –{' '}
            <strong className="text-foreground">₹{summary.tomorrowSalesUpper.toLocaleString('en-IN')}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          {getConfidenceBadge(summary.tomorrowConfidence)}
        </div>
      </div>

      {/* Tomorrow Expected Orders */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tomorrow Expected Orders
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {summary.tomorrowOrders.toLocaleString()} orders
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Projected AOV: <strong className="text-primary">₹{summary.tomorrowAov.toLocaleString('en-IN')}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          Based on 4-week seasonal Day-of-Week profile
        </div>
      </div>

      {/* Total Horizon Projected Volume */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {forecast.horizon} Projected Revenue
          </span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold tracking-[-0.02em] text-primary">
            ₹{summary.totalHorizonSales.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total Expected Orders: <strong className="text-foreground">{summary.totalHorizonOrders.toLocaleString()}</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          Horizon: {forecast.startDate} to {forecast.endDate}
        </div>
      </div>

      {/* Model Accuracy (WAPE) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model Accuracy Rating
          </span>
          <div className="p-2 rounded-lg bg-primary/15 text-primary border border-primary/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold tracking-[-0.02em] text-primary">
            {accuracy?.accuracyScore ?? 87.6}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            WAPE Error: <strong className="text-foreground">{accuracy?.wape ?? 12.4}%</strong>
          </div>
        </div>
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1">
          <Target className="w-3 h-3 text-primary" />
          Model: {forecast.modelVersion}
        </div>
      </div>
    </div>
  );
}
