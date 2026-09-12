'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forecastsService, type AiForecastAnswer } from '@/services/forecasts.service';
import { ForecastOverviewCards } from '@/components/forecasts/forecast-overview-cards';
import { ForecastTrendChart } from '@/components/forecasts/forecast-trend-chart';
import { ForecastExplainabilityCard } from '@/components/forecasts/forecast-explainability-card';
import { MealPeriodChannelForecast } from '@/components/forecasts/meal-period-channel-forecast';
import { OperationalDemandHeatmap } from '@/components/forecasts/operational-demand-heatmap';
import { PeakHoursForecast } from '@/components/forecasts/peak-hours-forecast';
import { MenuDemandForecastTable } from '@/components/forecasts/menu-demand-forecast-table';
import { ForecastVsActualTable } from '@/components/forecasts/forecast-vs-actual-table';
import { ModelComparisonCard } from '@/components/forecasts/model-comparison-card';
import {
  EmptyState,
  ErrorPanel,
  PageHeader,
  Skeleton,
  SkeletonTable,
} from '@/components/ui/primitives';
import { useBranches } from '@/hooks/use-branches';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Building2,
  Layers,
  Utensils,
  Grid,
  CheckCircle2,
  Send,
  Bot,
} from 'lucide-react';

type ForecastTab = 'sales' | 'meals_channels' | 'heatmap' | 'menu' | 'accuracy';

const TABS: Array<{ id: ForecastTab; label: string; icon: typeof Layers }> = [
  { id: 'sales', label: 'Revenue & Orders', icon: TrendingUp },
  { id: 'meals_channels', label: 'Meal Periods & Channels', icon: Layers },
  { id: 'heatmap', label: '7×24 Demand Heatmap', icon: Grid },
  { id: 'menu', label: 'Menu Item Demand', icon: Utensils },
  { id: 'accuracy', label: 'Forecast vs Actuals & Models', icon: CheckCircle2 },
];

const HORIZONS = ['24H', '48H', '7D', '14D', '30D', '90D'] as const;

