'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  reportsService,
  type ReportConfiguration,
  type ReportExecutionResult,
} from '@/services/reports.service';
import { ReportVisualizer } from './report-visualizer';
import {
  Database,
  CheckSquare,
  Layers,
  Calendar,
  ArrowUpDown,
  PieChart,
  Eye,
  Save,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

const DATA_SOURCES = [
  { id: 'SALES', label: 'Sales & Revenue', desc: 'Financial transactions, taxes, discounts, refunds' },
  { id: 'ORDERS', label: 'Orders & Throughput', desc: 'Order lifecycle status, channels, completion times' },
  { id: 'MENU', label: 'Menu & Dishes', desc: 'Item sales velocity, revenue contribution, categories' },
  { id: 'CUSTOMERS', label: 'Customer Intelligence', desc: 'Unique customers, lifetime value, loyalty segments' },
  { id: 'BRANCHES', label: 'Branch Benchmarks', desc: 'Multi-branch comparative revenue and AOV' },
  { id: 'STAFF', label: 'Staff Performance', desc: 'Orders serviced and operational activity' },
  { id: 'PAYMENTS', label: 'Payment Channels', desc: 'Cash, Card, UPI Intent settlement volumes' },
];

const METRIC_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  SALES: [
    { id: 'GROSS_SALES', label: 'Gross Sales (₹)' },
    { id: 'NET_SALES', label: 'Net Revenue (₹)' },
    { id: 'TAX_AMOUNT', label: 'Taxes Collected (₹)' },
    { id: 'DISCOUNT_AMOUNT', label: 'Discounts Waived (₹)' },
    { id: 'REFUND_AMOUNT', label: 'Refunds Processed (₹)' },
    { id: 'CANCELLED_AMOUNT', label: 'Cancelled Value (₹)' },
    { id: 'AVERAGE_ORDER_VALUE', label: 'Average Order Value (₹)' },
    { id: 'TOTAL_ORDERS', label: 'Total Orders Count' },
  ],
  ORDERS: [
    { id: 'TOTAL_ORDERS', label: 'Total Orders' },
    { id: 'COMPLETED_ORDERS', label: 'Completed Orders' },
    { id: 'CANCELLED_ORDERS', label: 'Cancelled Orders' },
    { id: 'DINE_IN_COUNT', label: 'Dine-In Orders' },
    { id: 'TAKEOUT_COUNT', label: 'Takeout Orders' },
  ],
  MENU: [
    { id: 'UNITS_SOLD', label: 'Units Sold' },
    { id: 'GROSS_REVENUE', label: 'Gross Revenue (₹)' },
    { id: 'REVENUE_SHARE_PERCENT', label: 'Revenue Share (%)' },
    { id: 'DISCOUNT_IMPACT', label: 'Discount Impact (₹)' },
  ],
  CUSTOMERS: [
    { id: 'TOTAL_CUSTOMERS', label: 'Unique Customers' },
    { id: 'LIFETIME_VALUE', label: 'Average Lifetime Value (₹)' },
    { id: 'REPEAT_RATE', label: 'Repeat Purchase Rate (%)' },
  ],
  BRANCHES: [
    { id: 'BRANCH_REVENUE', label: 'Branch Revenue (₹)' },
    { id: 'TOTAL_ORDERS', label: 'Total Orders' },
    { id: 'AVERAGE_ORDER_VALUE', label: 'AOV (₹)' },
    { id: 'NETWORK_SHARE_PERCENT', label: 'Network Share (%)' },
  ],
  STAFF: [
    { id: 'ORDERS_HANDLED', label: 'Orders Handled' },
    { id: 'TOTAL_ACTIONS', label: 'Total Actions Recorded' },
  ],
  PAYMENTS: [
    { id: 'PAYMENT_VOLUME', label: 'Settled Volume (₹)' },
    { id: 'TRANSACTION_COUNT', label: 'Transaction Count' },
  ],
};

const DIMENSION_OPTIONS = [
  { id: 'DATE_DAY', label: 'Daily (by Date)' },
  { id: 'DATE_HOUR', label: 'Hourly (Hour of Day)' },
  { id: 'BRANCH', label: 'Branch' },
  { id: 'MENU_ITEM', label: 'Menu Item' },
  { id: 'MENU_CATEGORY', label: 'Menu Category' },
  { id: 'STAFF_MEMBER', label: 'Staff Member' },
  { id: 'PAYMENT_METHOD', label: 'Payment Method' },
  { id: 'CUSTOMER_SEGMENT', label: 'Customer Segment' },
];

const VISUALIZATIONS = [
  { id: 'TABLE', label: 'Data Table', desc: 'Tabular matrix with formatted columns' },
  { id: 'BAR_CHART', label: 'Bar Chart', desc: 'Comparative horizontal bars' },
  { id: 'DONUT_CHART', label: 'Donut / Share', desc: 'Category & segment distribution' },
  { id: 'KPI_CARD', label: 'KPI Cards', desc: 'High-level aggregated metric tiles' },
];

