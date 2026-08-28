'use client';

import React from 'react';
import type { ForecastExplanation } from '@/services/forecasts.service';
import { HelpCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface ForecastExplainabilityCardProps {
  explanation: ForecastExplanation;
}

export function ForecastExplainabilityCard({ explanation }: ForecastExplainabilityCardProps) {
  const { summaryText, factors, deltaPercentage, predictedSales, comparisonBaselineSales } = explanation;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Why Does Atlas Expect This Forecast?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transparent causal factor decomposition comparing tomorrow's projection against recent baselines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Baseline 7D Avg:</span>
          <strong className="text-xs font-bold text-foreground">₹{comparisonBaselineSales.toLocaleString('en-IN')}</strong>
          <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            deltaPercentage >= 0 ? 'bg-primary/15 text-primary border-primary/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}>
            {deltaPercentage >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {deltaPercentage >= 0 ? '+' : ''}{deltaPercentage}%
          </span>
        </div>
      </div>

      {/* Summary Narrative Banner */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/25 text-xs font-medium text-foreground leading-relaxed">
        {summaryText}
      </div>

      {/* 4 Factor Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {factors.map((f, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-border bg-secondary flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground line-clamp-1">{f.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                f.impactPercentage >= 0 ? 'bg-primary/15 text-primary border-primary/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {f.impactPercentage >= 0 ? '+' : ''}{f.impactPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
