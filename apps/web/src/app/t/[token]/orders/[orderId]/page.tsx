'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { Order } from '@/types/order';
import { getPublicOrderById } from '@/services/orders.service';
import { formatCurrency } from '@/lib/currency';
import { apiClient } from '@/services/api-client';

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-[#EAB308]/15', text: 'text-[#EAB308]', border: 'border-[#EAB308]/30' },
  CONFIRMED: { bg: 'bg-[#3B82F6]/15', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30' },
  PREPARING: { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  READY: { bg: 'bg-[#22C55E]/15', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' },
  SERVED: { bg: 'bg-[#2AFEB7]/15', text: 'text-[#2AFEB7]', border: 'border-[#2AFEB7]/30' },
  COMPLETED: { bg: 'bg-[#9AA6B2]/15', text: 'text-[#9AA6B2]', border: 'border-[#9AA6B2]/30' },
  CANCELLED: { bg: 'bg-[#EF4444]/15', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' },
};

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ token: string; orderId: string }>;
}) {
  const { token, orderId } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  const handleCallStaff = async (type: string) => {
    const backendType = type === 'Waiter' ? 'WAITER' : type === 'Water' ? 'WATER' : 'BILL';
    try {
      await apiClient.post(`/public/tables/${token}/call`, { type: backendType });
      setActiveRequest(type === 'Waiter' ? 'Waiter Call' : type === 'Water' ? 'Water Request' : 'Bill Request');
      // Clear dispatch confirmation after 8 seconds
      setTimeout(() => {
        setActiveRequest(null);
      }, 8000);
    } catch (err) {
      console.error(err);
      alert('Failed to summon staff assistance. Please try again.');
    }
  };

  const loadOrder = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await getPublicOrderById(token, orderId);
      setOrder(response.data);
      setError(null);
    } catch {
      setError('Unable to load order details');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    // Initial fetch
    void loadOrder(true);

    // Poll every 3 seconds
    const interval = setInterval(() => {
      void loadOrder(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadOrder]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-[#111820]" />
          <div className="h-40 rounded-2xl bg-[#111820]" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[#EF4444]/30 bg-[#111820] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10 text-2xl text-[#EF4444]">
            ⚠️
          </div>
          <p className="text-sm font-bold">Order Not Found</p>
          <p className="text-xs text-[#9AA6B2]">{error}</p>
          <Link
            href={`/t/${token}/menu`}
            className="inline-block rounded-xl border border-[#26313C] px-4 py-2 text-xs font-semibold text-[#9AA6B2]"
          >
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0; // Placed
      case 'PREPARING':
        return 1; // Preparing
      case 'READY':
        return 2; // Ready
      case 'SERVED':
      case 'COMPLETED':
        return 3; // Served
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const steps = [
    { label: 'Ordered', desc: 'Sent to kitchen', icon: '📝' },
    { label: 'Preparing', desc: 'Cooking your meal', icon: '🍳' },
    { label: 'Ready', desc: 'At the counter', icon: '🔔' },
    { label: 'Served', desc: 'Enjoy your food!', icon: '🍽️' },
  ];

  const getStageTip = (step: number) => {
    if (isCancelled) return 'This order was cancelled. Please contact staff if you have questions.';
    switch (step) {
      case 0:
        return 'Your order has been received by the kitchen and is in the preparation queue.';
      case 1:
        return 'Our chef is preparing your fresh meal right now. Sit back and relax!';
      case 2:
        return 'Your order is hot and ready! The waiter is bringing it to your table now.';
      case 3:
        return 'Enjoy your delicious meal! Let us know if you need anything else.';
      default:
        return '';
    }
  };

  const style = STATUS_COLOR[order.status] ?? STATUS_COLOR.PENDING;

  return (
    <main className="min-h-screen bg-[#0B0F14] pb-8 text-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black">Order Details</h1>
            <p className="text-[11px] text-[#9AA6B2]">
              {order.branch?.name ?? 'Restaurant'} • {order.table?.name ?? 'Table'}
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="rounded-xl border border-[#26313C] px-3 py-2 text-[11px] font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]"
          >
            View Menu
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {/* Status Header & Live Stepper */}
        <div className="space-y-6 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl relative overflow-hidden">
          {/* Neon side accents */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2AFEB7]/60" />
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA6B2]">
                Order Token
              </span>
              <h2 className="text-2xl font-black font-mono text-[#F5F7FA] tracking-tight">
                #{order.orderNumber}
              </h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {order.status}
            </span>
          </div>

          {isCancelled ? (
            <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs font-bold text-[#EF4444] mt-1">Order Cancelled</p>
              <p className="text-[11px] text-[#9AA6B2] mt-0.5">This transaction has been cancelled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stepper bubbles */}
              <div className="relative flex justify-between items-center px-2">
                {/* Connecting track line */}
                <div className="absolute left-6 right-6 top-5 h-0.5 bg-[#26313C] -z-10" />
                <div
                  className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-[#2AFEB7] to-[#22E5A4] transition-all duration-1000 -z-10"
                  style={{
                    width: `${(currentStep / (steps.length - 1)) * 90}%`,
                  }}
                />

                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  
                  let bubbleClass = 'border-[#26313C] bg-[#111820] text-[#9AA6B2]';
                  if (isCompleted) {
                    bubbleClass = 'border-[#2AFEB7] bg-[#2AFEB7]/10 text-[#2AFEB7]';
                  } else if (isActive) {
                    bubbleClass = 'border-[#2AFEB7] bg-[#2AFEB7] text-[#0B0F14] shadow-[0_0_12px_#2AFEB7] scale-110';
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 relative">
                      {/* Stepper circle bubble */}
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-base transition-all duration-500 ${bubbleClass}`}>
                        {isActive && !isCompleted ? (
                          <span className="relative flex h-5 w-5 items-center justify-center text-sm">
                            {step.icon}
                          </span>
                        ) : (
                          step.icon
                        )}
                      </div>
                      
                      <div className="text-center">
                        <span className={`text-[10px] font-bold ${isActive ? 'text-[#2AFEB7]' : isCompleted ? 'text-[#F5F7FA]' : 'text-[#9AA6B2]'}`}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current Active Status detail text */}
              <div className="rounded-xl border border-[#26313C] bg-[#0B0F14]/50 p-3.5 text-center transition-all">
                <p className="text-xs font-bold text-[#2AFEB7] flex items-center justify-center gap-1.5">
                  {currentStep === 3 ? '🎉 ' : '🍳 '}
                  {steps[currentStep].label}: {steps[currentStep].desc}
                </p>
                <p className="text-[11px] leading-relaxed text-[#9AA6B2] mt-1">
                  {getStageTip(currentStep)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
            Items Ordered
          </h3>

          <div className="divide-y divide-[#26313C]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2AFEB7]">{item.quantity}x</span>
                    <h4 className="text-xs font-bold">{item.name}</h4>
                  </div>

                  {item.variants.length > 0 && (
                    <p className="pl-5 text-[11px] text-[#9AA6B2]">
                      {item.variants.map((v) => v.name).join(' • ')}
                    </p>
                  )}

                  {item.addons.length > 0 && (
                    <ul className="pl-5 space-y-0.5">
                      {item.addons.map((a) => (
                        <li key={a.id} className="text-[11px] text-[#9AA6B2]">
                          + {a.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <span className="text-xs font-bold text-[#F5F7FA]">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Bill Breakdown */}
        <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4 print-receipt-only print-border-dark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2] print-text-dark">
            Bill Breakdown
          </h3>

          <div className="space-y-2 text-xs print-text-dark">
            <div className="flex justify-between text-[#9AA6B2] print-text-dark">
              <span>Subtotal</span>
              <span className="font-semibold text-[#F5F7FA] print-text-dark">{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.taxAmount) > 0 && (
              <>
                <div className="flex justify-between text-[#9AA6B2] print-text-dark pl-2">
                  <span>CGST (2.5%)</span>
                  <span className="font-semibold text-[#F5F7FA] print-text-dark">{formatCurrency(Number(order.taxAmount) / 2)}</span>
                </div>
                <div className="flex justify-between text-[#9AA6B2] print-text-dark pl-2">
                  <span>SGST (2.5%)</span>
                  <span className="font-semibold text-[#F5F7FA] print-text-dark">{formatCurrency(Number(order.taxAmount) / 2)}</span>
                </div>
              </>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-[#22C55E] print-text-dark">
                <span>Discount</span>
                <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#26313C] print-border-dark pt-2 text-sm font-bold print-text-dark">
              <span className="text-[#F5F7FA] print-text-dark">Total Paid / Due</span>
              <span className="text-[#2AFEB7] print-text-dark">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Printable POS CSS overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body, main, html {
              background: white !important;
              color: black !important;
            }
            header, .no-print {
              display: none !important;
            }
            .print-receipt-only {
              display: block !important;
              border: none !important;
              background: white !important;
              color: black !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              padding: 10px !important;
            }
            .print-text-dark {
              color: black !important;
            }
            .print-border-dark {
              border-color: black !important;
            }
          }
        `}} />

        {/* Table Assistance Controls */}
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 space-y-3 no-print shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
            Table Assistance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCallStaff('Waiter')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95"
            >
              <span className="text-lg">🙋‍♂️</span>
              <span className="mt-1 text-[10px] font-bold text-[#F5F7FA]">Call Waiter</span>
            </button>
            <button
              type="button"
              onClick={() => handleCallStaff('Water')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95"
            >
              <span className="text-lg">💧</span>
              <span className="mt-1 text-[10px] font-bold text-[#F5F7FA]">Request Water</span>
            </button>
            <button
              type="button"
              onClick={() => handleCallStaff('Bill')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95"
            >
              <span className="text-lg">💵</span>
              <span className="mt-1 text-[10px] font-bold text-[#F5F7FA]">Request Bill</span>
            </button>
          </div>

          {activeRequest && (
            <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 p-3 text-center animate-pulse">
              <p className="text-xs font-bold text-[#2AFEB7]">
                🔔 {activeRequest} Dispatched
              </p>
              <p className="text-[10px] text-[#9AA6B2] mt-0.5 leading-relaxed">
                Staff has been notified. A server is attending to table <span className="text-[#F5F7FA] font-bold">{order.table?.name ?? 'your table'}</span> shortly.
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3 pt-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full rounded-xl bg-[#18212B] border border-[#26313C] py-3 text-center text-xs font-bold text-[#F5F7FA] transition-all hover:border-[#2AFEB7]/60 active:scale-[0.99]"
          >
            🖨️ Print Receipt
          </button>
          <div className="flex gap-3">
            <Link
              href={`/t/${token}/orders`}
              className="flex-1 rounded-xl border border-[#26313C] bg-[#18212B] py-3 text-center text-xs font-bold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]/40"
            >
              Order History
            </Link>
            <Link
              href={`/t/${token}/menu`}
              className="flex-1 rounded-xl bg-[#2AFEB7] py-3 text-center text-xs font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4]"
            >
              Order More Items
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
