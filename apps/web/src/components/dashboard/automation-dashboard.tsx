'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  triggerType: string;
  schedule: string | null;
  eventType: string | null;
  conditionType: string | null;
  conditionValue: number | null;
  actionType: string;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  _count?: { executions: number };
}

interface Execution {
  id: string;
  status: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

const TRIGGER_TYPES = ['SCHEDULED', 'EVENT'] as const;
const EVENT_TYPES = [
  'ORDER_CREATED',
  'ORDER_CANCELLED',
  'ORDER_DELAYED',
  'STOCK_UPDATED',
  'INVENTORY_LOW',
  'PAYMENT_FAILED',
] as const;

const CONDITION_TYPES = [
  'INVENTORY_LOW',
  'INVENTORY_CRITICAL',
  'INVENTORY_OUT',
  'SALES_BELOW',
  'SALES_ABOVE',
  'ORDERS_ABOVE',
  'CANCELLATIONS_ABOVE',
  'PENDING_ORDERS_ABOVE',
] as const;

const ACTION_TYPES = [
  'NOTIFY_LOW_INVENTORY',
  'GENERATE_RECOMMENDATION',
  'GENERATE_REPORT',
  'CREATE_AI_INSIGHT',
  'SEND_NOTIFICATION',
] as const;

export function AutomationDashboard() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerType: 'EVENT' as string,
    schedule: '',
    eventType: '' as string,
    conditionType: '' as string,
    conditionValue: '',
    actionType: 'SEND_NOTIFICATION' as string,
    cooldownMinutes: '360',
  });

  const fetchRules = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/automations');
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setRules(list);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const createRule = async () => {
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        triggerType: form.triggerType,
        actionType: form.actionType,
        cooldownMinutes: parseInt(form.cooldownMinutes) || 360,
      };
      if (form.triggerType === 'SCHEDULED') payload.schedule = form.schedule;
      if (form.triggerType === 'EVENT') payload.eventType = form.eventType;
      if (form.conditionType) payload.conditionType = form.conditionType;
      if (form.conditionValue) payload.conditionValue = parseFloat(form.conditionValue);

      await apiClient.post('/automations', payload);
      setShowCreate(false);
      setForm({
        name: '', description: '', triggerType: 'EVENT', schedule: '',
        eventType: '', conditionType: '', conditionValue: '',
        actionType: 'SEND_NOTIFICATION', cooldownMinutes: '360',
      });
      fetchRules();
    } catch {}
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await apiClient.patch(`/automations/${id}`, { enabled: !enabled });
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    } catch {}
  };

  const deleteRule = async (id: string) => {
    try {
      await apiClient.delete(`/automations/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const testRule = async (id: string) => {
    setTesting(id);
    try {
      const res = await apiClient.post<{ fired: boolean }>(`/automations/${id}/test`);
      alert(res.fired ? '✅ Rule fired successfully!' : '⏭️ Rule did not fire (condition not met or cooldown active).');
    } catch {
      alert('❌ Test failed.');
    } finally {
      setTesting(null);
    }
  };

  const viewExecutions = async (id: string) => {
    if (selectedRule === id) {
      setSelectedRule(null);
      return;
    }
    try {
      const res = await apiClient.get<any>(`/automations/${id}/executions`);
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setExecutions(list);
      setSelectedRule(id);
    } catch {
      setExecutions([]);
    }
  };

  const actionIcon: Record<string, string> = {
    NOTIFY_LOW_INVENTORY: '📦',
    GENERATE_RECOMMENDATION: '💡',
    GENERATE_REPORT: '📊',
    CREATE_AI_INSIGHT: '🤖',
    SEND_NOTIFICATION: '⚡',
  };

  const TEMPLATES = [
    {
      name: '📦 Low Stock Alert',
      description: 'Auto-alerts manager when ingredients drop below reorder thresholds',
      triggerType: 'EVENT',
      eventType: 'STOCK_UPDATED',
      conditionType: 'INVENTORY_LOW',
      actionType: 'NOTIFY_LOW_INVENTORY',
      cooldownMinutes: '360',
    },
    {
      name: '📊 Nightly Sales Report',
      description: 'Generates end-of-day sales, order counts, and top dish summaries',
      triggerType: 'SCHEDULED',
      schedule: '0 23 * * *',
      actionType: 'GENERATE_REPORT',
      cooldownMinutes: '720',
    },
    {
      name: '🚨 High Cancellation Alert',
      description: 'Detects unusual order cancellation spikes in kitchen operations',
      triggerType: 'EVENT',
      eventType: 'ORDER_CANCELLED',
      conditionType: 'CANCELLATIONS_ABOVE',
      conditionValue: '3',
      actionType: 'SEND_NOTIFICATION',
      cooldownMinutes: '60',
    },
    {
      name: '💡 AI Operational Recommendations',
      description: 'Proactively identifies revenue opportunities and kitchen bottlenecks',
      triggerType: 'SCHEDULED',
      schedule: '0 9 * * 1',
      actionType: 'GENERATE_RECOMMENDATION',
      cooldownMinutes: '1440',
    },
  ];

  const statusColor: Record<string, string> = {
    COMPLETED: 'text-primary',
    FAILED: 'text-atlas-error',
    RUNNING: 'text-atlas-warning',
    PENDING: 'text-muted-foreground',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Automation Engine</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Proactively monitor operations, low inventory, delayed orders, and scheduled reports
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
        >
          {showCreate ? 'Cancel' : '+ New Rule'}
        </button>
      </div>

      {/* Preset Rule Templates */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recommended Rule Presets</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setForm({
                  name: tmpl.name,
                  description: tmpl.description,
                  triggerType: tmpl.triggerType,
                  schedule: tmpl.schedule || '',
                  eventType: tmpl.eventType || '',
                  conditionType: tmpl.conditionType || '',
                  conditionValue: tmpl.conditionValue || '',
                  actionType: tmpl.actionType,
                  cooldownMinutes: tmpl.cooldownMinutes,
                });
                setShowCreate(true);
              }}
              className="group rounded-xl border border-border bg-card p-3 text-left hover:border-primary/50 hover:bg-secondary transition-all"
            >
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{tmpl.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{tmpl.description}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-primary border border-border">
                  {tmpl.triggerType}
                </span>
                <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                  Use Preset →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create Rule Form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Create Automation Rule</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                placeholder="e.g. High cancellation alert"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Trigger Type</label>
              <select
                value={form.triggerType}
                onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
              >
                {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {form.triggerType === 'SCHEDULED' && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cron Schedule</label>
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none font-mono"
                  placeholder="0 9 * * *"
                />
              </div>
            )}

            {form.triggerType === 'EVENT' && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Event Type</label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                >
                  <option value="">Select event...</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Action</label>
              <select
                value={form.actionType}
                onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
              >
                {ACTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Condition</label>
              <select
                value={form.conditionType}
                onChange={(e) => setForm({ ...form, conditionType: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
              >
                <option value="">No condition (always fire)</option>
                {CONDITION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {form.conditionType && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Threshold Value</label>
                <input
                  type="number"
                  value={form.conditionValue}
                  onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  placeholder="e.g. 5"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Cooldown (minutes)</label>
              <input
                type="number"
                value={form.cooldownMinutes}
                onChange={(e) => setForm({ ...form, cooldownMinutes: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={createRule}
            disabled={!form.name || !form.actionType}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-background hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Create Rule
          </button>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-3xl mb-3">⚙️</p>
          <p className="text-sm text-muted-foreground">No automation rules yet. Create your first rule to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id, rule.enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    rule.enabled ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground shadow transition-transform ${
                      rule.enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>

                {/* Icon */}
                <span className="text-lg">{actionIcon[rule.actionType] || '⚙️'}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{rule.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      rule.triggerType === 'SCHEDULED'
                        ? 'bg-atlas-info/10 text-atlas-info'
                        : 'bg-atlas-warning/10 text-atlas-warning'
                    }`}>
                      {rule.triggerType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.conditionType
                      ? `${rule.conditionType.replace(/_/g, ' ')} ${rule.conditionValue ?? ''}`
                      : 'Always fires'}
                    {' → '}
                    {rule.actionType.replace(/_/g, ' ')}
                    {rule.schedule && ` • ${rule.schedule}`}
                  </p>
                </div>

                {/* Executions count */}
                <span className="text-xs text-muted-foreground">
                  {rule._count?.executions ?? 0} runs
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => testRule(rule.id)}
                    disabled={testing === rule.id}
                    className="text-xs text-primary hover:text-primary-hover disabled:opacity-40"
                  >
                    {testing === rule.id ? '⏳' : '▶️'} Test
                  </button>
                  <button
                    type="button"
                    onClick={() => viewExecutions(rule.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    📜 History
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRule(rule.id)}
                    className="text-xs text-atlas-error hover:text-atlas-error"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Execution History */}
              {selectedRule === rule.id && (
                <div className="border-t border-border bg-background/50 px-5 py-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Execution History</h4>
                  {executions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No executions yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {executions.map((exec) => (
                        <div key={exec.id} className="flex items-center gap-3 text-xs">
                          <span className={`font-mono ${statusColor[exec.status] || 'text-muted-foreground'}`}>
                            {exec.status}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(exec.startedAt).toLocaleString()}
                          </span>
                          {exec.errorMessage && (
                            <span className="text-atlas-error truncate max-w-xs">{exec.errorMessage}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
