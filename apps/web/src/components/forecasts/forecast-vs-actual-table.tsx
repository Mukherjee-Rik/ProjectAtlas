'use client';

import React from 'react';
import type { AccuracyMetrics } from '@/services/forecasts.service';
import { CheckCircle2, AlertTriangle, ShieldCheck, Target } from 'lucide-react';

interface ForecastVsActualTableProps {
  accuracy: AccuracyMetrics;
}

export function ForecastVsActualTable({ accuracy }: ForecastVsActualTableProps) {
  const { comparisonHistory, mae, rmse, wape, accuracyScore, biasSummary, evalPeriod } = accuracy;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground">Forecast vs. Actuals Accuracy Ledger</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical ground-truth evaluation comparing predictions against realized sales
          </p>
        </div>

        {/* Top Summary Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Accuracy Score</div>
            <strong className="text-primary font-bold text-sm">{accuracyScore}%</strong>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">WAPE Error</div>
            <strong className="text-foreground font-bold text-sm">{wape}%</strong>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">MAE</div>
            <strong className="text-primary font-bold text-sm">₹{mae.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Bias Narrative Banner */}
      <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Evaluation Scope: <strong className="text-foreground">{evalPeriod}</strong></span>
        <span className="text-primary font-semibold flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          {biasSummary}
        </span>
      </div>

      {/* Historical Records Table */}
      <div className="table-responsive">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-secondary border-b border-border">
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Date & Day</th>
              <th className="py-3 px-4 font-semibold">Predicted Sales</th>
              <th className="py-3 px-4 font-semibold">Actual Sales</th>
              <th className="py-3 px-4 font-semibold">Absolute Error</th>
              <th className="py-3 px-4 font-semibold">Accuracy</th>
              <th className="py-3 px-4 font-semibold">Bias Direction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisonHistory.map((row, idx) => (
              <tr key={idx} className="hover:bg-secondary transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground">
                  {row.dayName} <span className="font-normal text-muted-foreground text-[11px]">({row.evalDate})</span>
                </td>
                <td className="py-3 px-4 font-bold text-primary">
                  ₹{row.predictedValue.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 font-bold text-foreground">
                  ₹{row.actualValue.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  ₹{row.absoluteError.toLocaleString('en-IN')} ({row.percentageError}%)
                </td>
                <td className="py-3 px-4 font-bold text-primary">
                  {row.accuracy}%
                </td>
                <td className="py-3 px-4">
                  {row.bias === 'OVER_PREDICTED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                      Over-predicted
                    </span>
                  ) : row.bias === 'UNDER_PREDICTED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">
                      Under-predicted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded">
                      Exact
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
