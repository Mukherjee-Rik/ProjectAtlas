'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { KpiSummaryGrid } from '@/components/analytics/kpi-summary-grid';
import { ComparisonTrendChart } from '@/components/analytics/comparison-trend-chart';
import { RevenueAnalyticsView } from '@/components/analytics/revenue-analytics-view';
import { MenuPerformanceMatrix } from '@/components/analytics/menu-performance-matrix';
import { CustomerCohortTable } from '@/components/analytics/customer-cohort-table';
import { BranchBenchmarkingView } from '@/components/analytics/branch-benchmarking-view';
import { OperationalHeatmap } from '@/components/analytics/operational-heatmap';
import { DrillDownModal } from '@/components/analytics/drill-down-modal';
import { ErrorPanel, PageHeader } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import {
  TrendingUp,
  Download,
  Layers,
  UtensilsCrossed,
  Users,
  Building2,
  Clock,
} from 'lucide-react';

type AnalyticsTab = 'overview' | 'revenue' | 'menu' | 'customers' | 'branches' | 'operations';

const TABS: Array<{ id: AnalyticsTab; label: string; icon: typeof Layers }> = [
  { id: 'overview', label: 'Overview & Trends', icon: Layers },
  { id: 'revenue', label: 'Revenue & Financials', icon: TrendingUp },
  { id: 'menu', label: 'Menu & Products', icon: UtensilsCrossed },
  { id: 'customers', label: 'Customers & Cohorts', icon: Users },
  { id: 'branches', label: 'Branch Benchmarks', icon: Building2 },
  { id: 'operations', label: '7×24 Demand Matrix', icon: Clock },
];

const PERIOD_PRESETS: Array<{ id: '7D' | '30D' | '90D' | '1Y'; label: string }> = [
  { id: '7D', label: '7 Days' },
  { id: '30D', label: '30 Days' },
  { id: '90D', label: 'Quarter' },
  { id: '1Y', label: 'Year' },
];

const DAYS_IN_PRESET = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 } as const;

