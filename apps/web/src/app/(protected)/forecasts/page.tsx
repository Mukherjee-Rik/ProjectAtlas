'use client';

import React, { useEffect, useState } from 'react';
import {
  forecastsService,
  type SalesForecastResult,
  type ItemDemandForecast,
  type AccuracyMetrics,
  type MealPeriodForecast,
  type ChannelForecast,
  type DemandHeatmapCell,
  type ForecastExplanation,
  type ModelBenchmarkResult,
  type AiForecastAnswer,
} from '@/services/forecasts.service';
import { getBranches } from '@/services/branches.service';
import type { Branch } from '@/types/branch';
import { ForecastOverviewCards } from '@/components/forecasts/forecast-overview-cards';
import { ForecastTrendChart } from '@/components/forecasts/forecast-trend-chart';
import { ForecastExplainabilityCard } from '@/components/forecasts/forecast-explainability-card';
import { MealPeriodChannelForecast } from '@/components/forecasts/meal-period-channel-forecast';
import { OperationalDemandHeatmap } from '@/components/forecasts/operational-demand-heatmap';
import { PeakHoursForecast } from '@/components/forecasts/peak-hours-forecast';
import { MenuDemandForecastTable } from '@/components/forecasts/menu-demand-forecast-table';
import { ForecastVsActualTable } from '@/components/forecasts/forecast-vs-actual-table';
import { ModelComparisonCard } from '@/components/forecasts/model-comparison-card';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Utensils,
  Grid,
  CheckCircle2,
  Send,
  MessageSquare,
  Bot,
} from 'lucide-react';

