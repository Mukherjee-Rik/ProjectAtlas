'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSubscriptionUsage, getPlans, upgradeSubscription, type UsageStats, type Plan } from '@/services/subscriptions.service';
import { formatCurrency } from '@/lib/currency';

export function RestaurantSubscriptionView() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgradingId, setIsUpgradingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
  const [receipt, setReceipt] = useState<{
    planName: string;
    amountPaid: number;
    currency: string;
    transactionReference: string;
    status: string;
    message: string;
    paidAt: string;
  } | null>(null);

  const formatLimit = (val?: number) => {
    if (val === undefined) return 'No Limit';
    if (val === -1) return 'Unlimited';
    return val.toString();
  };

  const loadUsage = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usageRes, plansRes] = await Promise.all([
        getSubscriptionUsage(),
        getPlans(),
      ]);
      setUsageStats(usageRes.data ?? null);
      setPlans(plansRes.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpgradePlan = async (planId: string, planName: string) => {
    if (isUpgradingId) return;
    if (!confirm(`Are you sure you want to change your plan to ${planName}?`)) return;
    setIsUpgradingId(planId);
    try {
      const res = await upgradeSubscription(planId);
      const data = res.data as any;
      if (data?.paymentInfo) {
        setReceipt({
          planName: data.subscription?.plan?.name || planName,
          amountPaid: data.paymentInfo.amountPaid,
          currency: data.paymentInfo.currency,
          transactionReference: data.paymentInfo.transactionReference,
          status: data.paymentInfo.status,
          message: data.paymentInfo.message,
          paidAt: data.paymentInfo.paidAt,
        });
      } else {
        alert(`Successfully upgraded to the ${planName} plan!`);
      }
      await loadUsage();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to change plan. Please try again.');
    } finally {
      setIsUpgradingId(null);
    }
  };

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="text-sm font-semibold text-muted-foreground">Loading Subscription details...</div>
      </div>
    );
  }

  if (error || !usageStats) {
    return (
      <div className="rounded-2xl border border-atlas-error/30 bg-atlas-error/10 p-6 text-center space-y-3">
        <p className="text-sm text-atlas-error font-bold">Unable to retrieve subscription information</p>
        <p className="text-xs text-muted-foreground">{error || 'Please check your active restaurant credentials'}</p>
        <button
          type="button"
          onClick={() => void loadUsage()}
          className="rounded-xl bg-secondary border border-border px-4 py-2 text-xs font-semibold text-foreground hover:border-primary transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { planName, status, billingCycle, nextBillingDate, usage } = usageStats;

  const getStatusBadgeStyle = (subStatus: string) => {
    switch (subStatus) {
      case 'ACTIVE':
        return 'bg-atlas-success/15 text-atlas-success border-atlas-success/30';
      case 'TRIALING':
        return 'bg-atlas-info/15 text-atlas-info border-atlas-info/30';
      case 'SUSPENDED':
        return 'bg-atlas-warning/15 text-atlas-warning border-atlas-warning/30';
      default:
        return 'bg-atlas-error/15 text-atlas-error border-atlas-error/30';
    }
  };

  const getMeterPercent = (current: number, limit: number) => {
    if (limit <= 0) return 0;
    if (current > limit) return 100;
    return (current / limit) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-foreground">My Subscription</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage store licensing plan, active features, and current operational quotas.
        </p>
      </div>

      {/* Trial Alert Banner */}
      {status === 'TRIALING' && nextBillingDate && (
        <div className="rounded-2xl border border-atlas-info/30 bg-atlas-info/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-xs font-bold text-foreground">Restaurant is operating in Trial Mode</p>
              <p className="text-[11px] text-muted-foreground">
                Your trial will automatically expire on <span className="font-semibold text-foreground">{new Date(nextBillingDate).toLocaleDateString()}</span>.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-atlas-info/25 border border-atlas-info/40 px-3 py-1 text-[10px] font-bold text-foreground">
            {Math.max(0, Math.ceil((new Date(nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
          </span>
        </div>
      )}

      {/* Expired / Suspended Warning */}
      {!['ACTIVE', 'TRIALING'].includes(status) && (
        <div className="rounded-2xl border border-atlas-error/30 bg-atlas-error/10 p-5 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-xs font-bold text-foreground">Subscription suspended or expired ({status})</p>
            <p className="text-[11px] text-muted-foreground">
              Some features or administrative updates may be locked. Please contact support or platform administration to reactivate your plan.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Subscription Info Card + Usage Meters Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Plan Tier</span>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl font-black text-primary">{planName}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${getStatusBadgeStyle(status)}`}>
                {status}
              </span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Cycle</span>
              <span className="font-semibold text-foreground uppercase">{billingCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renewal/Expiry Date</span>
              <span className="font-semibold text-foreground">
                {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Included Features</p>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> QR Menu Ordering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Table & Area Setup
              </li>
              {['Starter', 'Professional', 'Enterprise'].includes(planName) && (
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Order Dispatch & Kitchen Screen
                </li>
              )}
              {['Professional', 'Enterprise'].includes(planName) && (
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Advanced Revenue Analytics
                </li>
              )}
              {planName === 'Enterprise' && (
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Multi-Branch Corporate Control
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Resource Usage Meters Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Plan Resource Quotas</h3>
            <p className="text-xs text-muted-foreground">Usage breakdown compared to maximum plan limitations.</p>
          </div>

          <div className="space-y-5">
            {/* Table Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">Tables Configured</span>
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{usage.tables.current}</span> / {usage.tables.limit} max
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  style={{ width: `${getMeterPercent(usage.tables.current, usage.tables.limit)}%` }}
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                />
              </div>
            </div>

            {/* Staff Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">Staff Members</span>
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{usage.staff.current}</span> / {usage.staff.limit} max
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  style={{ width: `${getMeterPercent(usage.staff.current, usage.staff.limit)}%` }}
                  className="h-full bg-gradient-to-r from-atlas-info/60 to-atlas-info rounded-full"
                />
              </div>
            </div>

            {/* Branch Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">Active Branches</span>
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{usage.branches.current}</span> / {usage.branches.limit} max
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  style={{ width: `${getMeterPercent(usage.branches.current, usage.branches.limit)}%` }}
                  className="h-full bg-gradient-to-r from-atlas-warning/60 to-atlas-warning rounded-full"
                />
              </div>
            </div>

            {/* Menu Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">Catalogs / Menus</span>
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{usage.menus.current}</span> / {usage.menus.limit} max
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  style={{ width: `${getMeterPercent(usage.menus.current, usage.menus.limit)}%` }}
                  className="h-full bg-gradient-to-r from-purple-500/60 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Subscription Plans Upgrade Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Available Subscription Plans</h2>
          <p className="text-xs text-muted-foreground">Upgrade or scale your licensing tier to access higher quotas and additional features.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((pl) => {
            const isCurrent = pl.name.toLowerCase() === planName.toLowerCase();
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlanDetails(pl)}
                className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01] ${
                  isCurrent
                    ? 'border-primary bg-card ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/45'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{pl.name}</h4>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/30">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{pl.description || `Atlas scaling plan for restaurants.`}</p>
                  
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-primary">{formatCurrency(pl.price)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">/ {pl.billingCycle}</span>
                  </div>
                </div>

                {/* Plan Resource Limits */}
                <div className="border-t border-border pt-3 text-[11px] text-muted-foreground space-y-1.5">
                  <div className="flex justify-between">
                    <span>Tables Quota:</span>
                    <span className="font-semibold text-foreground">{formatLimit((pl.limits as any)?.maxTables)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff Limit:</span>
                    <span className="font-semibold text-foreground">{formatLimit((pl.limits as any)?.maxStaff)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Branches Limit:</span>
                    <span className="font-semibold text-foreground">{formatLimit((pl.limits as any)?.maxBranches)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Menus Limit:</span>
                    <span className="font-semibold text-foreground">{formatLimit((pl.limits as any)?.maxMenus)}</span>
                  </div>
                </div>

                {/* Button Action */}
                <div className="pt-2">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl bg-primary/10 border border-primary/30 py-2.5 text-xs font-bold text-primary cursor-not-allowed"
                    >
                      ✓ Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpgradingId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpgradePlan(pl.id, pl.name);
                      }}
                      className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-background transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
                    >
                      {isUpgradingId === pl.id ? 'Upgrading...' : `Select ${pl.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 space-y-6 text-center backdrop-saturate-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary border border-primary/30">
              🎉
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">Subscription Upgraded!</h3>
              <p className="text-xs text-muted-foreground">Your payment has been settled successfully.</p>
            </div>

            {/* Receipt details */}
            <div className="rounded-2xl border border-border bg-secondary p-5 text-left text-xs space-y-3 font-medium">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Plan Tier:</span>
                <span className="font-bold text-primary uppercase tracking-wider">{receipt.planName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-bold text-foreground">{formatCurrency(receipt.amountPaid)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-foreground text-[10px] select-all">{receipt.transactionReference}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/30 uppercase">
                  {receipt.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="text-muted-foreground">{new Date(receipt.paidAt).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              "{receipt.message}"
            </p>

            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-background transition-all hover:bg-primary-hover active:scale-[0.99] shadow-lg shadow-primary/10"
            >
              Great, thank you!
            </button>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card/95 p-8 space-y-6 backdrop-saturate-150 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPlanDetails(null)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Plan Details</span>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-wide">
                {selectedPlanDetails.name} Plan
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedPlanDetails.description || 'Explore the operational capacities and features of this tier.'}
              </p>
            </div>

            {/* Price and Cycle */}
            <div className="flex items-baseline gap-2 border-y border-border/60 py-4">
              <span className="text-3xl font-black text-primary">
                {formatCurrency(selectedPlanDetails.price)}
              </span>
              <span className="text-xs text-muted-foreground uppercase font-bold">
                / {selectedPlanDetails.billingCycle}
              </span>
            </div>

            {/* Quotas & Limits */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resource Quotas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary p-3 text-left">
                  <p className="text-[10px] text-muted-foreground">Tables Configured</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {formatLimit((selectedPlanDetails.limits as any)?.maxTables)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-3 text-left">
                  <p className="text-[10px] text-muted-foreground">Staff Members</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {formatLimit((selectedPlanDetails.limits as any)?.maxStaff)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-3 text-left">
                  <p className="text-[10px] text-muted-foreground">Active Branches</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {formatLimit((selectedPlanDetails.limits as any)?.maxBranches)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-3 text-left">
                  <p className="text-[10px] text-muted-foreground">Menus & Catalogs</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {formatLimit((selectedPlanDetails.limits as any)?.maxMenus)}
                  </p>
                </div>
              </div>
            </div>

            {/* Included Features */}
            {selectedPlanDetails.features && selectedPlanDetails.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Included Features</h4>
                <ul className="grid grid-cols-2 gap-2 text-xs text-foreground text-left">
                  {selectedPlanDetails.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-primary text-sm">✓</span> 
                      <span className="capitalize">{feature.replace(/-/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlanDetails(null)}
                className="flex-1 rounded-xl border border-border bg-secondary py-3 text-xs font-semibold text-foreground hover:bg-border"
              >
                Close
              </button>
              {selectedPlanDetails.name.toLowerCase() === planName.toLowerCase() ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-xl bg-primary/10 border border-primary/30 py-3 text-xs font-bold text-primary cursor-not-allowed text-center"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpgradingId !== null}
                  onClick={() => {
                    const planId = selectedPlanDetails.id;
                    const name = selectedPlanDetails.name;
                    setSelectedPlanDetails(null);
                    void handleUpgradePlan(planId, name);
                  }}
                  className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-background transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
                >
                  {isUpgradingId === selectedPlanDetails.id ? 'Upgrading...' : `Select & Upgrade`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
