'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getSubscriptions,
  getPlans,
  extendTrial,
  assignPlan,
  updateSubscriptionStatus,
  type Subscription,
  type Plan,
} from '@/services/subscriptions.service';
import { formatCurrency } from '@/lib/currency';

export function PlatformSubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [activeModal, setActiveModal] = useState<'extend' | 'change' | 'status' | null>(null);
  
  // Extension & change values
  const [extendDays, setExtendDays] = useState(7);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [pendingStatus, setPendingStatus] = useState<Subscription['status'] | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [subsData, plansData] = await Promise.all([
        getSubscriptions(),
        getPlans(),
      ]);
      setSubscriptions(subsData.data ?? []);
      setPlans(plansData.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handler helpers
  const handleExtendTrial = async () => {
    if (!selectedSub) return;
    setIsActionLoading(true);
    try {
      await extendTrial(selectedSub.id, extendDays);
      await loadData();
      closeModal();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to extend trial');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedSub || !selectedPlanId) return;
    setIsActionLoading(true);
    try {
      await assignPlan(selectedSub.restaurantId, selectedPlanId);
      await loadData();
      closeModal();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to change plan');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedSub || !pendingStatus) return;
    setIsActionLoading(true);
    try {
      // In TS, pendingStatus corresponds to our update API types
      await updateSubscriptionStatus(selectedSub.id, pendingStatus as any);
      await loadData();
      closeModal();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to update subscription status');
    } finally {
      setIsActionLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSub(null);
    setActiveModal(null);
    setPendingStatus(null);
    setExtendDays(7);
    setSelectedPlanId('');
  };

  // Metrics
  const total = subscriptions.length;
  const active = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialing = subscriptions.filter(s => s.status === 'TRIALING').length;
  const expired = subscriptions.filter(s => s.status === 'EXPIRED').length;
  const cancelled = subscriptions.filter(s => s.status === 'CANCELLED').length;

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status: Subscription['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30';
      case 'TRIALING':
        return 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';
      case 'SUSPENDED':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      default:
        return 'bg-[#18212B] text-[#9AA6B2] border-[#26313C]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2AFEB7] border-t-transparent"></div>
        <div className="text-sm font-semibold text-[#9AA6B2]">Loading Platform Subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-3 py-1 text-xs font-bold text-[#2AFEB7]">
            <span className="h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
            Atlas Platform Billing Management
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#F5F7FA]">
            SaaS Subscriptions
          </h1>
          <p className="mt-1 text-xs text-[#9AA6B2]">
            Monitor and manage active licenses, plans, and service quotas across all store locations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
        >
          ⟳ Refresh Directory
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Total Accounts</span>
          <h3 className="mt-1 text-2xl font-black text-[#F5F7FA]">{total}</h3>
        </div>
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Active Plan</span>
          <h3 className="mt-1 text-2xl font-black text-[#22C55E]">{active}</h3>
        </div>
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Trial Period</span>
          <h3 className="mt-1 text-2xl font-black text-[#3B82F6]">{trialing}</h3>
        </div>
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Expired Trial</span>
          <h3 className="mt-1 text-2xl font-black text-[#EF4444]">{expired}</h3>
        </div>
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Cancelled</span>
          <h3 className="mt-1 text-2xl font-black text-[#EF4444]">{cancelled}</h3>
        </div>
      </div>

      {/* Directory Datatable */}
      <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search restaurant or plan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs text-[#F5F7FA] outline-none placeholder-[#9AA6B2] focus:border-[#2AFEB7]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9AA6B2] font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TRIALING">TRIALING</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#26313C] text-[#9AA6B2] uppercase tracking-wider">
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Tier / Price</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Period End</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26313C]/50">
              {filteredSubs.map(sub => (
                <tr key={sub.id} className="hover:bg-[#18212B]/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#F5F7FA]">{sub.restaurant?.name}</p>
                    <p className="text-[10px] text-[#9AA6B2] font-mono">ID: {sub.restaurantId.substring(0, 8)}...</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#F5F7FA]">{sub.plan.name}</p>
                    <p className="text-[10px] text-[#9AA6B2]">{formatCurrency(Number(sub.plan.price))}/mo</p>
                  </td>
                  <td className="py-3 px-4 text-[#9AA6B2] font-mono text-[10px] uppercase">
                    {sub.billingCycle}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${getStatusBadgeStyle(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#9AA6B2]">
                    {sub.status === 'TRIALING'
                      ? sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString() : 'N/A'
                      : new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {sub.status === 'TRIALING' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSub(sub);
                          setActiveModal('extend');
                        }}
                        className="rounded bg-[#3B82F6]/10 px-2 py-1 text-[10px] font-bold text-[#3B82F6] hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30"
                      >
                        Extend Trial
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSub(sub);
                        setSelectedPlanId(sub.planId);
                        setActiveModal('change');
                      }}
                      className="rounded bg-[#2AFEB7]/10 px-2 py-1 text-[10px] font-bold text-[#2AFEB7] hover:bg-[#2AFEB7]/20 border border-[#2AFEB7]/30"
                    >
                      Change Plan
                    </button>

                    {['ACTIVE', 'TRIALING'].includes(sub.status) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub(sub);
                            setPendingStatus('SUSPENDED');
                            setActiveModal('status');
                          }}
                          className="rounded bg-[#F59E0B]/10 px-2 py-1 text-[10px] font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub(sub);
                            setPendingStatus('CANCELLED');
                            setActiveModal('status');
                          }}
                          className="rounded bg-[#EF4444]/10 px-2 py-1 text-[10px] font-bold text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/30"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSub(sub);
                          setPendingStatus('ACTIVE');
                          setActiveModal('status');
                        }}
                        className="rounded bg-[#22C55E]/10 px-2 py-1 text-[10px] font-bold text-[#22C55E] hover:bg-[#22C55E]/20 border border-[#22C55E]/30"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredSubs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9AA6B2]">
                    No subscriptions match search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EXTEND TRIAL */}
      {activeModal === 'extend' && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#F5F7FA]">Extend Trial Period</h3>
            <p className="text-xs text-[#9AA6B2]">
              Extend trial length for <span className="font-bold text-[#F5F7FA]">{selectedSub.restaurant?.name}</span>. Currently ends on {selectedSub.trialEnd ? new Date(selectedSub.trialEnd).toLocaleDateString() : 'N/A'}.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Days to Add</label>
              <input
                type="number"
                min="1"
                max="90"
                value={extendDays}
                onChange={e => setExtendDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isActionLoading}
                className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:bg-[#26313C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleExtendTrial()}
                disabled={isActionLoading}
                className="rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50"
              >
                {isActionLoading ? 'Saving...' : 'Extend Trial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE PLAN */}
      {activeModal === 'change' && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#F5F7FA]">Upgrade / Downgrade Plan</h3>
            <p className="text-xs text-[#9AA6B2]">
              Change subscription tier for <span className="font-bold text-[#F5F7FA]">{selectedSub.restaurant?.name}</span>.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Choose New Plan</label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(Number(p.price))}/{p.billingCycle.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isActionLoading}
                className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:bg-[#26313C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleChangePlan()}
                disabled={isActionLoading}
                className="rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50"
              >
                {isActionLoading ? 'Saving...' : 'Apply Plan Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM STATUS LIFE ACTION */}
      {activeModal === 'status' && selectedSub && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#F5F7FA]">Confirm Status Action</h3>
            <p className="text-xs text-[#9AA6B2]">
              Are you sure you want to mark <span className="font-bold text-[#F5F7FA]">{selectedSub.restaurant?.name}</span> subscription as <span className="font-bold text-[#EF4444]">{pendingStatus}</span>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isActionLoading}
                className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:bg-[#26313C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateStatus()}
                disabled={isActionLoading}
                className="rounded-xl bg-[#EF4444] px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isActionLoading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
