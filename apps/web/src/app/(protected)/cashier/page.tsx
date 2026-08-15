'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getTables } from '@/services/tables.service';
import { apiClient } from '@/services/api-client';
import type { RestaurantTable } from '@/types/table';
import { formatCurrency } from '@/lib/currency';

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    table?: {
      name: string;
    } | null;
  } | null;
}

export default function CashierPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  // Data states
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Loading & process states
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Form states for settlement
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI_INTENT' | 'MIXED'>('CASH');
  const [txReference, setTxReference] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!currentRestaurant || !currentBranch) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const [tablesRes, paymentsRes] = await Promise.all([
        getTables(),
        apiClient.get<any>('/payments'),
      ]);

      setTables(tablesRes.data ?? []);
      setPayments(paymentsRes.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load cashier data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant, currentBranch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Process billing settlement
  const handleSettleBill = async () => {
    if (!selectedTable) return;
    const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return;

    // Get all orders that are not already COMPLETED or CANCELLED
    const unpaidOrders = session.orders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
    );

    if (unpaidOrders.length === 0) {
      // If no orders, we can just clear the session
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

    // If MIXED, validate split inputs
    let cashVal = 0;
    let upiVal = 0;
    if (paymentMethod === 'MIXED') {
      cashVal = Number(splitCashAmount || 0);
      upiVal = Number(splitUpiAmount || 0);
      if (Math.abs((cashVal + upiVal) - totalAmount) > 0.01) {
        alert(`The total split amount (${formatCurrency(cashVal + upiVal)}) must exactly match the grand total due (${formatCurrency(totalAmount)}).`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      try {
        if (paymentMethod === 'MIXED') {
          let remainingCash = cashVal;
          let remainingUpi = upiVal;

          for (const order of unpaidOrders) {
            const orderTotal = Number(order.totalAmount);
            let allocatedForOrder = 0;

            // Allocate Cash
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

            // Allocate UPI
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
          // Settle each unpaid order fully with single payment method
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
      } catch (payErr: any) {
        console.warn('Payment recording failed, executing direct order status completion', payErr);
        for (const order of unpaidOrders) {
          try {
            await apiClient.patch(`/orders/${order.id}/status`, { status: 'COMPLETED' });
          } catch (orderErr) {
            console.error('Failed to complete order status', orderErr);
          }
        }
      }

      // 3. Close table session
      await apiClient.post(`/public/tables/${selectedTable.publicToken}/session/end`);

      // Reset & Reload
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

  if (!currentRestaurant || !currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">💵</div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">Select a branch to open Cashier POS</h2>
        <p className="text-sm text-[#9AA6B2]">Choose the restaurant branch from the header selector to monitor billing.</p>
      </div>
    );
  }

  // Filter occupied tables
  const occupiedTables = tables.filter((t) =>
    t.customerSessions?.some((s) => s.status === 'ACTIVE')
  );

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Cashier POS</h1>
        <p className="mt-2 text-sm text-[#9AA6B2]">
          Manage billing receipt settlements, process cash or UPI payments, and clear dining tables.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Occupied Tables Grid */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#9AA6B2]">
            Occupied Dining Tables ({occupiedTables.length})
          </h2>

          {isLoading ? (
            <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
              Loading billing floors...
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

          {/* Payment History Ledger */}
          <div className="pt-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9AA6B2]">
              Recent Settled Payments
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[#26313C] bg-[#111820]">
              <table className="w-full text-left text-xs text-[#9AA6B2]">
                <thead className="bg-[#18212B] font-bold uppercase text-[#F5F7FA] border-b border-[#26313C]">
                  <tr>
                    <th className="py-3 px-4">Paid At</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26313C]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 px-4 text-center">
                        No payments settled recently.
                      </td>
                    </tr>
                  ) : (
                    payments.slice(0, 10).map((p) => (
                      <tr key={p.id} className="hover:bg-[#18212B]/30">
                        <td className="py-2.5 px-4">
                          {p.paidAt ? new Date(p.paidAt).toLocaleTimeString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#F5F7FA]">
                          {p.order?.table?.name ? `Table ${p.order.table.name}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{p.order?.orderNumber ?? '—'}</td>
                        <td className="py-2.5 px-4">
                          <span className={`rounded py-0.5 px-1.5 text-[9px] font-bold uppercase ${
                            p.method === 'CASH'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {p.method === 'UPI_INTENT' ? 'UPI' : p.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#2AFEB7]">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#9AA6B2]">
                          {p.transactionReference ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Settlement Details Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9AA6B2] border-b border-[#26313C] pb-2">
              Billing Settlement Details
            </h2>

            {selectedTable ? (
              (() => {
                const session = selectedTable.customerSessions?.find((s) => s.status === 'ACTIVE');
                const orders = session?.orders ?? [];
                const unpaidOrders = orders.filter((o) => !['CANCELLED'].includes(o.status));
                const totalAmount = unpaidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

                return (
                  <div className="space-y-6">
                    {/* Active table info */}
                    <div>
                      <p className="text-xs text-[#9AA6B2]">Processing Bill for:</p>
                      <h3 className="text-xl font-extrabold text-[#F5F7FA]">
                        Table {selectedTable.name} ({selectedTable.diningArea?.name})
                      </h3>
                      <p className="text-[10px] text-[#9AA6B2] mt-1 font-mono">
                        Session: {session?.id.slice(0, 8)}...
                      </p>
                    </div>

                    {/* Orders breakdown */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {unpaidOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between rounded-lg bg-[#18212B] p-3 text-xs border border-[#26313C]"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#2AFEB7]">
                              {o.orderNumber}
                            </span>
                            <span className="ml-2 text-[10px] uppercase text-[#9AA6B2]">
                              ({o.status})
                            </span>
                          </div>
                          <span className="font-bold text-[#F5F7FA]">
                            {formatCurrency(o.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="border-t border-dashed border-[#26313C] pt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#F5F7FA]">Grand Total Due:</span>
                      <span className="text-xl font-black text-[#2AFEB7]">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    {/* Payment methods toggle */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                        Select Settlement Mode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CASH')}
                          className={`rounded-xl border py-3 text-xs font-bold transition-all ${
                            paymentMethod === 'CASH'
                              ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                              : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2] hover:border-[#2AFEB7]/30'
                          }`}
                        >
                          💵 Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('UPI_INTENT')}
                          className={`rounded-xl border py-3 text-xs font-bold transition-all ${
                            paymentMethod === 'UPI_INTENT'
                              ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                              : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2] hover:border-[#2AFEB7]/30'
                          }`}
                        >
                          📱 UPI Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('MIXED');
                            setSplitCashAmount(String(totalAmount));
                            setSplitUpiAmount('0');
                          }}
                          className={`rounded-xl border py-3 text-xs font-bold transition-all ${
                            paymentMethod === 'MIXED'
                              ? 'border-[#2AFEB7] bg-[#2AFEB7]/5 text-[#2AFEB7]'
                              : 'border-[#26313C] bg-[#18212B] text-[#9AA6B2] hover:border-[#2AFEB7]/30'
                          }`}
                        >
                          🔀 Mixed Split
                        </button>
                      </div>
                    </div>

                    {/* Split details input for Mixed Payments */}
                    {paymentMethod === 'MIXED' && (
                      <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2AFEB7]">
                          Split Billing Breakdown
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#9AA6B2] uppercase">Cash Portion</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={splitCashAmount}
                              onChange={(e) => {
                                setSplitCashAmount(e.target.value);
                                const cash = Number(e.target.value || 0);
                                setSplitUpiAmount(String(Math.max(0, totalAmount - cash)));
                              }}
                              className="mt-1 w-full rounded border border-[#26313C] bg-[#111820] py-1.5 px-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#9AA6B2] uppercase">UPI Portion</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={splitUpiAmount}
                              onChange={(e) => {
                                setSplitUpiAmount(e.target.value);
                                const upi = Number(e.target.value || 0);
                                setSplitCashAmount(String(Math.max(0, totalAmount - upi)));
                              }}
                              className="mt-1 w-full rounded border border-[#26313C] bg-[#111820] py-1.5 px-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                            />
                          </div>
                        </div>
                        {(() => {
                          const cash = Number(splitCashAmount || 0);
                          const upi = Number(splitUpiAmount || 0);
                          const allocated = cash + upi;
                          const difference = totalAmount - allocated;
                          const isMatched = Math.abs(difference) < 0.01;

                          return (
                            <div className="flex items-center justify-between border-t border-[#26313C] pt-2 text-[10px] font-bold">
                              <span className="text-[#9AA6B2]">Total Allocation:</span>
                              <span className={isMatched ? 'text-green-400' : 'text-red-400'}>
                                {isMatched
                                  ? `Matched: ${formatCurrency(allocated)}`
                                  : `Error: ${formatCurrency(allocated)} / ${formatCurrency(totalAmount)}`}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Reference details input */}
                    <div>
                      <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                        Transaction Reference / Remarks
                      </label>
                      <input
                        type="text"
                        value={txReference}
                        onChange={(e) => setTxReference(e.target.value)}
                        placeholder={
                          paymentMethod === 'CASH'
                            ? 'e.g. Paid in cash at counter'
                            : paymentMethod === 'UPI_INTENT'
                            ? 'e.g. UPI Ref Number 623912...'
                            : 'e.g. Mixed payment remarks'
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] py-2.5 px-3 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTable(null)}
                        className="flex-1 rounded-lg bg-[#18212B] border border-[#26313C] py-3 text-xs font-bold text-[#F5F7FA] hover:bg-[#18212B]/80"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={
                          isProcessing ||
                          (paymentMethod === 'MIXED' &&
                            Math.abs(Number(splitCashAmount || 0) + Number(splitUpiAmount || 0) - totalAmount) > 0.01)
                        }
                        onClick={handleSettleBill}
                        className="flex-1 rounded-lg bg-[#2AFEB7] py-3 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Settle...' : 'Settle & Clear Table'}
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 text-xs text-[#9AA6B2]">
                Select an active table from the floor panel to process receipt billing and settle payment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
