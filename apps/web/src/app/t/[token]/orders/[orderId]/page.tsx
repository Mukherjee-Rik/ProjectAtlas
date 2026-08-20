'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { Order } from '@/types/order';
import { getPublicOrderById, getPublicOrders } from '@/services/orders.service';
import { formatCurrency } from '@/lib/currency';
import { apiClient } from '@/services/api-client';
import { getPaymentSettings } from '@/lib/payment-settings';
import { printThermalReceipt } from '@/lib/receipt-printer';

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

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      // 1. Fetch all orders for this table session
      const listRes = await getPublicOrders(token);
      const ordersList = listRes.data ?? [];
      setSessionOrders(ordersList);

      // 2. Resolve active order: either user-selected, or initial, or most recent
      const targetId = activeOrderId || initialOrderId;
      let selected = ordersList.find((o) => o.id === targetId);

      if (!selected && ordersList.length > 0) {
        selected = ordersList[0];
        setActiveOrderId(selected.id);
      }

      if (selected) {
        // Fetch full order detail with variants/addons
        const detailRes = await getPublicOrderById(token, selected.id);
        setOrder(detailRes.data);
      } else if (initialOrderId) {
        const singleRes = await getPublicOrderById(token, initialOrderId);
        setOrder(singleRes.data);
      }

      setError(null);
    } catch {
      setError('Unable to load order details');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [token, activeOrderId, initialOrderId]);

  useEffect(() => {
    void loadData(true);

    // Poll every 3 seconds for real-time order status updates and new tokens
    const interval = setInterval(() => {
      void loadData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData]);

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
  const isFoodServed = order.status === 'SERVED';
  const isOrderCompleted = order.status === 'COMPLETED';

  const steps = [
    { label: 'Ordered', desc: 'Sent to kitchen', icon: '📝' },
    { label: 'Preparing', desc: 'Cooking your meal', icon: '🍳' },
    { label: 'Ready', desc: 'At the counter', icon: '🔔' },
    { label: 'Served', desc: 'Enjoy your food!', icon: '🍽️' },
  ];

  const getStageTip = (step: number) => {
    if (isCancelled) return 'This order was cancelled. Please contact staff if you have questions.';
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
      restaurantName: restaurantName || 'CAFE RIZZ',
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
    <main className="min-h-screen bg-[#0B0F14] pb-8 text-[#F5F7FA]">
      {/* Printable Thermal Receipt (80mm POS Roll) */}
      <div id="printable-receipt" className="hidden print:block text-black bg-white font-mono text-xs w-[76mm] mx-auto p-1 leading-tight">
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

      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur no-print">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black">Table Orders Tracker</h1>
            <p className="text-[11px] text-[#9AA6B2]">
              {order.branch?.name ?? 'Restaurant'} • {order.table?.name ?? 'Table'}
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="rounded-xl border border-[#26313C] px-3 py-2 text-[11px] font-semibold text-[#2AFEB7] transition-colors hover:border-[#2AFEB7]/40 hover:bg-[#2AFEB7]/10"
          >
            + Add More Items
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4 no-print">
        {/* MULTI-ORDER TOKEN SWITCHER (If customer added more items) */}
        {sessionOrders.length > 1 && (
          <div className="rounded-2xl border border-[#2AFEB7]/40 bg-gradient-to-b from-[#18212B] to-[#111820] p-3.5 space-y-2.5 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#F5F7FA] flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
                Active Table Orders ({sessionOrders.length})
              </span>
              <span className="text-[11px] font-black text-[#2AFEB7]">
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
                        ? 'border-[#2AFEB7] bg-[#2AFEB7]/15 shadow-[0_0_12px_rgba(42,254,183,0.25)] scale-[1.02]'
                        : 'border-[#26313C] bg-[#0B0F14]/70 hover:border-[#2AFEB7]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#2AFEB7]' : 'text-[#9AA6B2]'}`}>
                        {isOld ? 'Old Order (R1)' : isNew ? 'New Order (R2)' : `Round ${idx + 1}`}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold border ${oStyle.bg} ${oStyle.text} ${oStyle.border}`}>
                        {o.status}
                      </span>
                    </div>

                    <p className="font-mono text-xs font-black text-[#F5F7FA] mt-1 flex items-center gap-1">
                      <span>Token:</span>
                      <span className="text-[#2AFEB7]">#{o.orderNumber}</span>
                    </p>

                    <p className="text-[10px] text-[#9AA6B2] mt-0.5">
                      {itemQty} {itemQty === 1 ? 'item' : 'items'} • {formatCurrency(o.totalAmount)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Header & Live Stepper for Selected Token */}
        <div className="space-y-6 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl relative overflow-hidden">
          {/* Neon side accents */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2AFEB7]/60" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2AFEB7] bg-[#2AFEB7]/10 px-2 py-0.5 rounded-md">
                {roundLabel}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-[#9AA6B2] font-semibold">Token:</span>
                <h2 className="text-2xl font-black font-mono text-[#F5F7FA] tracking-tight">
                  #{order.orderNumber}
                </h2>
              </div>
              <p className="text-[11px] text-[#9AA6B2] mt-0.5">
                Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
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

        {/* MEAL SERVED BANNER (Shown when food is served and customer is dining) */}
        {isFoodServed && (
          <div className="space-y-3 rounded-2xl border border-[#2AFEB7]/30 bg-gradient-to-b from-[#18212B] to-[#111820] p-4 text-center shadow-lg animate-fadeIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2AFEB7]/15 text-2xl">
              🍽️
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F7FA]">Food Served • Enjoy Your Meal!</h3>
              <p className="text-xs text-[#9AA6B2] mt-1">
                Your food has been served hot & fresh. When you are ready to bill, staff will complete the order and your payment QR will appear here.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Link
                href={`/t/${token}/menu`}
                className="flex-1 rounded-xl border border-[#26313C] bg-[#0B0F14] py-2 text-center text-xs font-bold text-[#2AFEB7] hover:border-[#2AFEB7]/40 transition-colors"
              >
                + Add More Items
              </Link>
              <button
                type="button"
                onClick={() => handleCallStaff('Water')}
                className="flex-1 rounded-xl border border-[#26313C] bg-[#0B0F14] py-2 text-center text-xs font-bold text-[#F5F7FA] hover:border-[#2AFEB7]/40 transition-colors cursor-pointer"
              >
                💧 Request Water
              </button>
            </div>
          </div>
        )}

        {/* POST-MEAL PAYMENT SECTION (Displayed ONLY after waiter marks order COMPLETED) */}
        {isOrderCompleted && (
          <div className="space-y-4 rounded-2xl border-2 border-[#2AFEB7]/50 bg-gradient-to-b from-[#18212B] to-[#111820] p-5 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2AFEB7]/20 text-xs">
                  💳
                </span>
                <h3 className="text-sm font-black text-[#F5F7FA]">
                  Pay From Seat or Cashier
                </h3>
              </div>
              <span className="rounded-full border border-[#2AFEB7]/40 bg-[#2AFEB7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2AFEB7]">
                Order Completed
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-[#9AA6B2]">
              {sessionOrders.length > 1
                ? `Scan below to pay the combined total for all ${sessionOrders.length} orders at this table, or visit the cashier.`
                : 'Scan the QR code below to pay directly from your seat via UPI, or visit the cashier counter.'}
            </p>

            {/* Clickable QR Code Card for Screenshot / Enlargement */}
            <div
              onClick={() => setIsQrModalOpen(true)}
              className="group cursor-pointer rounded-xl border border-[#26313C] bg-[#0B0F14] p-4 flex flex-col items-center text-center transition-all hover:border-[#2AFEB7] hover:shadow-[0_0_15px_rgba(42,254,183,0.15)] active:scale-[0.99]"
            >
              <div className="relative rounded-xl bg-white p-2.5 shadow-md">
                <img
                  src={qrCodeImgUrl}
                  alt="Payment QR Code"
                  className="h-36 w-36 object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-[2px]">
                  <span className="rounded-lg bg-[#2AFEB7] px-2 py-1 text-[10px] font-bold text-[#0B0F14] shadow-md">
                    🔍 Tap to Enlarge
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-sm font-black text-[#2AFEB7]">
                  {formatCurrency(paymentAmount)}
                </p>
                {sessionOrders.length > 1 && (
                  <p className="text-[10px] font-bold text-[#2AFEB7]/90">
                    Combined Total ({sessionOrders.length} Orders)
                  </p>
                )}
                <p className="text-[10px] font-bold text-[#9AA6B2] flex items-center justify-center gap-1">
                  <span>📸</span> Click QR to enlarge & capture screenshot
                </p>
              </div>
            </div>

            {/* Action Buttons for Paying */}
            <div className="space-y-2 pt-1">
              <a
                href={upiUri}
                className="block w-full rounded-xl bg-[#2AFEB7] py-2.5 text-center text-xs font-bold text-[#0B0F14] shadow-md transition-all hover:bg-[#22E5A4] active:scale-95"
              >
                Pay via UPI App (GPay / PhonePe / Paytm)
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCallStaff('Bill')}
                  className="flex-1 rounded-xl border border-[#26313C] bg-[#18212B] py-2 text-center text-[11px] font-bold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]/40"
                >
                  💵 Pay at Cashier
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex-1 rounded-xl border border-[#2AFEB7]/40 bg-[#2AFEB7]/10 py-2 text-center text-[11px] font-bold text-[#2AFEB7] transition-colors hover:bg-[#2AFEB7]/20"
                >
                  🔍 View Full QR
                </button>
              </div>
            </div>

            {paymentConfirmed && (
              <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-3 text-center text-xs font-semibold text-[#22C55E] animate-fadeIn">
                ✓ Thank you! Staff has been notified of your payment.
              </div>
            )}
          </div>
        )}

        {/* Ordered Items List for Current Token */}
        <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
              Items in Token #{order.orderNumber}
            </h3>
            <span className="text-[11px] font-semibold text-[#2AFEB7]">
              {order.items.reduce((acc, it) => acc + it.quantity, 0)} items
            </span>
          </div>

          <div className="divide-y divide-[#26313C]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2AFEB7]">{item.quantity}x</span>
                    <h4 className="text-xs font-bold">{item.name}</h4>
                  </div>

                  {item.variants && item.variants.length > 0 && (
                    <p className="pl-5 text-[11px] text-[#9AA6B2]">
                      {item.variants.map((v) => v.name).join(' • ')}
                    </p>
                  )}

                  {item.addons && item.addons.length > 0 && (
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

        {/* ALL SESSION ORDERS BREAKDOWN ACCORDION (If multiple orders exist) */}
        {sessionOrders.length > 1 && (
          <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                All Table Rounds Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowAllItemsModal(!showAllItemsModal)}
                className="text-[11px] font-bold text-[#2AFEB7] hover:underline"
              >
                {showAllItemsModal ? 'Hide Rounds ▲' : 'Show All Rounds ▼'}
              </button>
            </div>

            {showAllItemsModal && (
              <div className="space-y-3 pt-2 border-t border-[#26313C]">
                {sessionOrders.map((sOrder, idx) => (
                  <div
                    key={sOrder.id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      sOrder.id === order.id
                        ? 'border-[#2AFEB7]/50 bg-[#2AFEB7]/5'
                        : 'border-[#26313C] bg-[#0B0F14]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#2AFEB7]">
                        Round {idx + 1} (Token #{sOrder.orderNumber})
                      </span>
                      <span className="text-[#F5F7FA]">{formatCurrency(sOrder.totalAmount)}</span>
                    </div>

                    <div className="text-[11px] text-[#9AA6B2] space-y-1">
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
        <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4 print-receipt-only print-border-dark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2] print-text-dark">
            Bill Breakdown (Token #{order.orderNumber})
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
              <span className="text-[#F5F7FA] print-text-dark">This Token Total</span>
              <span className="text-[#2AFEB7] print-text-dark">{formatCurrency(order.totalAmount)}</span>
            </div>

            {sessionOrders.length > 1 && (
              <div className="flex justify-between border-t border-[#2AFEB7]/30 pt-2 text-sm font-black text-[#2AFEB7]">
                <span>All Orders Grand Total</span>
                <span>{formatCurrency(sessionGrandTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table Assistance Controls */}
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 space-y-3 no-print shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
            Table Assistance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCallStaff('Waiter')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95 cursor-pointer"
            >
              <span className="text-lg">🙋‍♂️</span>
              <span className="mt-1 text-[10px] font-bold text-[#F5F7FA]">Call Waiter</span>
            </button>
            <button
              type="button"
              onClick={() => handleCallStaff('Water')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95 cursor-pointer"
            >
              <span className="text-lg">💧</span>
              <span className="mt-1 text-[10px] font-bold text-[#F5F7FA]">Request Water</span>
            </button>
            <button
              type="button"
              onClick={() => handleCallStaff('Bill')}
              className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#18212B] py-3.5 transition-all hover:border-[#2AFEB7] hover:bg-[#2AFEB7]/5 active:scale-95 cursor-pointer"
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

        {/* Quick Action Links */}
        <div className="flex flex-col gap-3 pt-2 no-print">
          <Link
            href={`/t/${token}/menu`}
            className="w-full rounded-xl bg-[#2AFEB7] py-3.5 text-center text-xs font-black text-[#0B0F14] shadow-[0_0_15px_rgba(42,254,183,0.3)] transition-all hover:bg-[#22E5A4] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>🍽️</span> + Add More Food / Order Again
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrintCustomerReceipt}
              className="flex-1 rounded-xl bg-[#18212B] border border-[#26313C] py-3 text-center text-xs font-bold text-[#F5F7FA] transition-all hover:border-[#2AFEB7]/60 active:scale-[0.99] cursor-pointer"
            >
              🖨️ Print Receipt
            </button>
            <Link
              href={`/t/${token}/orders`}
              className="flex-1 rounded-xl border border-[#26313C] bg-[#18212B] py-3 text-center text-xs font-bold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]/40 flex items-center justify-center"
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
            className="w-full max-w-sm space-y-4 rounded-2xl border border-[#2AFEB7]/40 bg-[#111820] p-6 text-center shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-[#18212B] p-1.5 text-xs text-[#9AA6B2] hover:text-white cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2AFEB7]">
                Scan & Pay from Seat
              </span>
              <h3 className="text-lg font-black text-[#F5F7FA]">
                {restaurantName}
              </h3>
              <p className="text-xs text-[#9AA6B2]">
                Table: {order.table?.name ?? 'Dine In'} • {sessionOrders.length > 1 ? `${sessionOrders.length} Orders Combined` : `Token: #${order.orderNumber}`}
              </p>
            </div>

            {/* High-res White QR Canvas */}
            <div className="mx-auto rounded-2xl bg-white p-4 shadow-xl inline-block">
              <img
                src={qrCodeImgUrl}
                alt="Enlarged Payment QR"
                className="h-56 w-56 object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="text-2xl font-black text-[#2AFEB7]">
                {formatCurrency(paymentAmount)}
              </span>
              <p className="text-[11px] font-semibold text-[#9AA6B2]">
                UPI: <span className="font-mono text-[#F5F7FA]">{upiPayee}</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#26313C] bg-[#0B0F14] p-3 text-[11px] text-[#9AA6B2] leading-relaxed">
              📸 <strong className="text-white">Tip:</strong> Take a screenshot of this screen to upload into Google Pay / PhonePe scanner, or scan directly with any UPI app!
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPaymentConfirmed(true);
                  setIsQrModalOpen(false);
                }}
                className="w-full rounded-xl bg-[#2AFEB7] py-3 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-95 shadow-md cursor-pointer"
              >
                ✓ I Have Completed Payment
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full rounded-xl border border-[#26313C] bg-[#18212B] py-2.5 text-xs font-bold text-[#9AA6B2] hover:text-white cursor-pointer"
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
