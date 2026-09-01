'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import type { Order } from '@/types/order';
import { getPublicOrderById, getPublicOrders } from '@/services/orders.service';
import { formatCurrency } from '@/lib/currency';
import { apiClient } from '@/services/api-client';
import { getPaymentSettings } from '@/lib/payment-settings';
import { printThermalReceipt } from '@/lib/receipt-printer';

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-atlas-warning/15', text: 'text-atlas-warning', border: 'border-atlas-warning/30' },
  CONFIRMED: { bg: 'bg-atlas-info/15', text: 'text-atlas-info', border: 'border-atlas-info/30' },
  PREPARING: { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  READY: { bg: 'bg-atlas-success/15', text: 'text-atlas-success', border: 'border-atlas-success/30' },
  SERVED: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  COMPLETED: { bg: 'bg-muted-foreground/15', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
  CANCELLED: { bg: 'bg-atlas-error/15', text: 'text-atlas-error', border: 'border-atlas-error/30' },
};

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ token: string; orderId: string }>;
}) {
  const { token, orderId: initialOrderId } = use(params);

  const [activeOrderId, setActiveOrderId] = useState<string>(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showAllItemsModal, setShowAllItemsModal] = useState(false);
  const [sessionSettled, setSessionSettled] = useState(false);

  const orderRef = useRef<Order | null>(null);
  orderRef.current = order;
  const activeOrderIdRef = useRef<string>(initialOrderId);
  activeOrderIdRef.current = activeOrderId;

  const handleCallStaff = async (type: string) => {
    const backendType = type === 'Waiter' ? 'WAITER' : type === 'Water' ? 'WATER' : 'BILL';
    try {
      await apiClient.post(`/public/tables/${token}/call`, { type: backendType });
      setActiveRequest(type === 'Waiter' ? 'Waiter Call' : type === 'Water' ? 'Water Request' : 'Bill Request');
      setTimeout(() => {
        setActiveRequest(null);
      }, 8000);
    } catch (err) {
      console.error(err);
      alert('Failed to summon staff assistance. Please try again.');
    }
  };

  const handleConfirmTablePayment = async () => {
    setPaymentConfirmed(true);
    try {
      await apiClient.post(`/public/tables/${token}/call`, { type: 'BILL' });
      setActiveRequest('Payment Notification');
      setTimeout(() => {
        setActiveRequest(null);
      }, 8000);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading && !orderRef.current) setIsLoading(true);
    try {
      // 1. Fetch all orders for this table session
      const listRes = await getPublicOrders(token);
      const ordersList = listRes.data ?? [];
      
      if (ordersList.length > 0) {
        setSessionOrders(ordersList);

        // 2. Resolve active order: either user-selected, or initial, or most recent
        const targetId = activeOrderIdRef.current || initialOrderId;
        let selected = ordersList.find((o) => o.id === targetId) || ordersList[0];

        if (selected) {
          setActiveOrderId(selected.id);
          activeOrderIdRef.current = selected.id;
          const detailRes = await getPublicOrderById(token, selected.id);
          setOrder(detailRes.data);
          orderRef.current = detailRes.data;
        }
      } else if (orderRef.current) {
        // Table session was settled/cleared by cashier
        setSessionSettled(true);
      } else if (initialOrderId) {
        const singleRes = await getPublicOrderById(token, initialOrderId);
        if (singleRes.data) {
          setOrder(singleRes.data);
          orderRef.current = singleRes.data;
        }
      }

      setError(null);
    } catch {
      // Only show error on initial load failure without any existing order
      if (showLoading && !orderRef.current) {
        setError('Unable to load order details');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [token, initialOrderId]);

  useEffect(() => {
    void loadData(true);

    // Poll every 3 seconds for real-time order status updates
    const interval = setInterval(() => {
      void loadData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-card" />
          <div className="h-40 rounded-2xl bg-card" />
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl text-primary border border-primary/30">
            ☕
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Welcome to Kafei</h2>
            <p className="text-xs text-muted-foreground">
              No active order found for this table session.
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="inline-block w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-background shadow-md transition-all hover:bg-primary-hover active:scale-95"
          >
            Browse Menu & Order
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
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
  const isFoodServed = order.status === 'SERVED';
  const isOrderCompleted = order.status === 'COMPLETED';

  // Anti-Spoofing: Once settled/paid, no further items can be added from this device
  const isPaidOrSettled =
    paymentConfirmed ||
    sessionSettled ||
    order.status === 'COMPLETED' ||
    order.payments?.some((p: any) => p.status === 'SUCCESS' || p.status === 'COMPLETED') ||
    (sessionOrders.length > 0 &&
      sessionOrders.every((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED'));

  const steps = [
    { label: 'Ordered', desc: 'Sent to kitchen', icon: '📝' },
    { label: 'Preparing', desc: 'Cooking your meal', icon: '🍳' },
    { label: 'Ready', desc: 'At the counter', icon: '🔔' },
    { label: 'Served', desc: 'Enjoy your food!', icon: '🍽️' },
  ];

  const getStageTip = (step: number) => {
    if (isCancelled) return 'This order was cancelled. Please contact staff if you have questions.';
    if (isPaidOrSettled) return 'Payment completed! Thank you for dining with us at Kafei.';
    if (isOrderCompleted) return 'Dining session completed! Please scan the UPI QR below to pay your bill or visit the cashier.';
    switch (step) {
      case 0:
        return 'Your order has been received by the kitchen and is in the preparation queue.';
      case 1:
        return 'Our chef is preparing your fresh meal right now. Sit back and relax!';
      case 2:
        return 'Your order is hot and ready! The waiter is bringing it to your table now.';
      case 3:
        return 'Food served! Enjoy your delicious meal. 🍽️';
      default:
        return '';
    }
  };

  const style = STATUS_COLOR[order.status] ?? STATUS_COLOR.PENDING;

  // Session Totals across all non-cancelled orders
  const activeSessionOrders = sessionOrders.filter((o) => o.status !== 'CANCELLED');
  const sessionGrandTotal = (activeSessionOrders.length > 0 ? activeSessionOrders : [order]).reduce(
    (acc, o) => acc + Number(o.totalAmount || 0),
    0,
  );

  // Determine order index and label (Old Order vs New Order)
  const currentOrderIdx = sessionOrders.findIndex((o) => o.id === order.id);
  const isOldOrder = currentOrderIdx === 0 && sessionOrders.length > 1;
  const isNewOrder = currentOrderIdx === sessionOrders.length - 1 && sessionOrders.length > 1;
  const roundLabel = isOldOrder
    ? 'Old Order (Round 1)'
    : isNewOrder
    ? 'New Order (Round 2)'
    : sessionOrders.length > 1
    ? `Round ${currentOrderIdx + 1}`
    : 'Order Token';

  // UPI payment QR generation for paying from the seat
  const paymentConfig = getPaymentSettings(order.branchId || undefined);
  const restaurantName = paymentConfig.payeeName || order.branch?.name || 'Restaurant';
  const upiPayee = paymentConfig.upiId || 'atlaspay@okaxis';
  const paymentAmount = sessionOrders.length > 1 ? sessionGrandTotal : order.totalAmount;
  const upiUri = `upi://pay?pa=${upiPayee}&pn=${encodeURIComponent(restaurantName)}&am=${paymentAmount}&cu=INR&tn=Table_${encodeURIComponent(order.table?.name || 'T1')}_Orders_${sessionOrders.map((o) => o.orderNumber).join('_')}`;
  const qrCodeImgUrl = paymentConfig.customQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}&margin=10`;

  const handlePrintCustomerReceipt = () => {
    if (!order) return;
    const activeList = sessionOrders.length > 0 ? sessionOrders : [order];
    printThermalReceipt({
      restaurantName: restaurantName || 'Kafei',
      branchName: order.branch?.name || 'Main Branch',
      tableName: order.table?.name || 'Table',
      dateTime: new Date(order.createdAt).toLocaleString(),
      orders: activeList.map((o) => ({
        orderNumber: o.orderNumber,
        totalAmount: Number(o.totalAmount || 0),
        items: (o.items ?? []).map((it: any) => ({
          name: it.name,
          quantity: it.quantity,
          totalPrice: Number(it.totalPrice || 0),
        })),
      })),
      grandTotal: paymentAmount,
      taxAmount: order.taxAmount,
    });
  };

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      {/* Printable Thermal Receipt (80mm POS Roll) */}
      <div id="printable-receipt" className="hidden print:block text-black bg-foreground font-mono text-xs w-[76mm] mx-auto p-1 leading-tight">
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <h2 className="text-sm font-black uppercase tracking-wider">{restaurantName}</h2>
          <p className="text-[10px]">{order.branch?.name}</p>
          <p className="mt-1 font-bold text-xs">TABLE {order.table?.name}</p>
          <p className="text-[9px] text-gray-700">{new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div className="space-y-2 border-b border-dashed border-black pb-2 mb-2">
          {sessionOrders.map((o) => (
            <div key={o.id} className="space-y-1">
              <div className="flex justify-between font-bold text-[10px] border-b border-dotted pb-0.5">
                <span>Token #{o.orderNumber}</span>
                <span>{formatCurrency(o.totalAmount)}</span>
              </div>
              {o.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-[10px]">
                  <span className="truncate pr-1">{item.quantity}x {item.name}</span>
                  <span className="font-bold shrink-0">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-1 border-b border-dashed border-black pb-2 mb-2 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency((order as any).subtotalAmount || order.totalAmount)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>GST Tax:</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(paymentAmount)}</span>
          </div>
        </div>

        <div className="text-center text-[9px] text-gray-800 pt-1">
          <p className="font-bold">*** THANK YOU FOR DINING WITH US ***</p>
          <p className="text-[8px] text-gray-600 mt-0.5">Please visit again</p>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur no-print">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black">Table Orders Tracker</h1>
            <p className="text-[11px] text-muted-foreground">
              {order.branch?.name ?? 'Restaurant'} • {order.table?.name ?? 'Table'}
            </p>
          </div>
          {!isPaidOrSettled ? (
            <Link
              href={`/t/${token}/menu`}
              className="rounded-xl border border-border px-3 py-2 text-[11px] font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              + Add More Items
            </Link>
          ) : (
            <span className="rounded-xl border border-atlas-success/30 bg-atlas-success/15 px-3 py-1 text-[10px] font-bold text-atlas-success">
              ✓ Paid
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4 no-print">
        {/* MULTI-ORDER TOKEN SWITCHER (If customer added more items) */}
        {sessionOrders.length > 1 && (
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-secondary to-card p-3.5 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                Active Table Orders ({sessionOrders.length})
              </span>
              <span className="text-[11px] font-black text-primary">
                Total: {formatCurrency(sessionGrandTotal)}
              </span>
            </div>

            {/* Token Switcher Pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {sessionOrders.map((o, idx) => {
                const isSelected = o.id === order.id;
                const isOld = idx === 0;
                const isNew = idx === sessionOrders.length - 1;
                const itemQty = o.items?.reduce((acc, it) => acc + it.quantity, 0) || o.items?.length || 0;
                const oStyle = STATUS_COLOR[o.status] ?? STATUS_COLOR.PENDING;

                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActiveOrderId(o.id)}
                    className={`flex-1 min-w-[135px] rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(42,254,183,0.25)] scale-[1.02]'
                        : 'border-border bg-background/70 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isOld ? 'Old Order (R1)' : isNew ? 'New Order (R2)' : `Round ${idx + 1}`}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold border ${oStyle.bg} ${oStyle.text} ${oStyle.border}`}>
                        {o.status}
                      </span>
                    </div>

                    <p className="font-mono text-xs font-black text-foreground mt-1 flex items-center gap-1">
                      <span>Token:</span>
                      <span className="text-primary">#{o.orderNumber}</span>
                    </p>

                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {itemQty} {itemQty === 1 ? 'item' : 'items'} • {formatCurrency(o.totalAmount)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Header & Live Stepper for Selected Token */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
          {/* Neon side accents */}
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/60" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {roundLabel}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-semibold">Token:</span>
                <h2 className="text-2xl font-black font-mono text-foreground tracking-tight">
                  #{order.orderNumber}
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {order.status}
            </span>
          </div>

          {isCancelled ? (
            <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-4 text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs font-bold text-atlas-error mt-1">Order Cancelled</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">This transaction has been cancelled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stepper bubbles */}
              <div className="relative flex justify-between items-center px-2">
                {/* Connecting track line */}
                <div className="absolute left-6 right-6 top-5 h-0.5 bg-border -z-10" />
                <div
                  className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-primary to-primary-hover transition-all duration-1000 -z-10"
                  style={{
                    width: `${(currentStep / (steps.length - 1)) * 90}%`,
                  }}
                />

                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  
                  let bubbleClass = 'border-border bg-card text-muted-foreground';
                  if (isCompleted) {
                    bubbleClass = 'border-primary bg-primary/10 text-primary';
                  } else if (isActive) {
                    bubbleClass = 'border-primary bg-primary text-background shadow-[0_0_12px_#34D399] scale-110';
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
                        <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current Active Status detail text */}
              <div className="rounded-xl border border-border bg-background/50 p-3.5 text-center transition-all">
                <p className="text-xs font-bold text-primary flex items-center justify-center gap-1.5">
                  {currentStep === 3 ? '🎉 ' : '🍳 '}
                  {steps[currentStep].label}: {steps[currentStep].desc}
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">
                  {getStageTip(currentStep)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MEAL SERVED BANNER (Shown when food is served and customer is dining) */}
        {isFoodServed && !isPaidOrSettled && (
          <div className="space-y-3 rounded-2xl border border-primary/30 bg-gradient-to-b from-secondary to-card p-4 text-center shadow-lg animate-fadeIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-2xl">
              🍽️
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Food Served • Enjoy Your Meal!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your food has been served hot & fresh. When you are ready to bill, staff will complete the order and your payment QR will appear here.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Link
                href={`/t/${token}/menu`}
                className="flex-1 rounded-xl border border-border bg-background py-2 text-center text-xs font-bold text-primary hover:border-primary/40 transition-colors"
              >
                + Add More Items
              </Link>
              <button
                type="button"
                onClick={() => handleCallStaff('Water')}
                className="flex-1 rounded-xl border border-border bg-background py-2 text-center text-xs font-bold text-foreground hover:border-primary/40 transition-colors cursor-pointer"
              >
                💧 Request Water
              </button>
            </div>
          </div>
        )}

        {/* POST-MEAL COMPLETED & PAID: THANK YOU / COME BACK AGAIN BANNER */}
        {isPaidOrSettled && (
          <div className="space-y-4 rounded-3xl border-2 border-primary/50 bg-gradient-to-b from-card via-card to-background p-6 text-center shadow-2xl animate-fadeIn relative overflow-hidden">
            {/* Top red accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-primary to-red-600" />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-3xl shadow-lg border border-primary/30">
              ☕
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 border border-atlas-success/30 px-3 py-1 text-xs font-bold text-atlas-success">
                <span>✓</span> Payment Completed
              </div>
              <h2 className="text-xl font-black text-foreground pt-1">
                Thank You for Dining With Us!
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                We loved serving you at <strong className="text-foreground">{restaurantName || 'Kafei'}</strong>. We hope you had a wonderful time!
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 p-4 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground pb-2 border-b border-border">
                <span>Amount Paid:</span>
                <span className="text-base font-black text-primary">{formatCurrency(paymentAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Table: <strong className="text-foreground">{order.table?.name || 'Table'}</strong></span>
                <span>Orders: <strong className="text-foreground">{sessionOrders.length > 0 ? sessionOrders.length : 1} round(s)</strong></span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handlePrintCustomerReceipt}
                className="w-full rounded-xl bg-primary py-3.5 text-center text-xs font-bold text-background shadow-md transition-all hover:bg-primary-hover active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Download / Print Bill Receipt
              </button>
            </div>

            <p className="text-[11px] font-bold text-primary pt-1">
              ✨ Please come back again soon! ✨
            </p>
          </div>
        )}

        {/* POST-MEAL PAYMENT SECTION (Displayed when order completed but not yet marked paid) */}
        {isOrderCompleted && !isPaidOrSettled && (
          <div className="space-y-4 rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-secondary to-card p-5 relative overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs">
                  💳
                </span>
                <h3 className="text-sm font-black text-foreground">
                  Pay From Seat or Cashier
                </h3>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Order Completed
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {sessionOrders.length > 1
                ? `Scan below to pay the combined total for all ${sessionOrders.length} orders at this table, or visit the cashier.`
                : 'Scan the QR code below to pay directly from your seat via UPI, or visit the cashier counter.'}
            </p>

            {/* Clickable QR Code Card for Screenshot / Enlargement */}
            <div
              onClick={() => setIsQrModalOpen(true)}
              className="group cursor-pointer rounded-xl border border-border bg-background p-4 flex flex-col items-center text-center transition-all hover:border-primary active:scale-[0.99]"
            >
              <div className="relative rounded-xl bg-foreground p-2.5 shadow-md">
                <img
                  src={qrCodeImgUrl}
                  alt="Payment QR Code"
                  className="h-36 w-36 object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-[2px]">
                  <span className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-background shadow-md">
                    🔍 Tap to Enlarge
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-sm font-black text-primary">
                  {formatCurrency(paymentAmount)}
                </p>
                {sessionOrders.length > 1 && (
                  <p className="text-[10px] font-bold text-primary/90">
                    Combined Total ({sessionOrders.length} Orders)
                  </p>
                )}
                <p className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                  <span>📸</span> Click QR to enlarge & capture screenshot
                </p>
              </div>
            </div>

            {/* Action Buttons for Paying */}
            <div className="space-y-2 pt-1">
              <a
                href={upiUri}
                className="block w-full rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-background shadow-md transition-all hover:bg-primary-hover active:scale-95"
              >
                Pay via UPI App (GPay / PhonePe / Paytm)
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCallStaff('Bill')}
                  className="flex-1 rounded-xl border border-border bg-secondary py-2 text-center text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 cursor-pointer"
                >
                  💵 Pay at Cashier
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTablePayment}
                  className="flex-1 rounded-xl border border-atlas-success/40 bg-atlas-success/15 py-2 text-center text-[11px] font-bold text-atlas-success transition-colors hover:bg-atlas-success/25 cursor-pointer"
                >
                  ✓ I Have Paid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ordered Items List for Current Token */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Items in Token #{order.orderNumber}
            </h3>
            <span className="text-[11px] font-semibold text-primary">
              {order.items.reduce((acc, it) => acc + it.quantity, 0)} items
            </span>
          </div>

          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">{item.quantity}x</span>
                    <h4 className="text-xs font-bold">{item.name}</h4>
                  </div>

                  {item.variants && item.variants.length > 0 && (
                    <p className="pl-5 text-[11px] text-muted-foreground">
                      {item.variants.map((v) => v.name).join(' • ')}
                    </p>
                  )}

                  {item.addons && item.addons.length > 0 && (
                    <ul className="pl-5 space-y-0.5">
                      {item.addons.map((a) => (
                        <li key={a.id} className="text-[11px] text-muted-foreground">
                          + {a.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <span className="text-xs font-bold text-foreground">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ALL SESSION ORDERS BREAKDOWN ACCORDION (If multiple orders exist) */}
        {sessionOrders.length > 1 && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                All Table Rounds Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowAllItemsModal(!showAllItemsModal)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {showAllItemsModal ? 'Hide Rounds ▲' : 'Show All Rounds ▼'}
              </button>
            </div>

            {showAllItemsModal && (
              <div className="space-y-3 pt-2 border-t border-border">
                {sessionOrders.map((sOrder, idx) => (
                  <div
                    key={sOrder.id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      sOrder.id === order.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-background/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-primary">
                        Round {idx + 1} (Token #{sOrder.orderNumber})
                      </span>
                      <span className="text-foreground">{formatCurrency(sOrder.totalAmount)}</span>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1">
                      {sOrder.items?.map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span>{it.quantity}x {it.name}</span>
                          <span>{formatCurrency(it.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bill Breakdown */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 print-receipt-only print-border-dark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print-text-dark">
            Bill Breakdown (Token #{order.orderNumber})
          </h3>

          <div className="space-y-2 text-xs print-text-dark">
            <div className="flex justify-between text-muted-foreground print-text-dark">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground print-text-dark">{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.taxAmount) > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground print-text-dark pl-2">
                  <span>CGST (2.5%)</span>
                  <span className="font-semibold text-foreground print-text-dark">{formatCurrency(Number(order.taxAmount) / 2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground print-text-dark pl-2">
                  <span>SGST (2.5%)</span>
                  <span className="font-semibold text-foreground print-text-dark">{formatCurrency(Number(order.taxAmount) / 2)}</span>
                </div>
              </>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-atlas-success print-text-dark">
                <span>Discount</span>
                <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border print-border-dark pt-2 text-sm font-bold print-text-dark">
              <span className="text-foreground print-text-dark">This Token Total</span>
              <span className="text-primary print-text-dark">{formatCurrency(order.totalAmount)}</span>
            </div>

            {sessionOrders.length > 1 && (
              <div className="flex justify-between border-t border-primary/30 pt-2 text-sm font-black text-primary">
                <span>All Orders Grand Total</span>
                <span>{formatCurrency(sessionGrandTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table Assistance Controls (Only active during in-dining session) */}
        {!isPaidOrSettled && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 no-print">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Table Assistance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCallStaff('Waiter')}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary py-3.5 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer"
              >
                <span className="text-lg">🙋‍♂️</span>
                <span className="mt-1 text-[10px] font-bold text-foreground">Call Waiter</span>
              </button>
              <button
                type="button"
                onClick={() => handleCallStaff('Water')}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary py-3.5 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer"
              >
                <span className="text-lg">💧</span>
                <span className="mt-1 text-[10px] font-bold text-foreground">Request Water</span>
              </button>
              <button
                type="button"
                onClick={() => handleCallStaff('Bill')}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary py-3.5 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer"
              >
                <span className="text-lg">💵</span>
                <span className="mt-1 text-[10px] font-bold text-foreground">Request Bill</span>
              </button>
            </div>

            {activeRequest && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center animate-pulse">
                <p className="text-xs font-bold text-primary">
                  🔔 {activeRequest} Dispatched
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  Staff has been notified. A server is attending to table <span className="text-foreground font-bold">{order.table?.name ?? 'your table'}</span> shortly.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Action Links */}
        <div className="flex flex-col gap-3 pt-2 no-print">
          {!isPaidOrSettled && (
            <Link
              href={`/t/${token}/menu`}
              className="w-full rounded-xl bg-primary py-3.5 text-center text-xs font-black text-background shadow-[0_0_15px_rgba(42,254,183,0.3)] transition-all hover:bg-primary-hover active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>🍽️</span> + Add More Food / Order Again
            </Link>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrintCustomerReceipt}
              className="flex-1 rounded-xl bg-secondary border border-border py-3 text-center text-xs font-bold text-foreground transition-all hover:border-primary/60 active:scale-[0.99] cursor-pointer"
            >
              🖨️ Print Receipt
            </button>
            <Link
              href={`/t/${token}/orders`}
              className="flex-1 rounded-xl border border-border bg-secondary py-3 text-center text-xs font-bold text-foreground transition-colors hover:border-primary/40 flex items-center justify-center"
            >
              All Orders ({sessionOrders.length})
            </Link>
          </div>
        </div>
      </div>

      {/* ENLARGED QR CODE MODAL FOR SCREENSHOT / HIGH-RES SCANNING */}
      {isQrModalOpen && (
        <div
          onClick={() => setIsQrModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-primary/40 bg-card p-6 text-center relative"
          >
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-secondary p-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Scan & Pay from Seat
              </span>
              <h3 className="text-lg font-black text-foreground">
                {restaurantName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Table: {order.table?.name ?? 'Dine In'} • {sessionOrders.length > 1 ? `${sessionOrders.length} Orders Combined` : `Token: #${order.orderNumber}`}
              </p>
            </div>

            {/* High-res White QR Canvas */}
            <div className="mx-auto rounded-2xl bg-foreground p-4 inline-block">
              <img
                src={qrCodeImgUrl}
                alt="Enlarged Payment QR"
                className="h-56 w-56 object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="text-2xl font-black text-primary">
                {formatCurrency(paymentAmount)}
              </span>
              <p className="text-[11px] font-semibold text-muted-foreground">
                UPI: <span className="font-mono text-foreground">{upiPayee}</span>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 text-[11px] text-muted-foreground leading-relaxed">
              📸 <strong className="text-foreground">Tip:</strong> Take a screenshot of this screen to upload into Google Pay / PhonePe scanner, or scan directly with any UPI app!
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPaymentConfirmed(true);
                  setIsQrModalOpen(false);
                }}
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-background transition-all hover:bg-primary-hover active:scale-95 shadow-md cursor-pointer"
              >
                ✓ I Have Completed Payment
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full rounded-xl border border-border bg-secondary py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