function getDateRange(preset: keyof typeof DAYS_IN_PRESET) {
  const end = new Date();
  const start = new Date(end.getTime() - DAYS_IN_PRESET[preset] * 86400000);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

export default function AnalyticsPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [periodPreset, setPeriodPreset] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Drill Down State
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownDimension, setDrillDownDimension] =
    useState<'BRANCH' | 'CATEGORY' | 'MENU_ITEM' | 'ORDER'>('ORDER');
  const [drillDownTargetId, setDrillDownTargetId] = useState<string | undefined>();

  // Recomputed only when the preset changes, so the value stays stable across
  // renders and does not churn the query keys it feeds.
  const { dateFrom, dateTo } = useMemo(() => getDateRange(periodPreset), [periodPreset]);

  const restaurantId = currentRestaurant?.id;
  const effectiveBranch = selectedBranchId || currentBranch?.id || undefined;
  const filter = { dateFrom, dateTo, branchId: effectiveBranch };

  /**
   * Every aggregate is keyed by restaurant, branch and window and guarded on
   * the restaurant id, so nothing leaves the browser until the active tenant
   * is known and a branch switch can never serve the previous branch's
   * numbers from cache. The seven endpoints are seven queries rather than one
   * `Promise.all`: each card paints as its own data lands, one failure does
   * not blank the other six, and react-query cancels the in-flight request
   * when the preset changes instead of letting a stale response win the race.
   */
  const scope = [restaurantId ?? null, effectiveBranch ?? null, dateFrom, dateTo] as const;
  const enabled = Boolean(restaurantId);

  const kpisQuery = useQuery({
    queryKey: ['analytics', 'kpis', ...scope],
    queryFn: async () => (await analyticsService.getKpis(filter))?.data ?? null,
    enabled,
  });

  const timeSeriesQuery = useQuery({
    queryKey: ['analytics', 'time-series', ...scope],
    queryFn: async () => (await analyticsService.getTimeSeries(filter))?.data ?? [],
    enabled,
  });

  const revenueQuery = useQuery({
    queryKey: ['analytics', 'revenue', ...scope],
    queryFn: async () => (await analyticsService.getRevenue(filter))?.data ?? null,
    enabled,
  });

  // Eager despite being a tab dataset: the branch filter in the header reads
  // its list.
  const branchesQuery = useQuery({
    queryKey: ['analytics', 'branches', ...scope],
    queryFn: async () => (await analyticsService.getBranches(filter))?.data ?? null,
    enabled,
  });

  // The remaining three are the heaviest aggregations and belong to a single
  // tab each, so they stay unrequested until that tab is opened.
  const menuQuery = useQuery({
    queryKey: ['analytics', 'menu', ...scope],
    queryFn: async () => (await analyticsService.getMenuPerformance(filter))?.data ?? null,
    enabled: enabled && activeTab === 'menu',
  });

  const customersQuery = useQuery({
    queryKey: ['analytics', 'customers', restaurantId ?? null],
    queryFn: async () => (await analyticsService.getCustomers())?.data ?? null,
    enabled: enabled && activeTab === 'customers',
  });

  const demandQuery = useQuery({
    queryKey: ['analytics', 'demand-matrix', ...scope],
    queryFn: async () => (await analyticsService.getDemandMatrix(filter))?.data ?? null,
    enabled: enabled && activeTab === 'operations',
  });

  const branchData = branchesQuery.data;

  const loadError = kpisQuery.isError
    ? kpisQuery.error
    : timeSeriesQuery.isError
      ? timeSeriesQuery.error
      : revenueQuery.isError
        ? revenueQuery.error
        : null;

  const handleKpiClick = (kpiKey: string) => {
    setDrillDownTitle(`Underlying Orders (${kpiKey.replace(/_/g, ' ').toUpperCase()})`);
    setDrillDownDimension('ORDER');
    setDrillDownTargetId(undefined);
    setDrillDownOpen(true);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // The menu used to appear on :hover only, which left it unreachable by
  // touch and by keyboard while its two buttons stayed tabbable at opacity 0.
  useEffect(() => {
    if (!exportOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [exportOpen]);

  const handleExport = async (type: 'ORDERS' | 'MENU') => {
    try {
      setExportOpen(false);
      setIsExporting(true);
      const csvData = await analyticsService.exportCsv(type, {
        dateFrom,
        dateTo,
        branchId: effectiveBranch,
      });

      if (!csvData) {
        toast.warning('No data available to export for the selected period.');
        return;
      }

      // Create blob and trigger automatic browser download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `kafei_${type.toLowerCase()}_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Advanced Analytics Engine"
        description="Single-source-of-truth data intelligence, multi-period comparisons, and drill-down metrics."
        actions={
          <>
            {/* Branch Select */}
            {branchData && branchData.branches.length > 1 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                aria-label="Filter analytics by branch"
                className="max-w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">All Branches ({branchData.branches.length})</option>
                {branchData.branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Period Presets — scrolls rather than forcing the row wider than
                the viewport on a 320px phone. */}
            <div className="no-scrollbar flex max-w-full items-center overflow-x-auto rounded-xl border border-border bg-card p-1 text-xs font-medium">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPeriodPreset(preset.id)}
                  aria-pressed={periodPreset === preset.id}
                  className={`shrink-0 rounded-lg px-3 py-1.5 transition-all ${
                    periodPreset === preset.id
                      ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Export Menu */}
            <div ref={exportRef} className="relative">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                className={`flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover ${
                  isExporting ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>

              {exportOpen && !isExporting && (
                <div
                  role="menu"
                  aria-label="Export analytics"
                  className="absolute right-0 top-full z-30 mt-1.5 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-1.5 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('ORDERS')}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Export Orders CSV
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('MENU')}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Export Menu Analytics CSV
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      {/* A failed aggregation used to fall through to "No KPI metrics
          available", which tells an operator there were no sales when in fact
          the request never completed. */}
      {loadError && (
        <ErrorPanel
          message={(loadError as Error)?.message || 'Failed to load analytics for this period.'}
          onRetry={() => {
            kpisQuery.refetch();
            timeSeriesQuery.refetch();
            revenueQuery.refetch();
          }}
        />
      )}

      {/* KPI Cards Grid */}
      <KpiSummaryGrid
        kpis={kpisQuery.data?.kpis ?? []}
        isLoading={kpisQuery.isPending}
        onKpiClick={handleKpiClick}
      />

      {/* Main Tabs Navigation */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-primary font-bold text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab View Render */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ComparisonTrendChart
              data={timeSeriesQuery.data ?? []}
              isLoading={timeSeriesQuery.isPending}
            />
            <RevenueAnalyticsView
              data={revenueQuery.data ?? undefined}
              isLoading={revenueQuery.isPending}
            />
          </div>
        )}

        {activeTab === 'revenue' && (
          <RevenueAnalyticsView
            data={revenueQuery.data ?? undefined}
            isLoading={revenueQuery.isPending}
          />
        )}

        {activeTab === 'menu' && (
          <MenuPerformanceMatrix data={menuQuery.data ?? undefined} isLoading={menuQuery.isPending} />
        )}

        {activeTab === 'customers' && (
          <CustomerCohortTable
            data={customersQuery.data ?? undefined}
            isLoading={customersQuery.isPending}
          />
        )}

        {activeTab === 'branches' && (
          <BranchBenchmarkingView
            data={branchData ?? undefined}
            isLoading={branchesQuery.isPending}
          />
        )}

        {activeTab === 'operations' && (
          <OperationalHeatmap data={demandQuery.data ?? undefined} isLoading={demandQuery.isPending} />
        )}
      </div>

      {/* Interactive Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        dimension={drillDownDimension}
        targetId={drillDownTargetId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        branchId={selectedBranchId || undefined}
      />
    </div>
  );
}