export function ReportBuilderWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [reportName, setReportName] = useState('Custom Revenue Report');
  const [description, setDescription] = useState('');
  const [dataSource, setDataSource] = useState<string>('SALES');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['GROSS_SALES', 'NET_SALES', 'TOTAL_ORDERS']);
  const [selectedDimension, setSelectedDimension] = useState<string>('DATE_DAY');
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');
  const [sortField, setSortField] = useState<string>('GROSS_SALES');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [visualizationType, setVisualizationType] = useState<string>('TABLE');

  // Preview & Save State
  const [previewData, setPreviewData] = useState<ReportExecutionResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId],
    );
  };

  const buildConfig = (): ReportConfiguration => ({
    metrics: selectedMetrics,
    dimensions: [selectedDimension],
    filters: [],
    dateRange: { preset: datePreset },
    sorting: [{ field: sortField, direction: sortDirection }],
    limit,
    visualization: { type: visualizationType, title: reportName },
  });

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await reportsService.previewReport({
        name: reportName,
        dataSource,
        configuration: buildConfig(),
      });
      setPreviewData(res?.data ?? null);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await reportsService.createReport({
        name: reportName,
        description,
        dataSource,
        configuration: buildConfig(),
        visibility: 'RESTAURANT',
      });
      router.push(`/reports/${res.data.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save report');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Step Indicator */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between overflow-x-auto gap-2 text-xs font-semibold shadow-md">
        {[
          { num: 1, label: 'Data Source', icon: Database },
          { num: 2, label: 'Metrics', icon: CheckSquare },
          { num: 3, label: 'Dimension', icon: Layers },
          { num: 4, label: 'Date Range', icon: Calendar },
          { num: 5, label: 'Visualization', icon: PieChart },
          { num: 6, label: 'Preview & Save', icon: Eye },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-background font-bold shadow-sm'
                  : isDone
                  ? 'text-foreground hover:bg-secondary'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-background text-primary' : 'bg-secondary text-foreground border border-border'
              }`}>
                {s.num}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Step 1: Data Source */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Step 1: Choose Operational Data Source</h3>
          <p className="text-xs text-muted-foreground">
            Select the primary data domain you wish to query
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {DATA_SOURCES.map((ds) => (
              <div
                key={ds.id}
                onClick={() => {
                  setDataSource(ds.id);
                  const firstMetric = METRIC_OPTIONS[ds.id]?.[0]?.id;
                  if (firstMetric) {
                    setSelectedMetrics([firstMetric]);
                    setSortField(firstMetric);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  dataSource === ds.id
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-secondary hover:border-primary/40'
                }`}
              >
                <div className="font-bold text-sm text-foreground">{ds.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{ds.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Metrics */}
      {step === 2 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Step 2: Select Report Metrics</h3>
          <p className="text-xs text-muted-foreground">
            Choose what calculations you want to include in this report
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(METRIC_OPTIONS[dataSource] || []).map((m) => {
              const isChecked = selectedMetrics.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMetric(m.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs font-semibold ${
                    isChecked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-foreground hover:border-primary/40'
                  }`}
                >
                  <span>{m.label}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                    isChecked ? 'bg-primary border-primary text-background' : 'border-border bg-background'
                  }`}>
                    {isChecked && '✓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Dimension */}
      {step === 3 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Step 3: Choose Grouping Dimension</h3>
          <p className="text-xs text-muted-foreground">
            Select how the metrics should be grouped
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {DIMENSION_OPTIONS.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDimension(d.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                  selectedDimension === d.id
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-secondary text-foreground hover:border-primary/40'
                }`}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Date Range & Limits */}
      {step === 4 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h3 className="text-base font-bold text-foreground">Step 4: Date Range & Result Limits</h3>

          <div>
            <label className="block text-xs font-bold text-foreground mb-2">Date Range Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              {['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={`py-2 px-3 rounded-lg border transition-all ${
                    datePreset === preset
                      ? 'border-primary bg-primary/15 text-primary font-bold'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Sort Direction</label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="DESC">Highest First (Descending)</option>
                <option value="ASC">Lowest First (Ascending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Limit Results</label>
              <select
                value={limit || ''}
                onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">All Results</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Visualization */}
      {step === 5 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Step 5: Select Visualization</h3>
          <p className="text-xs text-muted-foreground">
            Choose how to present the generated report data
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {VISUALIZATIONS.map((v) => (
              <div
                key={v.id}
                onClick={() => setVisualizationType(v.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  visualizationType === v.id
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-secondary hover:border-primary/40'
                }`}
              >
                <div className="font-bold text-sm text-foreground">{v.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Preview & Save */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Step 6: Name, Preview & Save</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Report Name</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly breakdown of dish velocity"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-secondary border border-border hover:border-primary text-foreground transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                {previewLoading ? 'Executing Query...' : 'Run Live Preview'}
              </button>
            </div>
          </div>

          {/* Live Preview Display */}
          {previewData && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Live Report Preview
              </div>
              <ReportVisualizer data={previewData} />
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-secondary border border-border text-foreground hover:border-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>
        ) : <div />}

        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-primary text-background hover:bg-primary-hover transition-all shadow-md"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-primary text-background hover:bg-primary-hover transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Publish Report'}
          </button>
        )}
      </div>
    </div>
  );
}
