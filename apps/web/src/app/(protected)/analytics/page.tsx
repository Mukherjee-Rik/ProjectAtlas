'use client';

import React, { useEffect, useState } from 'react';
import {
  analyticsService,
  type KpiResponse,
  type TimeSeriesResponse,
  type RevenueAnalyticsResponse,
  type MenuAnalyticsResponse,
  type CustomerCohortResponse,
  type BranchAnalyticsResponse,
  type DemandMatrixResponse,
} from '@/services/analytics.service';
import { KpiSummaryGrid } from '@/components/analytics/kpi-summary-grid';
import { ComparisonTrendChart } from '@/components/analytics/comparison-trend-chart';
import { RevenueAnalyticsView } from '@/components/analytics/revenue-analytics-view';
import { MenuPerformanceMatrix } from '@/components/analytics/menu-performance-matrix';
import { CustomerCohortTable } from '@/components/analytics/customer-cohort-table';
import { BranchBenchmarkingView } from '@/components/analytics/branch-benchmarking-view';
import { OperationalHeatmap } from '@/components/analytics/operational-heatmap';
import { DrillDownModal } from '@/components/analytics/drill-down-modal';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  UtensilsCrossed,
  Users,
  Building2,
  Clock,
  RotateCcw,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'menu' | 'customers' | 'branches' | 'operations'>(
    'overview',
  );
  const [periodPreset, setPeriodPreset] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiResponse['data'] | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesResponse['data']>([]);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsResponse['data'] | null>(null);
  const [menuData, setMenuData] = useState<MenuAnalyticsResponse['data'] | null>(null);
  const [customerData, setCustomerData] = useState<CustomerCohortResponse['data'] | null>(null);
  const [branchData, setBranchData] = useState<BranchAnalyticsResponse['data'] | null>(null);
  const [demandData, setDemandData] = useState<DemandMatrixResponse['data'] | null>(null);

  // Drill Down State
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownDimension, setDrillDownDimension] = useState<'BRANCH' | 'CATEGORY' | 'MENU_ITEM' | 'ORDER'>('ORDER');
  const [drillDownTargetId, setDrillDownTargetId] = useState<string | undefined>();

  const getDateRange = (preset: '7D' | '30D' | '90D' | '1Y') => {
    const end = new Date();
    const daysMap = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 };
    const start = new Date(end.getTime() - daysMap[preset] * 86400000);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    };
  };

  const loadData = async () => {
    setLoading(true);
    const { dateFrom, dateTo } = getDateRange(periodPreset);
    const filter = {
      dateFrom,
      dateTo,
      branchId: selectedBranchId || undefined,
    };

    try {
      const [kpisRes, tsRes, revRes, menuRes, custRes, branchRes, demandRes] = await Promise.all([
        analyticsService.getKpis(filter),
        analyticsService.getTimeSeries(filter),
        analyticsService.getRevenue(filter),
        analyticsService.getMenuPerformance(filter),
        analyticsService.getCustomers(),
        analyticsService.getBranches(filter),
        analyticsService.getDemandMatrix(filter),
      ]);

      setKpiData(kpisRes?.data ?? null);
      setTimeSeriesData(tsRes?.data ?? []);
      setRevenueData(revRes?.data ?? null);
      setMenuData(menuRes?.data ?? null);
      setCustomerData(custRes?.data ?? null);
      setBranchData(branchRes?.data ?? null);
      setDemandData(demandRes?.data ?? null);
    } catch (err) {
      console.error('Failed to load analytics engine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodPreset, selectedBranchId]);

  const handleKpiClick = (kpiKey: string) => {
    setDrillDownTitle(`Underlying Orders (${kpiKey.replace(/_/g, ' ').toUpperCase()})`);
    setDrillDownDimension('ORDER');
    setDrillDownTargetId(undefined);
    setDrillDownOpen(true);
  };

  const handleExport = (type: 'ORDERS' | 'MENU') => {
    const { dateFrom, dateTo } = getDateRange(periodPreset);
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      type,
      ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    });
    window.open(`/api/v1/analytics/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Analytics Engine</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Single-source-of-truth data intelligence, multi-period comparisons, and drill-down metrics
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Select */}
          {branchData && branchData.branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Branches ({branchData.branches.length})</option>
              {branchData.branches.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Period Presets */}
          <div className="flex items-center p-1 bg-muted/60 rounded-xl text-xs font-medium border border-border/50">
            <button
              onClick={() => setPeriodPreset('7D')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodPreset === '7D' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriodPreset('30D')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodPreset === '30D' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriodPreset('90D')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodPreset === '90D' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setPeriodPreset('1Y')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodPreset === '1Y' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              Year
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-30">
              <button
                onClick={() => handleExport('ORDERS')}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted font-medium text-foreground transition-colors"
              >
                Export Orders CSV
              </button>
              <button
                onClick={() => handleExport('MENU')}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted font-medium text-foreground transition-colors"
              >
                Export Menu Analytics CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiSummaryGrid
        kpis={kpiData?.kpis ?? []}
        isLoading={loading}
        onKpiClick={handleKpiClick}
      />

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          Overview & Trends
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Revenue & Financials
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'menu'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menu & Products
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Customers & Cohorts
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'branches'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Branch Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'operations'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          7×24 Demand Matrix
        </button>
      </div>

      {/* Tab View Render */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ComparisonTrendChart data={timeSeriesData} isLoading={loading} />
            <RevenueAnalyticsView data={revenueData ?? undefined} isLoading={loading} />
          </div>
        )}

        {activeTab === 'revenue' && (
          <RevenueAnalyticsView data={revenueData ?? undefined} isLoading={loading} />
        )}

        {activeTab === 'menu' && (
          <MenuPerformanceMatrix data={menuData ?? undefined} isLoading={loading} />
        )}

        {activeTab === 'customers' && (
          <CustomerCohortTable data={customerData ?? undefined} isLoading={loading} />
        )}

        {activeTab === 'branches' && (
          <BranchBenchmarkingView data={branchData ?? undefined} isLoading={loading} />
        )}

        {activeTab === 'operations' && (
          <OperationalHeatmap data={demandData ?? undefined} isLoading={loading} />
        )}
      </div>

      {/* Interactive Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        dimension={drillDownDimension}
        targetId={drillDownTargetId}
        dateFrom={getDateRange(periodPreset).dateFrom}
        dateTo={getDateRange(periodPreset).dateTo}
        branchId={selectedBranchId || undefined}
      />
    </div>
  );
}