export default function ForecastingDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>('7D');
  const [activeTab, setActiveTab] = useState<ForecastTab>('sales');

  // AI Assistant Query State
  const [aiQuestion, setAiQuestion] = useState<string>('What are our expected sales tomorrow?');
  const [aiAnswer, setAiAnswer] = useState<AiForecastAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];

  const restaurantId = currentRestaurant?.id;
  const effectiveBranch = selectedBranch || currentBranch?.id || undefined;
  const enabled = Boolean(restaurantId);

  /**
   * Seven independent projections, seven queries. Behind one `Promise.all` the
   * page could not paint until the slowest returned and a single rejection
   * blanked all of them; keyed separately, each tab's panel resolves on its
   * own and the four that belong to a tab nobody has opened are never
   * requested. The restaurant and branch ids are part of every key so a
   * context switch cannot serve the previous branch's projections.
   */
  const scope = [restaurantId ?? null, effectiveBranch ?? null] as const;

  const salesQuery = useQuery({
    queryKey: ['forecasts', 'sales', ...scope, horizon],
    queryFn: async () =>
      (await forecastsService.getSalesForecast({ branchId: effectiveBranch, horizon }))?.data ?? null,
    enabled,
  });

  const explanationQuery = useQuery({
    queryKey: ['forecasts', 'explain', ...scope],
    queryFn: async () => (await forecastsService.explainForecast(effectiveBranch))?.data ?? null,
    enabled: enabled && activeTab === 'sales',
  });

  // Read by the overview cards on the sales tab as well as by the ledger on
  // the accuracy tab, so it is enabled for both.
  const accuracyQuery = useQuery({
    queryKey: ['forecasts', 'accuracy', ...scope],
    queryFn: async () => (await forecastsService.getAccuracy(effectiveBranch))?.data ?? null,
    enabled: enabled && (activeTab === 'sales' || activeTab === 'accuracy'),
  });

  const mealChannelsQuery = useQuery({
    queryKey: ['forecasts', 'meal-channels', ...scope],
    queryFn: async () => (await forecastsService.getMealAndChannels(effectiveBranch))?.data ?? null,
    enabled: enabled && activeTab === 'meals_channels',
  });

  const heatmapQuery = useQuery({
    queryKey: ['forecasts', 'heatmap', ...scope],
    queryFn: async () => (await forecastsService.getDemandHeatmap(effectiveBranch))?.data ?? [],
    enabled: enabled && activeTab === 'heatmap',
  });

  const menuDemandQuery = useQuery({
    queryKey: ['forecasts', 'menu-demand', ...scope],
    queryFn: async () => (await forecastsService.getMenuDemand(effectiveBranch))?.data ?? [],
    enabled: enabled && activeTab === 'menu',
  });

  const benchmarksQuery = useQuery({
    queryKey: ['forecasts', 'model-benchmarks', ...scope],
    queryFn: async () => (await forecastsService.benchmarkModels(effectiveBranch))?.data ?? [],
    enabled: enabled && activeTab === 'accuracy',
  });

  const recalculate = useMutation({
    mutationFn: () =>
      forecastsService.generateForecast({
        branchId: selectedBranch || undefined,
        horizon: horizon === '24H' || horizon === '48H' ? '7D' : (horizon as '7D' | '14D' | '30D'),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forecasts'] }),
  });

  const activeQuery = {
    sales: salesQuery,
    meals_channels: mealChannelsQuery,
    heatmap: heatmapQuery,
    menu: menuDemandQuery,
    accuracy: accuracyQuery,
  }[activeTab];

  const pageError = recalculate.error ?? activeQuery.error ?? null;

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await forecastsService.askAiQuery(aiQuestion, selectedBranch || undefined);
      setAiAnswer(res.data);
    } catch (err: any) {
      console.error('Failed to query AI forecast gateway:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const salesForecast = salesQuery.data;
  const mealPeriods = mealChannelsQuery.data?.mealPeriods ?? [];
  const channels = mealChannelsQuery.data?.channels ?? [];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Sales & Demand Forecasting"
        description="Predict future revenue, orders, meal periods, channels, dish demand, and causal trends."
        actions={
          <>
            {/* Branch Selector */}
            {branches.length > 0 && (
              <div className="flex max-w-full items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-sm">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  aria-label="Forecast branch"
                  className="min-w-0 cursor-pointer border-none bg-transparent text-foreground focus:outline-none"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Horizon Selector — scrolls inside its own track so six presets
                never force the document sideways on a phone. */}
            <div className="no-scrollbar flex max-w-full items-center overflow-x-auto rounded-xl border border-border bg-card p-1 text-xs font-semibold shadow-sm">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  aria-pressed={horizon === h}
                  className={`shrink-0 rounded-lg px-3 py-1.5 transition-all ${
                    horizon === h
                      ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Recalculate Button */}
            <button
              type="button"
              onClick={() => recalculate.mutate()}
              disabled={recalculate.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recalculate.isPending ? 'animate-spin' : ''}`} />
              {recalculate.isPending ? 'Calculating...' : 'Recalculate'}
            </button>
          </>
        }
      />

      {/* Kafei AI Forecast Assistant Bar */}
      <div className="space-y-3 rounded-2xl border border-primary/30 bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <Bot className="h-4 w-4" aria-hidden="true" />
          <span id="ai-forecaster-label">Ask Kafei AI Forecaster</span>
        </div>

        <form onSubmit={handleAskAi} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            aria-labelledby="ai-forecaster-label"
            placeholder="e.g. How much will I sell tomorrow? Which day will be busiest?"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {aiLoading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {/* The answer replaces itself in place, so it is announced rather than
            appearing silently for a screen-reader user. */}
        <div aria-live="polite">
          {aiAnswer && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs font-bold leading-relaxed text-foreground">
                {aiAnswer.headlineAnswer}
              </div>
              <ul className="list-inside list-disc space-y-1 text-[11px] text-muted-foreground">
                {aiAnswer.supportingDetails.map((det, idx) => (
                  <li key={idx}>{det}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-px text-xs font-semibold">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 transition-all ${
                activeTab === t.id
                  ? 'border-primary font-bold text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* A failed projection used to render the cheerful "No Forecast
          Generated Yet" prompt, which reads as an empty restaurant rather
          than a failed request. */}
      {pageError && (
        <ErrorPanel
          message={(pageError as Error)?.message || 'Failed to generate forward projections'}
          onRetry={() => activeQuery.refetch()}
        />
      )}

      {/* Tab Contents — each tab guards on its own dataset, so one missing
          projection no longer hides the four that loaded. */}
      <div className="space-y-6">
        {activeTab === 'sales' &&
          (salesQuery.isPending ? (
            <SalesTabSkeleton />
          ) : salesForecast ? (
            <div className="space-y-6">
              <ForecastOverviewCards forecast={salesForecast} accuracy={accuracyQuery.data ?? undefined} />

              {explanationQuery.data && (
                <ForecastExplainabilityCard explanation={explanationQuery.data} />
              )}

              <ForecastTrendChart
                projections={salesForecast.dailyProjections ?? []}
                horizon={salesForecast.horizon}
              />

              <PeakHoursForecast hourlyPoints={salesForecast.hourlyProjections ?? []} />
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No forecast generated yet"
              description="Click the Recalculate button to generate forward sales projections."
            />
          ))}

        {activeTab === 'meals_channels' &&
          (mealChannelsQuery.isPending ? (
            <SkeletonTable rows={4} columns={3} />
          ) : mealPeriods.length > 0 || channels.length > 0 ? (
            <MealPeriodChannelForecast mealPeriods={mealPeriods} channels={channels} />
          ) : (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title="No meal period split yet"
              description="Meal period and channel projections appear once enough order history has been recorded."
            />
          ))}

        {activeTab === 'heatmap' &&
          (heatmapQuery.isPending ? (
            <SkeletonTable rows={7} columns={6} />
          ) : (heatmapQuery.data?.length ?? 0) > 0 ? (
            <OperationalDemandHeatmap matrix={heatmapQuery.data ?? []} />
          ) : (
            <EmptyState
              icon={<Grid className="h-6 w-6" />}
              title="No demand matrix yet"
              description="The 7×24 intensity grid needs at least a few weeks of order history."
            />
          ))}

        {activeTab === 'menu' &&
          (menuDemandQuery.isPending ? (
            <SkeletonTable rows={10} columns={6} />
          ) : (
            <MenuDemandForecastTable demandList={menuDemandQuery.data ?? []} />
          ))}

        {activeTab === 'accuracy' &&
          (accuracyQuery.isPending ? (
            <SkeletonTable rows={7} columns={6} />
          ) : (
            <div className="space-y-6">
              {accuracyQuery.data ? (
                <ForecastVsActualTable accuracy={accuracyQuery.data} />
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="No accuracy ledger yet"
                  description="Predictions are scored against realised sales once a forecast has matured."
                />
              )}
              <ModelComparisonCard benchmarks={benchmarksQuery.data ?? []} />
            </div>
          ))}
      </div>
    </div>
  );
}

/** Mirrors the sales tab: four summary cards over the projection curve. */
function SalesTabSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Loading forecast…</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
