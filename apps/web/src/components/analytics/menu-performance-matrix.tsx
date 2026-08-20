'use client';

import React, { useState } from 'react';
import type { MenuAnalyticsResponse, MenuItemPerformance } from '@/services/analytics.service';
import { Star, TrendingUp, HelpCircle, AlertTriangle } from 'lucide-react';

interface MenuPerformanceMatrixProps {
  data?: MenuAnalyticsResponse['data'];
  isLoading?: boolean;
}

export function MenuPerformanceMatrix({ data, isLoading }: MenuPerformanceMatrixProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'allItems' | 'categories'>('matrix');

  if (isLoading) {
    return <div className="h-96 rounded-xl bg-card/60 animate-pulse border border-border/50" />;
  }

  if (!data) return null;

  const { menuMatrix, topSellingItems, categoryPerformance, allItems } = data;

  const renderMatrixQuadrant = (
    title: string,
    badge: string,
    icon: React.ReactNode,
    items: MenuItemPerformance[],
    desc: string,
    bgColor: string,
  ) => (
    <div className={`p-4 rounded-xl border border-border/70 ${bgColor} flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border">
          {items.length} items
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{desc}</p>

      <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">No items in this quadrant</div>
        ) : (
          items.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-card/90 border border-border/50 rounded-lg p-2.5 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-foreground">{item.name}</div>
                <div className="text-[10px] text-muted-foreground">{item.categoryName} • ₹{item.price}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">₹{item.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-muted-foreground">{item.unitsSold} sold ({item.revenueContributionPercent}%)</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-semibold text-foreground">Menu & Product Intelligence</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            2×2 Boston matrix classifications and category velocity
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'matrix' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            2×2 Profit Matrix
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'categories' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Categories ({categoryPerformance.length})
          </button>
          <button
            onClick={() => setActiveTab('allItems')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'allItems' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Items ({allItems.length})
          </button>
        </div>
      </div>

      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderMatrixQuadrant(
            'Stars',
            'HIGH VOLUME • HIGH REVENUE',
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
            menuMatrix.stars,
            'Top sellers driving highest revenue contribution. Promote prominently.',
            'bg-amber-500/5',
          )}
          {renderMatrixQuadrant(
            'Plowhorses',
            'HIGH VOLUME • LOW REVENUE',
            <TrendingUp className="w-4 h-4 text-blue-500" />,
            menuMatrix.plowhorses,
            'High ordering velocity with modest price points. Consider margin optimization.',
            'bg-blue-500/5',
          )}
          {renderMatrixQuadrant(
            'Puzzles',
            'LOW VOLUME • HIGH REVENUE',
            <HelpCircle className="w-4 h-4 text-purple-500" />,
            menuMatrix.puzzles,
            'High-ticket items with lower unit velocity. Feature in combos/specials.',
            'bg-purple-500/5',
          )}
          {renderMatrixQuadrant(
            'Dogs',
            'LOW VOLUME • LOW REVENUE',
            <AlertTriangle className="w-4 h-4 text-rose-500" />,
            menuMatrix.dogs,
            'Underperforming items. Candidate for menu refresh or price revision.',
            'bg-rose-500/5',
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-3">
          {categoryPerformance.map((cat) => (
            <div
              key={cat.categoryId}
              className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20 text-xs"
            >
              <div>
                <div className="font-bold text-sm text-foreground">{cat.name}</div>
                <div className="text-muted-foreground mt-0.5">
                  {cat.itemsCount} menu items • {cat.unitsSold} total units sold
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-foreground">₹{cat.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="text-primary font-medium text-[11px]">{cat.revenueContributionPercent}% of revenue</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'allItems' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                <th className="pb-3 font-semibold">Item Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Units Sold</th>
                <th className="pb-3 font-semibold">Revenue</th>
                <th className="pb-3 font-semibold">Share</th>
                <th className="pb-3 font-semibold">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {allItems.map((item) => (
                <tr key={item.menuItemId} className="hover:bg-muted/30">
                  <td className="py-3 font-semibold text-foreground">{item.name}</td>
                  <td className="py-3 text-muted-foreground">{item.categoryName}</td>
                  <td className="py-3 font-medium">₹{item.price}</td>
                  <td className="py-3">{item.unitsSold}</td>
                  <td className="py-3 font-semibold text-foreground">₹{item.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-muted-foreground">{item.revenueContributionPercent}%</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted border border-border">
                      {item.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
