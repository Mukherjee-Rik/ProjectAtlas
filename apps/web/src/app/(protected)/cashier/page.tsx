'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getTables } from '@/services/tables.service';
import { apiClient } from '@/services/api-client';
import {
  getCancellationRequests,
  reviewCancellationRequest,
  getOrders,
} from '@/services/orders.service';
import {
  getPayments,
  getRefunds,
  processRefund,
  type PaymentRecord,
  type RefundRecord,
} from '@/services/payments.service';
import type { RestaurantTable } from '@/types/table';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/currency';
import { DataCache } from '@/lib/data-cache';

export default function CashierPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  // Navigation tab: 'POS' | 'REFUNDS_CANCELLATIONS' | 'LEDGER'
  const [activeMainTab, setActiveMainTab] = useState<'POS' | 'REFUNDS_CANCELLATIONS' | 'LEDGER'>('POS');
  const [refundSubTab, setRefundSubTab] = useState<'REQUESTS' | 'REFUND_HISTORY' | 'CANCELLED_ORDERS'>('REQUESTS');

  // Cache keys
  const cacheKeyTables = currentBranch ? `tables_${currentBranch.id}` : null;
  const cacheKeyPayments = currentRestaurant ? `payments_${currentRestaurant.id}` : null;

  const cachedTables = cacheKeyTables ? DataCache.get<RestaurantTable[]>(cacheKeyTables) : null;
  const cachedPayments = cacheKeyPayments ? DataCache.get<PaymentRecord[]>(cacheKeyPayments) : null;

  // Data states
  const [tables, setTables] = useState<RestaurantTable[]>(cachedTables || []);
  const [payments, setPayments] = useState<PaymentRecord[]>(cachedPayments || []);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [refundsList, setRefundsList] = useState<RefundRecord[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Loading & process states
  const [isLoading, setIsLoading] = useState(!cachedTables);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Form states for POS settlement
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI_INTENT' | 'MIXED'>('CASH');
  const [txReference, setTxReference] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>('');

  // Modal states for Request Review & Direct Refund
  const [activeReviewRequest, setActiveReviewRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRefundAmount, setCustomRefundAmount] = useState<string>('');
  const [isCustomRefund, setIsCustomRefund] = useState(false);

  // Direct Payment Refund modal state
  const [directRefundPayment, setDirectRefundPayment] = useState<PaymentRecord | null>(null);
  const [directRefundAmount, setDirectRefundAmount] = useState<string>('');
  const [directRefundReason, setDirectRefundReason] = useState('Customer requested refund');
  const [directRefundNote, setDirectRefundNote] = useState('');

  const loadData = useCallback(async () => {
    if (!currentRestaurant || !currentBranch) {
      setIsLoading(false);
      return;
    }
    if (!DataCache.get(`tables_${currentBranch.id}`)) {
      setIsLoading(true);
    }
    setError('');
    try {
      const [tablesRes, paymentsRes, reqsRes, refundsRes, cancelledRes] = await Promise.all([
        getTables(),
        getPayments(),
        getCancellationRequests(),
        getRefunds(),
        getOrders('CANCELLED'),
      ]);

      const fetchedTables = Array.isArray(tablesRes) ? tablesRes : tablesRes?.data ?? [];
      const fetchedPayments = Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.data ?? [];
      const fetchedRequests = Array.isArray(reqsRes) ? reqsRes : reqsRes?.data ?? [];
      const fetchedRefunds = Array.isArray(refundsRes) ? refundsRes : refundsRes?.data ?? [];
      const fetchedCancelled = Array.isArray(cancelledRes) ? cancelledRes : cancelledRes?.data ?? [];

      setTables(fetchedTables);
      setPayments(fetchedPayments);
      setCancellationRequests(fetchedRequests);
      setRefundsList(fetchedRefunds);
      setCancelledOrders(fetchedCancelled);

      DataCache.set(`tables_${currentBranch.id}`, fetchedTables);
      DataCache.set(`payments_${currentRestaurant.id}`, fetchedPayments);
    } catch (err: any) {
      console.error(err);
      if (!cachedTables) {
        setError(err?.message ?? 'Failed to load cashier data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant, currentBranch, cachedTables]);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Settle Bill
  const handleSettleBill = async () => {
    if (!selectedTable) return;
    const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return;

    const unpaidOrders = session.orders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status),
    );

    if (unpaidOrders.length === 0) {
      setIsProcessing(true);
      try {
        await apiClient.post(`/public/tables/${selectedTable.publicToken}/session/end`);
        setSelectedTable(null);
        await loadData();
      } catch (err: any) {
        alert(err?.message ?? 'Failed to clear empty table session.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const totalAmount = unpaidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

    let cashVal = 0;
    let upiVal = 0;
    if (paymentMethod === 'MIXED') {
      cashVal = Number(splitCashAmount || 0);
      upiVal = Number(splitUpiAmount || 0);
      if (Math.abs(cashVal + upiVal - totalAmount) > 0.01) {
        alert(
          `The total split amount (${formatCurrency(cashVal + upiVal)}) must exactly match the total due (${formatCurrency(totalAmount)}).`,
        );
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'MIXED') {
        let remainingCash = cashVal;
        let remainingUpi = upiVal;

        for (const order of unpaidOrders) {
          const orderTotal = Number(order.totalAmount);
          let allocatedForOrder = 0;

          if (remainingCash > 0) {
            const cashToAllocate = Math.min(remainingCash, orderTotal - allocatedForOrder);
            if (cashToAllocate > 0) {
              const payRes = await apiClient.post<any>('/payments/initiate', {
                orderId: order.id,
                amount: cashToAllocate,
                method: 'CASH',
              });
              if (payRes?.data?.id) {
                await apiClient.post(`/payments/webhook/${payRes.data.id}`, {
                  status: 'SUCCESS',
                  transactionReference: txReference.trim() || `CASHIER_CASH_${Date.now()}`,
                });
              }
              remainingCash -= cashToAllocate;
              allocatedForOrder += cashToAllocate;
            }
          }

          if (orderTotal - allocatedForOrder > 0 && remainingUpi > 0) {
            const upiToAllocate = Math.min(remainingUpi, orderTotal - allocatedForOrder);
            if (upiToAllocate > 0) {
              const payRes = await apiClient.post<any>('/payments/initiate', {
                orderId: order.id,
                amount: upiToAllocate,
                method: 'UPI_INTENT',
              });
              if (payRes?.data?.id) {
                await apiClient.post(`/payments/webhook/${payRes.data.id}`, {
                  status: 'SUCCESS',
                  transactionReference: txReference.trim() || `CASHIER_UPI_${Date.now()}`,
                });
              }
              remainingUpi -= upiToAllocate;
              allocatedForOrder += upiToAllocate;
            }
          }
        }
      } else {
        for (const order of unpaidOrders) {
          const paymentRes = await apiClient.post<any>('/payments/initiate', {
            orderId: order.id,
            amount: Number(order.totalAmount),
            method: paymentMethod,
          });
          const payment = paymentRes?.data;
          if (payment?.id) {
            await apiClient.post(`/payments/webhook/${payment.id}`, {
              status: 'SUCCESS',
              transactionReference: txReference.trim() || `CASHIER_${Date.now()}`,
            });
          }
        }
      }

      await apiClient.post(`/public/tables/${selectedTable.publicToken}/session/end`);

      setTxReference('');
      setSplitCashAmount('');
      setSplitUpiAmount('');
      setSelectedTable(null);
      await loadData();
      alert('Table bill settled successfully & table cleared!');
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Payment settlement failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancellation Request Review (Approve/Reject)
  const handleReviewSubmit = async () => {
    if (!activeReviewRequest) return;
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      alert('Please enter a reason for rejecting the request.');
      return;
    }

    setIsProcessing(true);
    try {
      const refundAmt =
        reviewAction === 'APPROVE'
          ? isCustomRefund && customRefundAmount
            ? Number(customRefundAmount)
            : Number(activeReviewRequest.order?.totalAmount || 0)
          : undefined;

      await reviewCancellationRequest(
        activeReviewRequest.id,
        reviewAction,
        reviewAction === 'REJECT' ? rejectionReason : undefined,
        refundAmt,
      );

      setActiveReviewRequest(null);
      setRejectionReason('');
      setCustomRefundAmount('');
      setIsCustomRefund(false);
      await loadData();
      alert(
        reviewAction === 'APPROVE'
          ? 'Cancellation request approved & refund initiated successfully!'
          : 'Cancellation request rejected.',
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to review cancellation request.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Direct Payment Refund
  const handleDirectRefundSubmit = async () => {
    if (!directRefundPayment) return;
    const amount = Number(directRefundAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid refund amount.');
      return;
    }

    setIsProcessing(true);
    try {
      await processRefund(
        directRefundPayment.id,
        amount,
        directRefundReason,
        directRefundNote,
      );

      setDirectRefundPayment(null);
      setDirectRefundAmount('');
      setDirectRefundReason('Customer requested refund');
      setDirectRefundNote('');
      await loadData();
      alert(`Refund of ${formatCurrency(amount)} processed successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to process refund.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentRestaurant || !currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">💵</div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">Select a branch to open Cashier POS</h2>
        <p className="text-sm text-[#9AA6B2]">Choose the restaurant branch from the header selector to monitor billing.</p>
      </div>
    );
  }

  const occupiedTables = tables.filter((t) =>
    t.customerSessions?.some((s) => s.status === 'ACTIVE'),
  );

  const pendingRequests = cancellationRequests.filter((r) => r.status === 'PENDING_REVIEW');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#26313C] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA]">Cashier POS & Finance</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9AA6B2]">
            Table billing settlements, waiter cancellation approvals, and payment refunds.
          </p>
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex rounded-xl bg-[#111820] p-1 border border-[#26313C]">
          <button
            type="button"
            onClick={() => setActiveMainTab('POS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeMainTab === 'POS'
                ? 'bg-[#2AFEB7] text-[#0B0F14] shadow-sm'
                : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            <span>💵 POS Floor</span>
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">
              {occupiedTables.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('REFUNDS_CANCELLATIONS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeMainTab === 'REFUNDS_CANCELLATIONS'
                ? 'bg-[#2AFEB7] text-[#0B0F14] shadow-sm'
                : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            <span>💰 Refunds & Cancellations</span>
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[10px] animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('LEDGER')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeMainTab === 'LEDGER'
                ? 'bg-[#2AFEB7] text-[#0B0F14] shadow-sm'
                : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            <span>📜 Payments Ledger</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POS FLOOR */}
      {activeMainTab === 'POS' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Occupied Tables */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
              Occupied Dining Tables ({occupiedTables.length})
            </h2>

            {isLoading ? (
              <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
                Loading dining floor...
              </div>
            ) : occupiedTables.length === 0 ? (
              <div className="rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center space-y-3">
                <div className="text-3xl">🎉</div>
                <h3 className="text-sm font-bold text-[#F5F7FA]">All Tables Clear</h3>
                <p className="text-xs text-[#9AA6B2]">No active guest sessions are currently registered.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {occupiedTables.map((t) => {
                  const session = t.customerSessions?.find((s) => s.status === 'ACTIVE');
                  const orders = session?.orders ?? [];
                  const totalDue = orders
                    .filter((o) => !['CANCELLED'].includes(o.status))
                    .reduce((acc, o) => acc + Number(o.totalAmount), 0);

                  const isSelected = selectedTable?.id === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTable(t);
                        setTxReference('');
                      }}
                      className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 shadow-[0_0_15px_rgba(42,254,183,0.1)]'
                          : 'border-[#26313C] bg-[#111820] hover:border-[#2AFEB7]/30'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                        {t.diningArea?.name}
                      </span>
                      <span className="mt-1 text-base font-extrabold text-[#F5F7FA]">
                        Table {t.name}
                      </span>
                      <div className="mt-3 flex items-center justify-between border-t border-[#26313C] pt-2 w-full">
                        <span className="text-[10px] text-[#9AA6B2]">
                          {orders.length} Order{orders.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs font-black text-[#2AFEB7]">
                          {formatCurrency(totalDue)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Settlement Details Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2] border-b border-[#26313C] pb-2">
                Billing Settlement Details
              </h2>

              {selectedTable ? (
                (() => {
                  const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
                  const orders = session?.orders ?? [];
                  const unpaidOrders = orders.filter((o) => !['CANCELLED'].includes(o.status));
                  const totalAmount = unpaidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

                  return (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs text-[#9AA6B2]">Processing Bill for:</p>
                        <h3 className="text-lg font-extrabold text-[#F5F7FA]">
                          Table {selectedTable.name} ({selectedTable.diningArea?.name})
                        </h3>
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {unpaidOrders.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg bg-[#18212B] p-2.5 text-xs border border-[#26313C]"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#2AFEB7]">{o.orderNumber}</span>
                              <span className="ml-2 text-[10px] uppercase text-[#9AA6B2]">({o.status})</span>
                            </div>
                            <span className="font-bold text-[#F5F7FA]">{formatCurrency(o.totalAmount)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-[#26313C] pt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#F5F7FA]">Grand Total Due:</span>
                        <span className="text-xl font-black text-[#2AFEB7]">{formatCurrency(totalAmount)}</span>
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-[#9AA6B2] uppercase">
                          Payment Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('CASH')}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              paymentMethod === 'CASH'
                                ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                                : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2]'
                            }`}
                          >
                            💵 Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('UPI_INTENT')}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              paymentMethod === 'UPI_INTENT'
                                ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                                : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2]'
                            }`}
                          >
                            📱 UPI
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('MIXED');
                              setSplitCashAmount(String(totalAmount));
                              setSplitUpiAmount('0');
                            }}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              paymentMethod === 'MIXED'
                                ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                                : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2]'
                            }`}
                          >
                            🔀 Mixed
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'MIXED' && (
                        <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-[#9AA6B2]">Cash Portion</label>
                              <input
                                type="number"
                                value={splitCashAmount}
                                onChange={(e) => {
                                  setSplitCashAmount(e.target.value);
                                  const cash = Number(e.target.value || 0);
                                  setSplitUpiAmount(String(Math.max(0, totalAmount - cash)));
                                }}
                                className="mt-1 w-full rounded border border-[#26313C] bg-[#111820] p-1.5 text-xs text-[#F5F7FA]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#9AA6B2]">UPI Portion</label>
                              <input
                                type="number"
                                value={splitUpiAmount}
                                onChange={(e) => {
                                  setSplitUpiAmount(e.target.value);
                                  const upi = Number(e.target.value || 0);
                                  setSplitCashAmount(String(Math.max(0, totalAmount - upi)));
                                }}
                                className="mt-1 w-full rounded border border-[#26313C] bg-[#111820] p-1.5 text-xs text-[#F5F7FA]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-[#9AA6B2] uppercase">
                          Transaction Note / Ref
                        </label>
                        <input
                          type="text"
                          value={txReference}
                          onChange={(e) => setTxReference(e.target.value)}
                          placeholder="e.g. Paid at counter / UPI 12345"
                          className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] py-2 px-3 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTable(null)}
                          className="flex-1 rounded-lg bg-[#18212B] border border-[#26313C] py-2.5 text-xs font-bold text-[#F5F7FA]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleSettleBill}
                          className="flex-1 rounded-lg bg-[#2AFEB7] py-2.5 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] disabled:opacity-50"
                        >
                          {isProcessing ? 'Settling...' : 'Settle & Clear'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-xs text-[#9AA6B2]">
                  Select an active dining table to proceed with bill settlement.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REFUNDS & CANCELLATIONS */}
      {activeMainTab === 'REFUNDS_CANCELLATIONS' && (
        <div className="space-y-5">
          {/* Sub Tabs */}
          <div className="flex gap-2 border-b border-[#26313C] pb-3">
            <button
              type="button"
              onClick={() => setRefundSubTab('REQUESTS')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                refundSubTab === 'REQUESTS'
                  ? 'bg-[#18212B] text-[#2AFEB7] border border-[#2AFEB7]/30'
                  : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
              }`}
            >
              <span>🔔 Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px]">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRefundSubTab('REFUND_HISTORY')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                refundSubTab === 'REFUND_HISTORY'
                  ? 'bg-[#18212B] text-[#2AFEB7] border border-[#2AFEB7]/30'
                  : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
              }`}
            >
              <span>💰 Refunded Transactions ({refundsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setRefundSubTab('CANCELLED_ORDERS')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                refundSubTab === 'CANCELLED_ORDERS'
                  ? 'bg-[#18212B] text-[#2AFEB7] border border-[#2AFEB7]/30'
                  : 'text-[#9AA6B2] hover:text-[#F5F7FA]'
              }`}
            >
              <span>❌ Cancelled Orders ({cancelledOrders.length})</span>
            </button>
          </div>

          {/* SUB-VIEW: PENDING REQUESTS */}
          {refundSubTab === 'REQUESTS' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center space-y-2">
                  <div className="text-3xl">✨</div>
                  <h3 className="text-sm font-bold text-[#F5F7FA]">No Pending Cancellation Requests</h3>
                  <p className="text-xs text-[#9AA6B2]">
                    Requests submitted by Waiters for paid or in-prep orders will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-amber-500/30 bg-[#111820] p-5 shadow-lg space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-sm font-black text-[#2AFEB7]">
                            Order {req.order?.orderNumber}
                          </span>
                          <h4 className="text-xs font-bold text-[#F5F7FA] mt-0.5">
                            {req.order?.table?.name ? `Table ${req.order.table.name}` : 'Takeaway'}
                          </h4>
                        </div>
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          Pending Review
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#18212B] p-3 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#9AA6B2]">Order Total:</span>
                          <span className="font-bold text-[#F5F7FA]">{formatCurrency(req.order?.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9AA6B2]">Requested By:</span>
                          <span className="font-semibold text-[#F5F7FA]">{req.requestedByName ?? req.requestedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9AA6B2]">Reason:</span>
                          <span className="font-bold text-amber-400">{req.reason}</span>
                        </div>
                        {req.note && (
                          <div className="border-t border-[#26313C] pt-1.5 text-[11px] text-[#9AA6B2]">
                            <span className="font-bold text-[#F5F7FA]">Note:</span> {req.note}
                          </div>
                        )}
                        <div className="text-[10px] text-[#9AA6B2]">
                          Submitted at: {new Date(req.createdAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReviewRequest(req);
                            setReviewAction('REJECT');
                            setRejectionReason('');
                          }}
                          className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReviewRequest(req);
                            setReviewAction('APPROVE');
                            setCustomRefundAmount(String(req.order?.totalAmount || ''));
                            setIsCustomRefund(false);
                          }}
                          className="flex-1 rounded-lg bg-[#2AFEB7] py-2.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4]"
                        >
                          Cancel & Refund
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW: REFUND HISTORY */}
          {refundSubTab === 'REFUND_HISTORY' && (
            <div className="overflow-x-auto rounded-xl border border-[#26313C] bg-[#111820]">
              <table className="w-full text-left text-xs text-[#9AA6B2]">
                <thead className="bg-[#18212B] font-bold uppercase text-[#F5F7FA] border-b border-[#26313C]">
                  <tr>
                    <th className="py-3 px-4">Processed At</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Refund Amount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Approved By</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26313C]">
                  {refundsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#9AA6B2]">
                        No refunds recorded yet.
                      </td>
                    </tr>
                  ) : (
                    refundsList.map((rf) => (
                      <tr key={rf.id} className="hover:bg-[#18212B]/30">
                        <td className="py-2.5 px-4">
                          {rf.processedAt ? new Date(rf.processedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#2AFEB7]">
                          {rf.order?.orderNumber ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#F5F7FA]">
                          {rf.order?.table?.name ? `Table ${rf.order.table.name}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-black text-red-400">
                          -{formatCurrency(rf.amount)}
                        </td>
                        <td className="py-2.5 px-4">{rf.reason}</td>
                        <td className="py-2.5 px-4 font-semibold text-[#F5F7FA]">
                          {rf.approvedBy ?? 'Staff'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">
                            {rf.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW: CANCELLED ORDERS */}
          {refundSubTab === 'CANCELLED_ORDERS' && (
            <div className="overflow-x-auto rounded-xl border border-[#26313C] bg-[#111820]">
              <table className="w-full text-left text-xs text-[#9AA6B2]">
                <thead className="bg-[#18212B] font-bold uppercase text-[#F5F7FA] border-b border-[#26313C]">
                  <tr>
                    <th className="py-3 px-4">Cancelled At</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Cancelled By</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26313C]">
                  {cancelledOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#9AA6B2]">
                        No cancelled orders recorded.
                      </td>
                    </tr>
                  ) : (
                    cancelledOrders.map((co) => (
                      <tr key={co.id} className="hover:bg-[#18212B]/30">
                        <td className="py-2.5 px-4">
                          {co.cancelledAt ? new Date(co.cancelledAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-red-400">
                          {co.orderNumber}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#F5F7FA]">
                          {co.table?.name ? `Table ${co.table.name}` : 'Takeaway'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#F5F7FA]">
                          {formatCurrency(co.totalAmount)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-amber-400">
                          {co.cancellationReason ?? 'Cancelled'}
                        </td>
                        <td className="py-2.5 px-4 text-[#F5F7FA]">{co.cancelledBy ?? 'Staff'}</td>
                        <td className="py-2.5 px-4 text-[#9AA6B2]">{co.cancellationNote ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS LEDGER */}
      {activeMainTab === 'LEDGER' && (
        <div className="overflow-x-auto rounded-xl border border-[#26313C] bg-[#111820]">
          <table className="w-full text-left text-xs text-[#9AA6B2]">
            <thead className="bg-[#18212B] font-bold uppercase text-[#F5F7FA] border-b border-[#26313C]">
              <tr>
                <th className="py-3 px-4">Paid At</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26313C]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#9AA6B2]">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const canRefund = p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED';
                  return (
                    <tr key={p.id} className="hover:bg-[#18212B]/30">
                      <td className="py-2.5 px-4">
                        {p.paidAt ? new Date(p.paidAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#F5F7FA]">
                        {p.order?.table?.name ? `Table ${p.order.table.name}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#2AFEB7]">
                        {p.order?.orderNumber ?? '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="rounded py-0.5 px-1.5 text-[9px] font-bold uppercase bg-[#18212B] border border-[#26313C] text-[#F5F7FA]">
                          {p.method === 'UPI_INTENT' ? 'UPI' : p.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#2AFEB7]">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            p.status === 'SUCCESS'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : p.status === 'REFUNDED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : p.status === 'PARTIALLY_REFUNDED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#9AA6B2]">
                        {p.transactionReference ?? '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {canRefund && (
                          <button
                            type="button"
                            onClick={() => {
                              setDirectRefundPayment(p);
                              setDirectRefundAmount(String(p.amount));
                              setDirectRefundReason('Customer requested refund');
                              setDirectRefundNote('');
                            }}
                            className="rounded bg-[#18212B] border border-[#26313C] px-2.5 py-1 text-[11px] font-bold text-[#2AFEB7] hover:border-[#2AFEB7]"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Review Cancellation Request */}
      {activeReviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#F5F7FA]">
              {reviewAction === 'APPROVE' ? 'Approve Cancellation & Refund' : 'Reject Cancellation Request'}
            </h3>

            <div className="rounded-xl bg-[#18212B] p-3 text-xs space-y-1.5 border border-[#26313C]">
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Order Number:</span>
                <span className="font-mono font-bold text-[#2AFEB7]">
                  {activeReviewRequest.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Total Amount:</span>
                <span className="font-bold text-[#F5F7FA]">
                  {formatCurrency(activeReviewRequest.order?.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Waiter Reason:</span>
                <span className="font-bold text-amber-400">{activeReviewRequest.reason}</span>
              </div>
              {activeReviewRequest.note && (
                <div className="text-[#9AA6B2]">
                  <span className="font-semibold text-[#F5F7FA]">Note:</span> {activeReviewRequest.note}
                </div>
              )}
            </div>

            {reviewAction === 'APPROVE' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9AA6B2]">Refund Type:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRefund(false);
                        setCustomRefundAmount(String(activeReviewRequest.order?.totalAmount || ''));
                      }}
                      className={`rounded px-2 py-1 text-[11px] font-bold ${
                        !isCustomRefund ? 'bg-[#2AFEB7] text-[#0B0F14]' : 'bg-[#18212B] text-[#9AA6B2]'
                      }`}
                    >
                      Full (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomRefund(true)}
                      className={`rounded px-2 py-1 text-[11px] font-bold ${
                        isCustomRefund ? 'bg-[#2AFEB7] text-[#0B0F14]' : 'bg-[#18212B] text-[#9AA6B2]'
                      }`}
                    >
                      Partial Amount
                    </button>
                  </div>
                </div>

                {isCustomRefund && (
                  <div>
                    <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                      Custom Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Order is already cooked and served to customer"
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReviewRequest(null)}
                className="flex-1 rounded-lg bg-[#18212B] border border-[#26313C] py-2.5 text-xs font-bold text-[#F5F7FA]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReviewSubmit}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${
                  reviewAction === 'APPROVE'
                    ? 'bg-[#2AFEB7] text-[#0B0F14] hover:bg-[#22E5A4]'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isProcessing ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Direct Payment Refund */}
      {directRefundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#F5F7FA]">Issue Payment Refund</h3>

            <div className="rounded-xl bg-[#18212B] p-3 text-xs space-y-1.5 border border-[#26313C]">
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Order Number:</span>
                <span className="font-mono font-bold text-[#2AFEB7]">
                  {directRefundPayment.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Original Paid Amount:</span>
                <span className="font-bold text-[#F5F7FA]">{formatCurrency(directRefundPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Payment Mode:</span>
                <span className="font-semibold text-[#F5F7FA]">{directRefundPayment.method}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={directRefundPayment.amount}
                  value={directRefundAmount}
                  onChange={(e) => setDirectRefundAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">Reason</label>
                <input
                  type="text"
                  value={directRefundReason}
                  onChange={(e) => setDirectRefundReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">Notes</label>
                <input
                  type="text"
                  value={directRefundNote}
                  onChange={(e) => setDirectRefundNote(e.target.value)}
                  placeholder="Optional internal note"
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDirectRefundPayment(null)}
                className="flex-1 rounded-lg bg-[#18212B] border border-[#26313C] py-2.5 text-xs font-bold text-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDirectRefundSubmit}
                className="flex-1 rounded-lg bg-[#2AFEB7] py-2.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
