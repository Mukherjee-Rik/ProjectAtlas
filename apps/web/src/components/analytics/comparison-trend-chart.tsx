'use client';

import React, { useState } from 'react';
import type { TimeSeriesPoint } from '@/services/analytics.service';
import { TrendingUp, BarChart3, LineChart } from 'lucide-react';

interface ComparisonTrendChartProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
}

export function ComparisonTrendChart({ data, isLoading }: ComparisonTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'grossSales' | 'netSales' | 'ordersCount'>('grossSales');
  const [chartType, setChartType] = useState<'bar' | 'area'>('area');

  if (isLoading) {
    return <div className="h-72 rounded-xl bg-card/60 animate-pulse border border-border/50" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
        No time-series points recorded for this period.
      </div>
    );
  }

  const values = data.map((d) => d[activeMetric] || 0);
  const maxVal = Math.max(...values, 100);
  const minVal = 0;
  const totalVal = values.reduce((a, b) => a + b, 0);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 180;
  const paddingX = 30;
  const paddingY = 20;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const points = data.map((pt, idx) => {
    const val = pt[activeMetric] || 0;
    const x = paddingX + (idx / Math.max(data.length - 1, 1)) * usableWidth;
    const y = svgHeight - paddingY - (val / maxVal) * usableHeight;
    return { x, y, val, label: pt.label, date: pt.timestamp };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Performance Trends</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Total: {activeMetric === 'ordersCount' ? `${totalVal} Orders` : `₹${totalVal.toLocaleString('en-IN')}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous timeline rollups across the selected comparison window
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Toggle */}
          <div className="flex items-center p-1 bg-muted/60 rounded-lg text-xs">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'area' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Area Curve"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'bar' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveMetric('grossSales')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeMetric === 'grossSales' ? 'bg-card shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gross Sales
            </button>
            <button
              onClick={() => setActiveMetric('netSales')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeMetric === 'netSales' ? 'bg-card shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Net Revenue
            </button>
            <button
              onClick={() => setActiveMetric('ordersCount')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeMetric === 'ordersCount' ? 'bg-card shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Orders Count
            </button>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="pt-2">
        {chartType === 'area' ? (
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary, #2AFEB7)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--primary, #2AFEB7)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={svgHeight / 2}
                x2={svgWidth - paddingX}
                y2={svgHeight / 2}
                stroke="currentColor"
                className="text-border/40"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Gradient Area */}
              <path d={areaD} fill="url(#trendGradient)" />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--primary, #2AFEB7)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.val > 0 ? 5 : 3}
                    className="fill-background stroke-primary stroke-2 group-hover:r-7 transition-all"
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center px-4 pt-2 text-[10px] text-muted-foreground">
              {data.map((d, idx) => {
                if (idx === 0 || idx === Math.floor(data.length / 2) || idx === data.length - 1 || data.length <= 7) {
                  return (
                    <span key={idx} className="truncate">
                      {d.label}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ) : (
          <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-4">
            {data.map((pt, idx) => {
              const val = pt[activeMetric] || 0;
              const heightPercent = maxVal > 0 ? Math.max(Math.round((val / maxVal) * 100), val > 0 ? 8 : 2) : 2;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs py-1 px-2.5 rounded-lg shadow-lg border border-border pointer-events-none whitespace-nowrap z-20">
                    <div className="font-bold">{pt.label}</div>
                    <div className="text-primary font-semibold">
                      {activeMetric === 'ordersCount' ? `${val} orders` : `₹${val.toLocaleString('en-IN')}`}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                      val > 0
                        ? 'bg-primary group-hover:bg-primary/90 shadow-xs'
                        : 'bg-muted/40'
                    }`}
                  />

                  {/* X Axis Label */}
                  {(idx === 0 || idx === Math.floor(data.length / 2) || idx === data.length - 1 || data.length <= 7) && (
                    <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                      {pt.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
