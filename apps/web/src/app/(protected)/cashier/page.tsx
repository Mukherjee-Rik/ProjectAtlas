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
import { useToast } from '@/components/ui/toast';

export default function CashierPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

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
      const results = await Promise.allSettled([
        getTables(),
        getPayments(),
        getCancellationRequests(),
        getRefunds(),
        getOrders('CANCELLED'),
      ]);

      const [tablesRes, paymentsRes, reqsRes, refundsRes, cancelledRes] = results;

      const rawTables = tablesRes.status === 'fulfilled' ? tablesRes.value : [];
      const rawPayments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];
      const rawReqs = reqsRes.status === 'fulfilled' ? reqsRes.value : [];
      const rawRefunds = refundsRes.status === 'fulfilled' ? refundsRes.value : [];
      const rawCancelled = cancelledRes.status === 'fulfilled' ? cancelledRes.value : [];

      const fetchedTables = Array.isArray(rawTables) ? rawTables : (rawTables as any)?.data ?? [];
      const fetchedPayments = Array.isArray(rawPayments) ? rawPayments : (rawPayments as any)?.data ?? [];
      const fetchedRequests = Array.isArray(rawReqs) ? rawReqs : (rawReqs as any)?.data ?? [];
      const fetchedRefunds = Array.isArray(rawRefunds) ? rawRefunds : (rawRefunds as any)?.data ?? [];
      const fetchedCancelled = Array.isArray(rawCancelled) ? rawCancelled : (rawCancelled as any)?.data ?? [];

      setTables(fetchedTables);
      setPayments(fetchedPayments);
      setCancellationRequests(fetchedRequests);
      setRefundsList(fetchedRefunds);
      setCancelledOrders(fetchedCancelled);

      DataCache.set(`tables_${currentBranch.id}`, fetchedTables);
      DataCache.set(`payments_${currentRestaurant.id}`, fetchedPayments);
    } catch (err: any) {
      console.error('Cashier load error:', err);
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

  const isOrderUnpaid = (o: any) => {
    if (!o || o.status === 'CANCELLED') return false;
    const isPaid = o.payments?.some((p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED');
    return !isPaid;
  };

  // Settle Bill
  const handleSettleBill = async () => {
    if (!selectedTable) return;
    const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return;

    const unpaidOrders = session.orders.filter(isOrderUnpaid);

    if (unpaidOrders.length === 0) {
      setIsProcessing(true);
      try {
        const token = selectedTable.publicToken || (selectedTable as any).qrToken;
        if (token) {
          await apiClient.post(`/public/tables/${token}/session/end`);
        }
        setSelectedTable(null);
        await loadData();
        toastSuccess('Table session cleared!');
      } catch (err: any) {
        toastError(err?.message ?? 'Failed to clear table session.');
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
        toastWarning(
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
              try {
                const payRes = await apiClient.post<any>('/payments/initiate', {
                  orderId: order.id,
                  amount: cashToAllocate,
                  method: 'CASH',
                });
                const payment = payRes?.data || payRes;
                if (payment?.id) {
                  await apiClient.post(`/payments/webhook/${payment.id}`, {
                    status: 'SUCCESS',
                    transactionReference: txReference.trim() || `CASHIER_CASH_${Date.now()}`,
                  });
                }
              } catch (payErr) {
                console.warn('Mixed payment (cash) initiate/webhook fallback:', payErr);
              }
              remainingCash -= cashToAllocate;
              allocatedForOrder += cashToAllocate;
            }
          }

          if (orderTotal - allocatedForOrder > 0 && remainingUpi > 0) {
            const upiToAllocate = Math.min(remainingUpi, orderTotal - allocatedForOrder);
            if (upiToAllocate > 0) {
              try {
                const payRes = await apiClient.post<any>('/payments/initiate', {
                  orderId: order.id,
                  amount: upiToAllocate,
                  method: 'UPI_INTENT',
                });
                const payment = payRes?.data || payRes;
                if (payment?.id) {
                  await apiClient.post(`/payments/webhook/${payment.id}`, {
                    status: 'SUCCESS',
                    transactionReference: txReference.trim() || `CASHIER_UPI_${Date.now()}`,
                  });
                }
              } catch (payErr) {
                console.warn('Mixed payment (upi) initiate/webhook fallback:', payErr);
              }
              remainingUpi -= upiToAllocate;
              allocatedForOrder += upiToAllocate;
            }
          }

          // Always ensure order is marked COMPLETED
          try {
            await apiClient.patch(`/orders/${order.id}/status`, { status: 'COMPLETED' });
          } catch (patchErr) {
            console.warn('Order status patch fallback:', patchErr);
          }
        }
      } else {
        for (const order of unpaidOrders) {
          try {
            const paymentRes = await apiClient.post<any>('/payments/initiate', {
              orderId: order.id,
              amount: Number(order.totalAmount),
              method: paymentMethod,
            });
            const payment = paymentRes?.data || paymentRes;
            if (payment?.id) {
              await apiClient.post(`/payments/webhook/${payment.id}`, {
                status: 'SUCCESS',
                transactionReference: txReference.trim() || `CASHIER_${Date.now()}`,
              });
            }
          } catch (payErr) {
            console.warn('Payment initiate/webhook fallback:', payErr);
          }

          // Always ensure order is marked COMPLETED
          try {
            await apiClient.patch(`/orders/${order.id}/status`, { status: 'COMPLETED' });
          } catch (patchErr) {
            console.warn('Order status patch fallback:', patchErr);
          }
        }
      }

      const token = selectedTable.publicToken || (selectedTable as any).qrToken;
      if (token) {
        try {
          await apiClient.post(`/public/tables/${token}/session/end`);
        } catch {
          // Session already marked ENDED by payment transaction
        }
      }

      setTxReference('');
      setSplitCashAmount('');
      setSplitUpiAmount('');
      setSelectedTable(null);
      await loadData();
      toastSuccess(`Table ${selectedTable.name} bill settled for ${formatCurrency(totalAmount)} & session cleared!`);
    } catch (err: any) {
      console.error('Settlement error:', err);
      toastError(err?.message ?? 'Payment settlement failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancellation Request Review (Approve/Reject)
  const handleReviewSubmit = async () => {
    if (!activeReviewRequest) return;
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      toastWarning('Please enter a reason for rejecting the request.');
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
      toastSuccess(
        reviewAction === 'APPROVE'
          ? 'Cancellation request approved & refund initiated successfully!'
          : 'Cancellation request rejected.',
      );
    } catch (err: any) {
      console.error(err);
      toastError(err?.message ?? 'Failed to review cancellation request.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Direct Payment Refund
  const handleDirectRefundSubmit = async () => {
    if (!directRefundPayment) return;
    const amount = Number(directRefundAmount);
    if (!amount || amount <= 0) {
      toastWarning('Please enter a valid refund amount.');
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
      toastSuccess(`Refund of ${formatCurrency(amount)} processed successfully!`);
    } catch (err: any) {
      console.error(err);
      toastError(err?.message ?? 'Failed to process refund.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentRestaurant || !currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">💵</div>
        <h2 className="text-xl font-bold text-foreground">Select a branch to open Cashier POS</h2>
        <p className="text-sm text-muted-foreground">Choose the restaurant branch from the header selector to monitor billing.</p>
      </div>
    );
  }

  const occupiedTables = tables.filter((t) => {
    const session = t.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return false;
    const orders = session.orders ?? [];
    return orders.some(isOrderUnpaid);
  });

  const pendingRequests = cancellationRequests.filter((r) => r.status === 'PENDING_REVIEW');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Cashier POS & Finance</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Table billing settlements, waiter cancellation approvals, and payment refunds.
          </p>
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex rounded-xl bg-card p-1 border border-border overflow-x-auto no-scrollbar touch-pan-x flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveMainTab('POS')}
            className={`flex items-center gap-2 rounded-lg px-3.5 sm:px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeMainTab === 'POS'
                ? 'bg-primary text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
            className={`flex items-center gap-2 rounded-lg px-3.5 sm:px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeMainTab === 'REFUNDS_CANCELLATIONS'
                ? 'bg-primary text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🔄 Cancellations & Refunds</span>
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-atlas-error px-1.5 py-0.2 text-[10px] text-foreground animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('LEDGER')}
            className={`flex items-center gap-2 rounded-lg px-3.5 sm:px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeMainTab === 'LEDGER'
                ? 'bg-primary text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>📑 Payment Ledger</span>
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">
              {payments.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: POS FLOOR */}
      {activeMainTab === 'POS' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Occupied Tables */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dining Tables with Pending Bills ({occupiedTables.length})
            </h2>

            {isLoading ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                Loading dining floor...
              </div>
            ) : occupiedTables.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
                <div className="text-3xl">🎉</div>
                <h3 className="text-sm font-bold text-foreground">All Tables Settled & Clear</h3>
                <p className="text-xs text-muted-foreground">No tables have unpaid bills at this moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {occupiedTables.map((t) => {
                  const session = t.customerSessions?.find((s) => s.status === 'ACTIVE');
                  const orders = session?.orders ?? [];
                  const unpaidOrders = orders.filter(isOrderUnpaid);
                  const totalDue = unpaidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
                  const isCompletedByWaiter = unpaidOrders.length > 0 && unpaidOrders.some((o) => o.status === 'COMPLETED');
                  const isSelected = selectedTable?.id === t.id;

                  const cardBorder = isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(42,254,183,0.15)] ring-1 ring-primary'
                    : isCompletedByWaiter
                    ? 'border-purple-500/70 bg-purple-500/5 hover:border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
                    : 'border-border bg-card hover:border-primary/30';

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTable(t);
                        setTxReference('');
                      }}
                      className={`flex flex-col rounded-xl border p-4 text-left transition-all cursor-pointer ${cardBorder}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {t.diningArea?.name}
                        </span>
                        {isCompletedByWaiter && (
                          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-300 animate-pulse">
                            🔔 Completed
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-base font-extrabold text-foreground">
                        Table {t.name}
                      </span>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 w-full">
                        <span className="text-[10px] text-muted-foreground">
                          {unpaidOrders.length} Unpaid
                        </span>
                        <span className="text-xs font-black text-primary">
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
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                Billing Settlement Details
              </h2>

              {selectedTable ? (
                (() => {
                  const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
                  const orders = session?.orders ?? [];
                  const unpaidOrders = orders.filter(isOrderUnpaid);
                  const totalAmount = unpaidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

                  if (unpaidOrders.length === 0) {
                    return (
                      <div className="rounded-xl border border-atlas-success/40 bg-atlas-success/10 p-6 text-center space-y-3">
                        <div className="text-2xl">✓</div>
                        <h4 className="text-sm font-bold text-atlas-success">All Bills Settled</h4>
                        <p className="text-xs text-muted-foreground">
                          Table {selectedTable.name} has no pending payments due.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(null)}
                          className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:text-primary transition-all cursor-pointer"
                        >
                          Close Details
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs text-muted-foreground">Processing Bill for:</p>
                        <h3 className="text-lg font-extrabold text-foreground">
                          Table {selectedTable.name} ({selectedTable.diningArea?.name})
                        </h3>
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {unpaidOrders.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg bg-secondary p-2.5 text-xs border border-border"
                          >
                            <div>
                              <span className="font-mono font-bold text-primary">{o.orderNumber}</span>
                              <span
                                className={`ml-2 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                  o.status === 'COMPLETED'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-card text-muted-foreground'
                                }`}
                              >
                                {o.status === 'COMPLETED' ? 'Completed by Waiter' : o.status}
                              </span>
                            </div>
                            <span className="font-bold text-foreground">{formatCurrency(o.totalAmount)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-border pt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">Grand Total Due:</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(totalAmount)}</span>
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-muted-foreground uppercase">
                          Payment Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('CASH')}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              paymentMethod === 'CASH'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border bg-secondary text-muted-foreground'
                            }`}
                          >
                            💵 Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('UPI_INTENT')}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              paymentMethod === 'UPI_INTENT'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border bg-secondary text-muted-foreground'
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
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border bg-secondary text-muted-foreground'
                            }`}
                          >
                            🔀 Mixed
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'MIXED' && (
                        <div className="rounded-xl border border-border bg-secondary p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground">Cash Portion</label>
                              <input
                                type="number"
                                value={splitCashAmount}
                                onChange={(e) => {
                                  setSplitCashAmount(e.target.value);
                                  const cash = Number(e.target.value || 0);
                                  setSplitUpiAmount(String(Math.max(0, totalAmount - cash)));
                                }}
                                className="mt-1 w-full rounded border border-border bg-card p-1.5 text-xs text-foreground"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground">UPI Portion</label>
                              <input
                                type="number"
                                value={splitUpiAmount}
                                onChange={(e) => {
                                  setSplitUpiAmount(e.target.value);
                                  const upi = Number(e.target.value || 0);
                                  setSplitCashAmount(String(Math.max(0, totalAmount - upi)));
                                }}
                                className="mt-1 w-full rounded border border-border bg-card p-1.5 text-xs text-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground uppercase">
                          Transaction Note / Ref
                        </label>
                        <input
                          type="text"
                          value={txReference}
                          onChange={(e) => setTxReference(e.target.value)}
                          placeholder="e.g. Paid at counter / UPI 12345"
                          className="mt-1 w-full rounded-lg border border-border bg-secondary py-2 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTable(null)}
                          className="flex-1 rounded-lg bg-secondary border border-border py-2.5 text-xs font-bold text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleSettleBill}
                          className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-background transition-all hover:bg-primary-hover disabled:opacity-50"
                        >
                          {isProcessing ? 'Settling...' : 'Settle & Clear'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
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
          <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap">
            <button
              type="button"
              onClick={() => setRefundSubTab('REQUESTS')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                refundSubTab === 'REQUESTS'
                  ? 'bg-secondary text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🔔 Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-atlas-error text-foreground px-1.5 py-0.2 text-[9px]">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRefundSubTab('REFUND_HISTORY')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                refundSubTab === 'REFUND_HISTORY'
                  ? 'bg-secondary text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>💰 Refunded Transactions ({refundsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setRefundSubTab('CANCELLED_ORDERS')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                refundSubTab === 'CANCELLED_ORDERS'
                  ? 'bg-secondary text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>❌ Cancelled Orders ({cancelledOrders.length})</span>
            </button>
          </div>

          {/* SUB-VIEW: PENDING REQUESTS */}
          {refundSubTab === 'REQUESTS' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center space-y-2">
                  <div className="text-3xl">✨</div>
                  <h3 className="text-sm font-bold text-foreground">No Pending Cancellation Requests</h3>
                  <p className="text-xs text-muted-foreground">
                    Requests submitted by Waiters for paid or in-prep orders will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-atlas-warning/30 bg-card p-5 shadow-lg space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-sm font-black text-primary">
                            Order {req.order?.orderNumber}
                          </span>
                          <h4 className="text-xs font-bold text-foreground mt-0.5">
                            {req.order?.table?.name ? `Table ${req.order.table.name}` : 'Takeaway'}
                          </h4>
                        </div>
                        <span className="rounded-full bg-atlas-warning/15 border border-atlas-warning/30 px-2 py-0.5 text-[10px] font-bold text-atlas-warning">
                          Pending Review
                        </span>
                      </div>

                      <div className="rounded-xl bg-secondary p-3 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order Total:</span>
                          <span className="font-bold text-foreground">{formatCurrency(req.order?.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Requested By:</span>
                          <span className="font-semibold text-foreground">{req.requestedByName ?? req.requestedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="font-bold text-atlas-warning">{req.reason}</span>
                        </div>
                        {req.note && (
                          <div className="border-t border-border pt-1.5 text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground">Note:</span> {req.note}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
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
                          className="flex-1 rounded-lg border border-atlas-error/30 bg-atlas-error/10 py-2.5 text-xs font-bold text-atlas-error hover:bg-atlas-error/20"
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
                          className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-background hover:bg-primary-hover"
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
            <div className="table-responsive rounded-xl border border-border bg-card">
              <table className="w-full min-w-[700px] text-left text-xs text-muted-foreground">
                <thead className="bg-secondary font-bold uppercase text-foreground border-b border-border">
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
                <tbody className="divide-y divide-border">
                  {refundsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                        No refunds recorded yet.
                      </td>
                    </tr>
                  ) : (
                    refundsList.map((rf) => (
                      <tr key={rf.id} className="hover:bg-secondary/30">
                        <td className="py-2.5 px-4">
                          {rf.processedAt ? new Date(rf.processedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-primary">
                          {rf.order?.orderNumber ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-foreground">
                          {rf.order?.table?.name ? `Table ${rf.order.table.name}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-black text-atlas-error">
                          -{formatCurrency(rf.amount)}
                        </td>
                        <td className="py-2.5 px-4">{rf.reason}</td>
                        <td className="py-2.5 px-4 font-semibold text-foreground">
                          {rf.approvedBy ?? 'Staff'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="rounded bg-atlas-success/10 border border-atlas-success/20 px-2 py-0.5 text-[9px] font-bold text-atlas-success">
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
            <div className="table-responsive rounded-xl border border-border bg-card">
              <table className="w-full min-w-[700px] text-left text-xs text-muted-foreground">
                <thead className="bg-secondary font-bold uppercase text-foreground border-b border-border">
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
                <tbody className="divide-y divide-border">
                  {cancelledOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                        No cancelled orders recorded.
                      </td>
                    </tr>
                  ) : (
                    cancelledOrders.map((co) => (
                      <tr key={co.id} className="hover:bg-secondary/30">
                        <td className="py-2.5 px-4">
                          {co.cancelledAt ? new Date(co.cancelledAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-atlas-error">
                          {co.orderNumber}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-foreground">
                          {co.table?.name ? `Table ${co.table.name}` : 'Takeaway'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-foreground">
                          {formatCurrency(co.totalAmount)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-atlas-warning">
                          {co.cancellationReason ?? 'Cancelled'}
                        </td>
                        <td className="py-2.5 px-4 text-foreground">{co.cancelledBy ?? 'Staff'}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{co.cancellationNote ?? '—'}</td>
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
        <div className="table-responsive rounded-xl border border-border bg-card">
          <table className="w-full min-w-[800px] text-left text-xs text-muted-foreground">
            <thead className="bg-secondary font-bold uppercase text-foreground border-b border-border">
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
            <tbody className="divide-y divide-border">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const canRefund = p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED';
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30">
                      <td className="py-2.5 px-4">
                        {p.paidAt ? new Date(p.paidAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-foreground">
                        {p.order?.table?.name ? `Table ${p.order.table.name}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">
                        {p.order?.orderNumber ?? '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="rounded py-0.5 px-1.5 text-[9px] font-bold uppercase bg-secondary border border-border text-foreground">
                          {p.method === 'UPI_INTENT' ? 'UPI' : p.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-primary">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            p.status === 'SUCCESS'
                              ? 'bg-atlas-success/10 text-atlas-success border border-atlas-success/20'
                              : p.status === 'REFUNDED'
                              ? 'bg-atlas-error/10 text-atlas-error border border-atlas-error/20'
                              : p.status === 'PARTIALLY_REFUNDED'
                              ? 'bg-atlas-warning/10 text-atlas-warning border border-atlas-warning/20'
                              : 'bg-zinc-500/10 text-muted-foreground'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">
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
                            className="rounded bg-secondary border border-border px-2.5 py-1 text-[11px] font-bold text-primary hover:border-primary"
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
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {reviewAction === 'APPROVE' ? 'Approve Cancellation & Refund' : 'Reject Cancellation Request'}
            </h3>

            <div className="rounded-xl bg-secondary p-3 text-xs space-y-1.5 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-mono font-bold text-primary">
                  {activeReviewRequest.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(activeReviewRequest.order?.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waiter Reason:</span>
                <span className="font-bold text-atlas-warning">{activeReviewRequest.reason}</span>
              </div>
              {activeReviewRequest.note && (
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> {activeReviewRequest.note}
                </div>
              )}
            </div>

            {reviewAction === 'APPROVE' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Refund Type:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRefund(false);
                        setCustomRefundAmount(String(activeReviewRequest.order?.totalAmount || ''));
                      }}
                      className={`rounded px-2 py-1 text-[11px] font-bold ${
                        !isCustomRefund ? 'bg-primary text-background' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Full (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomRefund(true)}
                      className={`rounded px-2 py-1 text-[11px] font-bold ${
                        isCustomRefund ? 'bg-primary text-background' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Partial Amount
                    </button>
                  </div>
                </div>

                {isCustomRefund && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase">
                      Custom Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Order is already cooked and served to customer"
                  className="mt-1 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReviewRequest(null)}
                className="flex-1 rounded-lg bg-secondary border border-border py-2.5 text-xs font-bold text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReviewSubmit}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${
                  reviewAction === 'APPROVE'
                    ? 'bg-primary text-background hover:bg-primary-hover'
                    : 'bg-atlas-error text-foreground hover:bg-red-600'
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
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Issue Payment Refund</h3>

            <div className="rounded-xl bg-secondary p-3 text-xs space-y-1.5 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-mono font-bold text-primary">
                  {directRefundPayment.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Paid Amount:</span>
                <span className="font-bold text-foreground">{formatCurrency(directRefundPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode:</span>
                <span className="font-semibold text-foreground">{directRefundPayment.method}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={directRefundPayment.amount}
                  value={directRefundAmount}
                  onChange={(e) => setDirectRefundAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">Reason</label>
                <input
                  type="text"
                  value={directRefundReason}
                  onChange={(e) => setDirectRefundReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">Notes</label>
                <input
                  type="text"
                  value={directRefundNote}
                  onChange={(e) => setDirectRefundNote(e.target.value)}
                  placeholder="Optional internal note"
                  className="mt-1 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDirectRefundPayment(null)}
                className="flex-1 rounded-lg bg-secondary border border-border py-2.5 text-xs font-bold text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDirectRefundSubmit}
                className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-background hover:bg-primary-hover disabled:opacity-50"
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
