'use client';

import React from 'react';
import type { BranchAnalyticsResponse } from '@/services/analytics.service';
import { Building2, TrendingUp, AlertCircle } from 'lucide-react';

interface BranchBenchmarkingViewProps {
  data?: BranchAnalyticsResponse['data'];
  isLoading?: boolean;
}

export function BranchBenchmarkingView({ data, isLoading }: BranchBenchmarkingViewProps) {
  if (isLoading) {
    return <div className="h-72 rounded-xl bg-card/60 animate-pulse border border-border/50" />;
  }

  if (!data || data.branches.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        No multi-branch comparisons available.
      </div>
    );
  }

  const { branches, totalNetworkRevenue } = data;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-semibold text-foreground">Multi-Branch Benchmarking</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparative performance across {branches.length} branches
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Network Revenue</span>
          <div className="text-base font-bold text-foreground">₹{totalNetworkRevenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch, idx) => (
          <div
            key={branch.branchId}
            className="border border-border rounded-xl p-5 bg-card hover:bg-muted/20 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">{branch.name}</h4>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  #{idx + 1}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{branch.city} • Code: {branch.code}</div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Revenue:</span>
                <span className="font-bold text-foreground">₹{branch.grossRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Contribution:</span>
                <span className="font-semibold text-primary">{branch.networkContributionPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders:</span>
                <span className="font-medium text-foreground">{branch.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Order Value (AOV):</span>
                <span className="font-medium text-foreground">₹{branch.averageOrderValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancellation Rate:</span>
                <span className={`font-medium ${branch.cancellationRate > 5 ? 'text-rose-500' : 'text-foreground'}`}>
                  {branch.cancellationRate}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
