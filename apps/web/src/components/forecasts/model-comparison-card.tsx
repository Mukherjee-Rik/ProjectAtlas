'use client';

import React from 'react';
import type { ModelBenchmarkResult } from '@/services/forecasts.service';
import { Award, Cpu, CheckCircle2 } from 'lucide-react';

interface ModelComparisonCardProps {
  benchmarks: ModelBenchmarkResult[];
}

export function ModelComparisonCard({ benchmarks }: ModelComparisonCardProps) {
  if (!benchmarks || benchmarks.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Forecasting Model Registry & Benchmark</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated backtest evaluation designating the champion forecasting model
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {benchmarks.map((m) => (
          <div
            key={m.modelId}
            className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
              m.isChampion
                ? 'border-primary bg-primary/5 shadow-xs'
                : 'border-border bg-card'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {m.type}
                </span>
                {m.isChampion && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    <Award className="w-3.5 h-3.5" />
                    Champion Model
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-foreground mt-2">{m.modelName}</h4>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accuracy:</span>
                <strong className="text-emerald-600 font-bold">{m.accuracyScore}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WAPE Error:</span>
                <strong className="text-foreground font-semibold">{m.wape}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAE:</span>
                <strong className="text-foreground font-semibold">₹{m.mae.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Bias:</span>
                <strong className="text-foreground font-semibold">{m.bias >= 0 ? '+' : ''}₹{m.bias.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
