'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

interface ProviderConfig {
  id: string;
  provider: string;
  enabled: boolean;
}

export function DeliverySettings() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Health states
  const [healthMap, setHealthMap] = useState<Record<string, 'HEALTHY' | 'UNHEALTHY' | 'CHECKING'>>({});

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.get<ProviderConfig[]>('/delivery/config');
      setConfigs(res || []);
      
      // Trigger health check for each provider configuration
      (res || []).forEach((c) => {
        if (c.enabled) {
          void checkHealth(c.provider);
        }
      });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('x-restaurant-id')) {
        setError('Select an active restaurant context from the top header to configure Zomato/Swiggy delivery integrations.');
      } else {
        setError(msg || 'Failed to load integration configurations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async (provider: string) => {
    setHealthMap((prev) => ({ ...prev, [provider]: 'CHECKING' }));
    try {
      const res = await apiClient.get<{ status: 'HEALTHY' | 'UNHEALTHY' }>(`/delivery/health/${provider}`);
      setHealthMap((prev) => ({ ...prev, [provider]: res.status }));
    } catch {
      setHealthMap((prev) => ({ ...prev, [provider]: 'UNHEALTHY' }));
    }
  };

  useEffect(() => {
    void fetchConfigs();
  }, []);

  const handleEditClick = (provider: string) => {
    const existing = configs.find((c) => c.provider === provider);
    setEditingProvider(provider);
    setApiKey('');
    setApiSecret('');
    setIsEnabled(existing ? existing.enabled : true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setIsSaving(true);
    try {
      await apiClient.post('/delivery/config', {
        provider: editingProvider,
        enabled: isEnabled,
        credentials: {
          apiKey,
          apiSecret,
        },
      });

      setEditingProvider(null);
      await fetchConfigs();
    } catch (err: any) {
      alert(err?.message || 'Failed to update credentials configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProviderCard = (name: string, description: string, label: string) => {
    const config = configs.find((c) => c.provider === name);
    const isSetup = !!config;
    const enabled = config?.enabled ?? false;
    const health = healthMap[name];

    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-6 text-left">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-foreground">{label}</h4>
            <div className="flex items-center gap-2">
              {isSetup && enabled ? (
                <>
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    health === 'HEALTHY'
                      ? 'bg-atlas-success shadow-[0_0_8px_#22C55E]'
                      : health === 'CHECKING'
                      ? 'bg-atlas-warning animate-pulse'
                      : 'bg-atlas-error shadow-[0_0_8px_#EF4444]'
                  }`} />
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {health === 'HEALTHY' ? 'Connected' : health === 'CHECKING' ? 'Syncing...' : 'Error'}
                  </span>
                </>
              ) : (
                <span className="rounded bg-secondary border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  Not Configured
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleEditClick(name)}
            className="flex-1 rounded-xl bg-secondary border border-border hover:border-primary py-2 text-xs font-bold text-foreground transition-all"
          >
            {isSetup ? 'Configure Credentials' : 'Set Up Integration'}
          </button>
          {isSetup && enabled && (
            <button
              type="button"
              onClick={() => void checkHealth(name)}
              className="rounded-xl bg-secondary border border-border hover:border-primary px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              ⟳ Test
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading && configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading delivery integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-base font-bold text-foreground">Delivery Aggregator Integrations</h3>
        <p className="text-xs text-muted-foreground">
          Manage connections to external third-party ordering platforms.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-atlas-error/20 bg-atlas-error/10 p-3 text-xs text-atlas-error">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {renderProviderCard('PROVIDER_A', 'Simulate Zomato ordering integration webhooks and status sync.', 'Provider A (Zomato)')}
        {renderProviderCard('PROVIDER_B', 'Simulate Swiggy ordering integration webhooks and status sync.', 'Provider B (Swiggy)')}
      </div>

      {/* Edit Credentials Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-sm font-bold text-foreground">
                Configure {editingProvider === 'PROVIDER_A' ? 'Provider A (Zomato)' : 'Provider B (Swiggy)'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground">API Configuration Key (must start with {editingProvider === 'PROVIDER_A' ? 'PROV_A_' : 'PROV_B_'})</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. PROV_A_abc123"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs text-foreground outline-none hover:border-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-muted-foreground">Client Signature Secret</span>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs text-foreground outline-none hover:border-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="provider-enabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-secondary text-primary accent-primary cursor-pointer"
                />
                <label htmlFor="provider-enabled" className="font-bold text-foreground cursor-pointer selection:bg-transparent">
                  Enable this integration
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-primary hover:bg-primary/80 px-4 py-2 text-xs font-bold text-background disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