export default function ForecastingDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [horizon, setHorizon] = useState<'24H' | '48H' | '7D' | '14D' | '30D' | '90D'>('7D');
  const [activeTab, setActiveTab] = useState<'sales' | 'meals_channels' | 'heatmap' | 'menu' | 'accuracy'>('sales');

  // Core Data States
  const [salesForecast, setSalesForecast] = useState<SalesForecastResult | null>(null);
  const [explanation, setExplanation] = useState<ForecastExplanation | null>(null);
  const [mealPeriods, setMealPeriods] = useState<MealPeriodForecast[]>([]);
  const [channels, setChannels] = useState<ChannelForecast[]>([]);
  const [heatmapMatrix, setHeatmapMatrix] = useState<DemandHeatmapCell[][]>([]);
  const [menuDemand, setMenuDemand] = useState<ItemDemandForecast[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyMetrics | undefined>(undefined);
  const [modelBenchmarks, setModelBenchmarks] = useState<ModelBenchmarkResult[]>([]);

  // AI Assistant Query State
  const [aiQuestion, setAiQuestion] = useState<string>('What are our expected sales tomorrow?');
  const [aiAnswer, setAiAnswer] = useState<AiForecastAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load branches
  useEffect(() => {
    getBranches()
      .then((res) => setBranches(res?.data ?? []))
      .catch((err) => console.error('Failed to load branches:', err));
  }, [currentRestaurant?.id]);

  const loadForecastData = async () => {
    setLoading(true);
    setError(null);
    const effectiveBranch = selectedBranch || currentBranch?.id || undefined;

    try {
      const [salesRes, expRes, mcRes, heatRes, menuRes, accRes, benchRes] = await Promise.all([
        forecastsService.getSalesForecast({
          branchId: effectiveBranch,
          horizon,
        }),
        forecastsService.explainForecast(effectiveBranch),
        forecastsService.getMealAndChannels(effectiveBranch),
        forecastsService.getDemandHeatmap(effectiveBranch),
        forecastsService.getMenuDemand(effectiveBranch),
        forecastsService.getAccuracy(effectiveBranch),
        forecastsService.benchmarkModels(effectiveBranch),
      ]);

      setSalesForecast(salesRes?.data ?? null);
      setExplanation(expRes?.data ?? null);
      setMealPeriods(mcRes?.data?.mealPeriods ?? []);
      setChannels(mcRes?.data?.channels ?? []);
      setHeatmapMatrix(heatRes?.data ?? []);
      setMenuDemand(menuRes?.data ?? []);
      setAccuracy(accRes?.data ?? undefined);
      setModelBenchmarks(benchRes?.data ?? []);
    } catch (err: any) {
      console.error('Failed to load forecast data:', err);
      setError(err?.message || 'Failed to generate forward projections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecastData();
  }, [selectedBranch, horizon, currentRestaurant?.id, currentBranch?.id]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await forecastsService.generateForecast({
        branchId: selectedBranch || undefined,
        horizon: horizon === '24H' || horizon === '48H' ? '7D' : (horizon as any),
      });
      await loadForecastData();
    } catch (err: any) {
      setError(err?.message || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
                Sales & Demand Forecasting
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Predict future revenue, orders, meal periods, channels, dish demand, and causal trends.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Branch Selector */}
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-card text-foreground">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-card text-foreground">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Horizon Selector */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 text-xs font-semibold shadow-sm">
            {(['24H', '48H', '7D', '14D', '30D', '90D'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  horizon === h
                    ? 'bg-primary text-background font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Recalculate Button */}
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-background hover:bg-primary-hover text-xs font-bold shadow-md transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* Atlas AI Forecast Assistant Bar */}
      <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <Bot className="w-4 h-4" />
          <span>Ask Atlas AI Forecaster</span>
        </div>

        <form onSubmit={handleAskAi} className="flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="e.g. How much will I sell tomorrow? Which day will be busiest? How busy at dinner?"
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="px-5 py-2.5 rounded-lg bg-primary text-background text-xs font-bold hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            {aiLoading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {aiAnswer && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 pt-3">
            <div className="text-xs font-bold text-foreground leading-relaxed">
              {aiAnswer.headlineAnswer}
            </div>
            <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
              {aiAnswer.supportingDetails.map((det, idx) => (
                <li key={idx}>{det}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-xs font-semibold overflow-x-auto">
        {[
          { id: 'sales', label: 'Revenue & Orders', icon: TrendingUp },
          { id: 'meals_channels', label: 'Meal Periods & Channels', icon: Layers },
          { id: 'heatmap', label: '7×24 Demand Heatmap', icon: Grid },
          { id: 'menu', label: 'Menu Item Demand', icon: Utensils },
          { id: 'accuracy', label: 'Forecast vs Actuals & Models', icon: CheckCircle2 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-card animate-pulse border border-border" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-card animate-pulse border border-border" />
        </div>
      ) : salesForecast ? (
        <div className="space-y-6">
          {/* Tab 1: Sales & Revenue */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <ForecastOverviewCards forecast={salesForecast} accuracy={accuracy} />

              {/* Explainability Card */}
              {explanation && <ForecastExplainabilityCard explanation={explanation} />}

              {/* Revenue Trend Curve with Prediction Bands */}
              <ForecastTrendChart
                projections={salesForecast.dailyProjections}
                horizon={salesForecast.horizon}
              />

              {/* Peak Hours Workload */}
              <PeakHoursForecast hourlyPoints={salesForecast.hourlyProjections} />
            </div>
          )}

          {/* Tab 2: Meal Periods & Channels */}
          {activeTab === 'meals_channels' && (
            <MealPeriodChannelForecast mealPeriods={mealPeriods} channels={channels} />
          )}

          {/* Tab 3: 7x24 Demand Heatmap */}
          {activeTab === 'heatmap' && (
            <OperationalDemandHeatmap matrix={heatmapMatrix} />
          )}

          {/* Tab 4: Menu Item Demand */}
          {activeTab === 'menu' && (
            <MenuDemandForecastTable demandList={menuDemand} />
          )}

          {/* Tab 5: Forecast vs Actuals & Model Benchmark */}
          {activeTab === 'accuracy' && (
            <div className="space-y-6">
              {accuracy && <ForecastVsActualTable accuracy={accuracy} />}
              <ModelComparisonCard benchmarks={modelBenchmarks} />
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2">
          <Sparkles className="w-8 h-8 text-primary mx-auto" />
          <div className="font-bold text-sm text-foreground">No Forecast Generated Yet</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click the Recalculate button to generate forward sales projections.
          </p>
        </div>
      )}
    </div>
  );
}
