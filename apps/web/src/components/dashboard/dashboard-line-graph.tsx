'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, Activity, DollarSign, ShoppingBag } from 'lucide-react';

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface DashboardLineGraphProps {
  data?: SalesTrendPoint[];
  isLoading?: boolean;
  className?: string;
}

type MetricType = 'sales' | 'orders' | 'aov';
type ChartType = 'line' | 'bar';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function DashboardLineGraph({
  data = [],
  isLoading = false,
  className = '',
}: DashboardLineGraphProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metric, setMetric] = useState<MetricType>('sales');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Derive metric values
  const points = useMemo(() => {
    return data.map((d, index) => {
      const sales = Number(d.sales || 0);
      const orders = Number(d.orders || 0);
      const aov = orders > 0 ? Math.round(sales / orders) : 0;
      let val = sales;
      if (metric === 'orders') val = orders;
      if (metric === 'aov') val = aov;

      return {
        index,
        date: d.date,
        sales,
        orders,
        aov,
        value: val,
      };
    });
  }, [data, metric]);

  const maxValue = useMemo(() => {
    if (points.length === 0) return 100;
    const max = Math.max(...points.map((p) => p.value));
    return max > 0 ? max : 100;
  }, [points]);

  // SVG Dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 45;
  const padRight = 20;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Compute (x, y) coordinates for each point
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth / 2;

    return points.map((p, i) => {
      const x = padLeft + (points.length > 1 ? i * stepX : chartWidth / 2);
      const yFraction = maxValue > 0 ? p.value / maxValue : 0;
      const y = padTop + chartHeight - yFraction * chartHeight;
      return { ...p, x, y };
    });
  }, [points, maxValue, chartWidth, chartHeight, padLeft, padTop]);

  // Smooth Catmull-Rom to Cubic Bézier SVG path
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: '', areaPath: '' };
    if (coords.length === 1) {
      const p = coords[0];
      return {
        linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${padTop + chartHeight} L ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${padTop + chartHeight} Z`,
      };
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    const tension = 0.2;

    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 >= coords.length ? coords.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const groundY = padTop + chartHeight;
    const area = `${d} L ${lastX.toFixed(1)} ${groundY} L ${firstX.toFixed(1)} ${groundY} Z`;

    return { linePath: d, areaPath: area };
  }, [coords, chartHeight, padTop]);

  // Y-axis ticks (3 tiers: max, 50%, 0)
  const yTicks = useMemo(() => {
    return [
      { val: maxValue, y: padTop },
      { val: Math.round(maxValue / 2), y: padTop + chartHeight / 2 },
      { val: 0, y: padTop + chartHeight },
    ];
  }, [maxValue, padTop, chartHeight]);

  const hoveredPoint = hoveredIdx !== null && coords[hoveredIdx] ? coords[hoveredIdx] : null;

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-5 space-y-4 ${className}`}>
        <div className="h-6 w-48 bg-muted/40 animate-pulse rounded" />
        <div className="h-52 w-full bg-muted/20 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm ${className}`}>
      {/* Header Controls: Metric Selector & Chart Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">Performance Trend</h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <TrendingUp className="h-3 w-3" />
              Last 30 Days
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {metric === 'sales' && 'Daily gross revenue earned across all tables'}
            {metric === 'orders' && 'Total customer orders processed per day'}
            {metric === 'aov' && 'Average check ticket value per completed order'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Chips */}
          <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMetric('sales')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                metric === 'sales'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-3 w-3" />
              <span>Revenue</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('orders')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                metric === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag className="h-3 w-3" />
              <span>Orders</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('aov')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                metric === 'aov'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3 w-3" />
              <span>AOV</span>
            </button>
          </div>

          {/* Chart Type Toggle: Line vs Bar */}
          <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`rounded-md p-1.5 transition-all ${
                chartType === 'line'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className={`rounded-md p-1.5 transition-all ${
                chartType === 'bar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full select-none">
        {coords.length === 0 ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            No sales trend data available for this range.
          </div>
        ) : (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 sm:h-64 overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                {/* Gradient for smooth line area fill */}
                <linearGradient id="kafeiTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                {/* Subtle vertical bar gradient */}
                <linearGradient id="kafeiBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                </linearGradient>

                <linearGradient id="kafeiBarHoverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines and Y-axis labels */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={svgWidth - padRight}
                    y2={tick.y}
                    stroke="currentColor"
                    className="text-border/40"
                    strokeDasharray={i === 2 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={tick.y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] font-mono select-none"
                  >
                    {metric === 'orders'
                      ? tick.val
                      : `₹${tick.val >= 1000 ? `${(tick.val / 1000).toFixed(tick.val % 1000 === 0 ? 0 : 1)}k` : tick.val}`}
                  </text>
                </g>
              ))}

              {/* BAR CHART VIEW */}
              {chartType === 'bar' && (
                <g>
                  {coords.map((p, idx) => {
                    const barWidth = Math.max(
                      4,
                      Math.min(22, (chartWidth / coords.length) * 0.65)
                    );
                    const barHeight = Math.max(2, padTop + chartHeight - p.y);
                    const barX = p.x - barWidth / 2;
                    const barY = padTop + chartHeight - barHeight;
                    const isHovered = hoveredIdx === idx;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-opacity"
                        onMouseEnter={() => setHoveredIdx(idx)}
                      >
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          rx={3}
                          fill={isHovered ? 'url(#kafeiBarHoverGradient)' : 'url(#kafeiBarGradient)'}
                          className="transition-all duration-150"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* LINE CHART VIEW */}
              {chartType === 'line' && (
                <g>
                  {/* Area fill */}
                  <path d={areaPath} fill="url(#kafeiTrendGradient)" />

                  {/* Stroke Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Vertical Guide Line on Hover */}
                  {hoveredPoint && (
                    <line
                      x1={hoveredPoint.x}
                      y1={padTop}
                      x2={hoveredPoint.x}
                      y2={padTop + chartHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-70"
                    />
                  )}

                  {/* Data Points */}
                  {coords.map((p, idx) => {
                    const isHovered = hoveredIdx === idx;
                    const showDot = coords.length <= 15 || isHovered;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                      >
                        {/* Invisible large hit area */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={12}
                          fill="transparent"
                        />
                        {showDot && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 5.5 : 3.5}
                            fill={isHovered ? '#10b981' : '#047857'}
                            stroke="#ffffff"
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            className="transition-transform duration-150"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* X-axis Date Labels */}
              <g>
                {coords.map((p, idx) => {
                  const step = Math.max(1, Math.floor(coords.length / 5));
                  const isKeyTick = idx === 0 || idx === coords.length - 1 || idx % step === 0;

                  if (!isKeyTick) return null;

                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={svgHeight - 8}
                      textAnchor={idx === 0 ? 'start' : idx === coords.length - 1 ? 'end' : 'middle'}
                      className="fill-muted-foreground text-[10px] select-none"
                    >
                      {formatDateLabel(p.date)}
                    </text>
                  );
                })}
              </g>
            </svg>

            {/* Interactive Floating Hover Card */}
            {hoveredPoint && (
              <div
                className="pointer-events-none absolute z-30 transform -translate-x-1/2 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1 transition-all"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: '10px',
                }}
              >
                <div className="font-semibold text-foreground flex items-center justify-between gap-3 border-b border-border pb-1">
                  <span>{formatDateLabel(hoveredPoint.date)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{hoveredPoint.date}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[11px]">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-bold text-primary text-right">{formatCurrency(hoveredPoint.sales)}</span>
                  <span className="text-muted-foreground">Orders:</span>
                  <span className="font-semibold text-foreground text-right">{hoveredPoint.orders}</span>
                  <span className="text-muted-foreground">AOV:</span>
                  <span className="font-semibold text-foreground text-right">{formatCurrency(hoveredPoint.aov)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Footer Tickers */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>
            Total Revenue:{' '}
            <span className="font-bold text-foreground">
              {formatCurrency(points.reduce((acc, p) => acc + p.sales, 0))}
            </span>
          </div>
          <div>
            Total Orders:{' '}
            <span className="font-bold text-foreground">
              {points.reduce((acc, p) => acc + p.orders, 0)}
            </span>
          </div>
        </div>
        <div>
          Period Avg AOV:{' '}
          <span className="font-bold text-primary">
            {formatCurrency(
              (() => {
                const totSales = points.reduce((acc, p) => acc + p.sales, 0);
                const totOrders = points.reduce((acc, p) => acc + p.orders, 0);
                return totOrders > 0 ? Math.round(totSales / totOrders) : 0;
              })()
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
