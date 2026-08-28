'use client';

import React from 'react';
import type { RevenueAnalyticsResponse } from '@/services/analytics.service';

interface RevenueAnalyticsViewProps {
  data?: RevenueAnalyticsResponse['data'];
  isLoading?: boolean;
}

export function RevenueAnalyticsView({ data, isLoading }: RevenueAnalyticsViewProps) {
  if (isLoading) {
    return <div className="h-80 rounded-xl bg-card animate-pulse border border-border" />;
  }

  if (!data) return null;

  const { financialSummary, channelDistribution, paymentMethodDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Financial Details Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <span className="text-xs text-muted-foreground font-medium">Settled Net Revenue</span>
          <div className="text-xl font-bold text-foreground mt-1">
            ₹{financialSummary.settledRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground">After refunds & discounts</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <span className="text-xs text-muted-foreground font-medium">Taxes Collected</span>
          <div className="text-xl font-bold text-foreground mt-1">
            ₹{financialSummary.totalTaxes.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground">GST / Tax obligations</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <span className="text-xs text-muted-foreground font-medium">Discounts Waived</span>
          <div className="text-xl font-bold text-foreground mt-1">
            ₹{financialSummary.totalDiscounts.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground">Promotions & item waivers</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <span className="text-xs text-muted-foreground font-medium">Refunds Processed</span>
          <div className="text-xl font-bold text-[#EF4444] mt-1">
            ₹{financialSummary.totalRefunds.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground">Returned order totals</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Order Channel Distribution</h4>
          <div className="space-y-3">
            {channelDistribution.map((ch) => (
              <div key={ch.channel} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">{ch.channel}</span>
                  <span className="text-muted-foreground">
                    ₹{ch.revenue.toLocaleString('en-IN')} ({ch.sharePercentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/40">
                  <div
                    style={{ width: `${ch.sharePercentage}%` }}
                    className="h-full bg-primary rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Payment Methods Realized</h4>
          <div className="space-y-3">
            {paymentMethodDistribution.map((pm) => (
              <div key={pm.method} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border/60 text-xs">
                <span className="font-semibold text-foreground">{pm.method}</span>
                <div className="text-right">
                  <div className="font-bold text-primary">₹{pm.volume.toLocaleString('en-IN')}</div>
                  <div className="text-muted-foreground text-[10px]">{pm.transactionsCount} payments</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
