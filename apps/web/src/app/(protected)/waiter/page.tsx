'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getTables } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import { cancelOrder, createCancellationRequest } from '@/services/orders.service';
import { apiClient } from '@/services/api-client';
import type { RestaurantTable } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';
import { CANCELLATION_REASONS } from '@/types/order';
import { formatCurrency } from '@/lib/currency';

// Synthesize a calming, classical guitar arpeggio pluck sound using Web Audio API
function playGuitarSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const playPluck = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // triangle wave gives a warm acoustic pluck timbre
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04); // quick pluck attack
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // smooth string vibration decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Calming C major classical guitar arpeggio
    playPluck(261.63, now, 1.0);       // C4
    playPluck(329.63, now + 0.2, 1.0); // E4
    playPluck(392.00, now + 0.4, 1.0);  // G4
    playPluck(523.25, now + 0.6, 1.2); // C5
  } catch (err) {
    console.error('Audio synthesis failed', err);
  }
}

export default function WaiterDashboard() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeAreaId, setActiveAreaId] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  // Selected table modal detail
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  
  // Printing states
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Manual ordering panel state
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Selection configurations inside ordering popup
  const [chosenVariantId, setChosenVariantId] = useState<string>('');
  const [chosenAddonIds, setChosenAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Real-time table calls and order popups state
  const [orderToasts, setOrderToasts] = useState<any[]>([]);
  const [callToasts, setCallToasts] = useState<any[]>([]);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<Set<string>>(new Set());
  const [notifiedCallIds, setNotifiedCallIds] = useState<Set<string>>(new Set());

  // Order Cancellation states
  const [cancellationOrder, setCancellationOrder] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('CUSTOMER_REQUESTED');
  const [cancellationNote, setCancellationNote] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const handleCancelOrderSubmit = async () => {
    if (!cancellationOrder) return;
    if (cancellationReason === 'OTHER' && !cancellationNote.trim()) {
      alert('Please provide a note when choosing Other as cancellation reason.');
      return;
    }

    const hasPaid = cancellationOrder.payments?.some(
      (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
    );

    setIsSubmittingCancel(true);
    try {
      if (hasPaid) {
        await createCancellationRequest(
          cancellationOrder.id,
          cancellationReason,
          cancellationNote,
        );
        alert(`Cancellation request submitted to Cashier for Order #${cancellationOrder.orderNumber}!`);
      } else {
        await cancelOrder(
          cancellationOrder.id,
          cancellationReason,
          cancellationNote,
        );
        alert(`Order #${cancellationOrder.orderNumber} has been cancelled.`);
      }

      setCancellationOrder(null);
      setCancellationReason('CUSTOMER_REQUESTED');
      setCancellationNote('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to process cancellation.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!currentBranch) {
      setTables([]);
      setDiningAreas([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);
      const initialTables = tablesRes.data ?? [];
      setDiningAreas(areasRes.data ?? []);
      setTables(initialTables);

      // On initial load, record existing pending orders/calls as processed
      // to avoid sound alerts playing for pre-existing items on page refresh.
      const historicOrderIds = new Set<string>();
      initialTables.forEach((table) => {
        table.customerSessions?.forEach((session) => {
          session.orders?.forEach((order) => {
            if (order.status === 'PENDING') {
              historicOrderIds.add(order.id);
            }
          });
        });
      });
      setNotifiedOrderIds(historicOrderIds);

      try {
        const callsRes = await apiClient.get<any>('/table-calls');
        const initialCalls = callsRes.data ?? [];
        const historicCallIds = new Set<string>(initialCalls.map((c: any) => c.id));
        setNotifiedCallIds(historicCallIds);
      } catch (err) {
        console.error('Failed to pre-fetch table calls', err);
      }

    } catch (err: any) {
      console.error(err);
      setError('Failed to load table floor details.');
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch]);

  const checkForNewOrders = useCallback((newTablesList: RestaurantTable[], currentNotified: Set<string>) => {
    const pendingOrders: any[] = [];
    newTablesList.forEach((table) => {
      table.customerSessions?.forEach((session) => {
        session.orders?.forEach((order) => {
          if (order.status === 'PENDING') {
            pendingOrders.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              tableId: table.id,
              tableName: table.name,
            });
          }
        });
      });
    });

    let foundNew = false;
    const nextNotified = new Set(currentNotified);

    pendingOrders.forEach((o) => {
      if (!currentNotified.has(o.orderId)) {
        foundNew = true;
        nextNotified.add(o.orderId);
        
        // Add order toast
        setOrderToasts((prev) => [
          ...prev,
          {
            id: o.orderId,
            orderNumber: o.orderNumber,
            tableName: o.tableName,
            tableId: o.tableId,
            createdAt: Date.now(),
          },
        ]);
      }
    });

    if (foundNew) {
      setNotifiedOrderIds(nextNotified);
      playGuitarSound();
    }
  }, []);

  const fetchTableCalls = useCallback(async (currentNotified: Set<string>) => {
    if (!currentBranch) return;
    try {
      const res = await apiClient.get<any>('/table-calls');
      const activeCalls = res.data ?? [];
      
      let foundNew = false;
      const nextNotified = new Set(currentNotified);

      activeCalls.forEach((call: any) => {
        if (!currentNotified.has(call.id)) {
          foundNew = true;
          nextNotified.add(call.id);
          
          // Add assistance toast
          setCallToasts((prev) => [
            ...prev,
            {
              id: call.id,
              tableName: call.tableName,
              tableId: call.tableId,
              type: call.type,
              createdAt: Date.now(),
            },
          ]);
        }
      });

      if (foundNew) {
        setNotifiedCallIds(nextNotified);
        playGuitarSound();
      }
    } catch (err) {
      console.error('Failed to fetch table calls', err);
    }
  }, [currentBranch]);

  const loadDataSilently = useCallback(async (orderIds: Set<string>, callIds: Set<string>) => {
    if (!currentBranch) return;
    try {
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);
      setDiningAreas(areasRes.data ?? []);
      const nextTables = tablesRes.data ?? [];
      setTables(nextTables);
      
      checkForNewOrders(nextTables, orderIds);
      void fetchTableCalls(callIds);
    } catch (err) {
      console.error('Silent poll failed', err);
    }
  }, [currentBranch, checkForNewOrders, fetchTableCalls]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Set up polling loop
  useEffect(() => {
    if (!currentBranch || isLoading) return;

    const interval = setInterval(() => {
      void loadDataSilently(notifiedOrderIds, notifiedCallIds);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentBranch, isLoading, loadDataSilently, notifiedOrderIds, notifiedCallIds]);

  // Load menu for manual ordering
  const loadMenuForOrdering = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const res = await apiClient.get<any>(`/public/tables/${selectedTable.publicToken}/menu`);
      setActiveMenu(res.data);
    } catch (err) {
      console.error(err);
      alert('Unable to load menu for order taking.');
    }
  }, [selectedTable]);

  useEffect(() => {
    if (isOrdering) {
      void loadMenuForOrdering();
    }
  }, [isOrdering, loadMenuForOrdering]);

  // Toast interactions
  const handleOpenOrderTable = (tableId: string, toastId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTable(table);
    }
    // Remove toast from list
    setOrderToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const handleResolveCall = async (callId: string) => {
    try {
      await apiClient.post(`/table-calls/${callId}/resolve`);
      setCallToasts((prev) => prev.filter((t) => t.id !== callId));
    } catch (err) {
      console.error('Failed to resolve call', err);
    }
  };

  // 1. Manual Seat Guests
  const handleSeatGuests = async (table: RestaurantTable) => {
    setUpdatingTableId(table.id);
    try {
      await apiClient.post(`/public/tables/${table.publicToken}/session`);
      await loadData();
      // Auto expand detail
      const updated = tables.find((t) => t.id === table.id);
      if (updated) setSelectedTable(updated);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to sit guests.');
    } finally {
      setUpdatingTableId(null);
    }
  };

  // 2. Clear table (End active session)
  const handleClearTable = async (table: RestaurantTable) => {
    if (!confirm(`End session and clear Table ${table.name}?`)) return;
    setUpdatingTableId(table.id);
    try {
      await apiClient.post(`/public/tables/${table.publicToken}/session/end`);
      setSelectedTable(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to end table session.');
    } finally {
      setUpdatingTableId(null);
    }
  };

  // 3. Update order status (Serve or Complete)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, label: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: nextStatus });
      await loadData();
      // Re-fetch selected table row
      if (selectedTable) {
        const updated = tables.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }
    } catch (err: any) {
      alert(err?.message ?? `Failed to update status to ${label.toLowerCase()}.`);
    }
  };

  // 4. Print consolidated session bill
  const handlePrintBill = async (table: RestaurantTable) => {
    setIsPrinting(true);
    try {
      const res = await apiClient.get<any>(`/public/tables/${table.publicToken}/orders`);
      const fetchedOrders = res.data ?? [];
      if (fetchedOrders.length === 0) {
        alert('No orders placed in this session yet.');
        return;
      }
      setPrintOrders(fetchedOrders);
      // Wait for React to render the print container, then trigger print dialog
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to prepare bill receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Add Item to manual booking cart
  const handleAddCartItem = () => {
    if (!selectedItem) return;
    const itemPayload = {
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity,
      variantIds: chosenVariantId ? [chosenVariantId] : [],
      addonIds: chosenAddonIds,
    };
    setCartItems((prev) => [...prev, itemPayload]);
    setSelectedItem(null);
    setChosenVariantId('');
    setChosenAddonIds([]);
    setQuantity(1);
  };

  // Checkout manual order
  const handleCheckoutManualOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;
    setIsLoading(true);
    try {
      // 1. Add all items to public cart on behalf of table token
      for (const cartItem of cartItems) {
        await apiClient.post(`/public/tables/${selectedTable.publicToken}/cart/items`, {
          menuItemId: cartItem.menuItemId,
          quantity: cartItem.quantity,
          variantIds: cartItem.variantIds,
          addonIds: cartItem.addonIds,
        });
      }
      // 2. Submit order checkout
      await apiClient.post(`/public/tables/${selectedTable.publicToken}/orders`, {});
      setCartItems([]);
      setIsOrdering(false);
      await loadData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to dispatch manual order.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentRestaurant || !currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
          🧑💼
        </div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Select restaurant & branch
        </h2>
        <p className="text-sm text-[#9AA6B2]">
          Choose the operating workspace context from the header filters to launch table monitoring.
        </p>
      </div>
    );
  }

  // Filter tables by active dining area tab
  const filteredTables = tables.filter(
    (t) => activeAreaId === 'ALL' || t.diningAreaId === activeAreaId,
  );

  return (
    <div className="space-y-6 no-print">
      {/* Floor Monitor Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26313C] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">Floor Monitor</h1>
          <p className="text-xs text-[#9AA6B2]">
            Branch: <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveAreaId('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeAreaId === 'ALL'
                ? 'bg-[#2AFEB7] text-[#0B0F14]'
                : 'border border-[#26313C] text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            All Areas
          </button>
          {diningAreas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => setActiveAreaId(area.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeAreaId === area.id
                  ? 'bg-[#2AFEB7] text-[#0B0F14]'
                  : 'border border-[#26313C] text-[#9AA6B2] hover:text-[#F5F7FA]'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Floor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Floor Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filteredTables.map((table) => {
              const activeSession = table.customerSessions?.[0];
              const isOccupied = !!activeSession;
              const hasReadyOrders = activeSession?.orders.some((o) => o.status === 'READY');

              // Color indicators
              const cardBorder = hasReadyOrders
                ? 'border-[#EAB308]/60 bg-[#EAB308]/5 hover:border-[#EAB308]'
                : isOccupied
                  ? 'border-[#EF4444]/40 bg-[#EF4444]/5 hover:border-[#EF4444]'
                  : 'border-[#26313C] bg-[#111820] hover:border-[#2AFEB7]/40';

              const indicatorDot = hasReadyOrders
                ? 'bg-[#EAB308]'
                : isOccupied
                  ? 'bg-[#EF4444]'
                  : 'bg-[#22C55E]';

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 shadow-md transition-all ${cardBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#F5F7FA]">Table {table.name}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${indicatorDot}`} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-[#9AA6B2]">
                    <span>Cap: {table.capacity}</span>
                    <span>{isOccupied ? 'Occupied' : 'Available'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane / Drawer */}
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6 self-start">
          {selectedTable ? (
            <>
              <div className="flex items-start justify-between border-b border-[#26313C] pb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#F5F7FA]">Table {selectedTable.name}</h3>
                  <span className="font-mono text-xs text-[#9AA6B2]">{selectedTable.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="text-xs text-[#9AA6B2] hover:text-[#F5F7FA]"
                >
                  Close
                </button>
              </div>

              {/* Occupancy details */}
              {selectedTable.customerSessions && selectedTable.customerSessions.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 text-xs text-[#EF4444] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Occupied Session Active</span>
                      <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPrinting}
                        onClick={() => handlePrintBill(selectedTable)}
                        className="flex-1 rounded bg-[#2AFEB7] py-1.5 px-3 font-bold text-[#0B0F14] hover:bg-[#22E5A4] transition-all disabled:opacity-50 text-center text-xs"
                      >
                        {isPrinting ? 'Preparing...' : '🖨️ Print Bill'}
                      </button>
                      <button
                        type="button"
                        disabled={updatingTableId === selectedTable.id}
                        onClick={() => handleClearTable(selectedTable)}
                        className="flex-1 rounded bg-[#EF4444]/20 py-1.5 px-3 font-bold text-[#EF4444] hover:bg-[#EF4444]/30 transition-all disabled:opacity-50 text-center text-xs"
                      >
                        Clear Table
                      </button>
                    </div>
                  </div>

                  {/* Active orders */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                      Session Orders
                    </h4>
                    {(() => {
                      const allOrders = selectedTable.customerSessions.flatMap((s) => s.orders ?? []);
                      if (allOrders.length === 0) {
                        return <p className="text-xs text-[#9AA6B2]">No orders placed yet.</p>;
                      }
                      return (
                        <div className="space-y-2.5">
                          {allOrders.map((o) => {
                            const isCancelled = o.status === 'CANCELLED';
                            const isCompleted = o.status === 'COMPLETED';
                            const hasPendingReview = o.cancellationRequests?.some(
                              (cr: any) => cr.status === 'PENDING_REVIEW',
                            );
                            const hasPaid = o.payments?.some(
                              (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
                            );

                            return (
                              <div
                                key={o.id}
                                className={`rounded-xl p-3 text-xs border transition-all ${
                                  isCancelled
                                    ? 'border-red-500/20 bg-red-500/5 opacity-75'
                                    : 'border-[#26313C] bg-[#18212B]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-[#2AFEB7]">
                                        {o.orderNumber}
                                      </span>
                                      <span
                                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                          isCancelled
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : isCompleted
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : hasPendingReview
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-[#111820] text-[#9AA6B2]'
                                        }`}
                                      >
                                        {hasPendingReview ? 'Review Pending' : o.status}
                                      </span>
                                    </div>
                                    {isCancelled && o.cancellationReason && (
                                      <p className="mt-1 text-[10px] text-red-400/80">
                                        Reason: {o.cancellationReason}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status) && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(o.id, 'SERVED', 'Served')}
                                        className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                                          o.status === 'READY'
                                            ? 'bg-[#2AFEB7] text-[#0B0F14] hover:bg-[#22E5A4]'
                                            : 'bg-[#111820] border border-[#26313C] text-[#9AA6B2] hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]'
                                        }`}
                                      >
                                        {o.status === 'READY' ? '🔔 Serve' : 'Serve'}
                                      </button>
                                    )}
                                    {o.status === 'SERVED' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(o.id, 'COMPLETED', 'Completed')}
                                        className="rounded bg-[#A855F7] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#9333EA] transition-all"
                                      >
                                        Complete
                                      </button>
                                    )}
                                    {!isCancelled && !isCompleted && !hasPendingReview && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCancellationOrder(o);
                                          setCancellationReason('CUSTOMER_REQUESTED');
                                          setCancellationNote('');
                                        }}
                                        className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/20"
                                      >
                                        {hasPaid ? 'Req Cancel' : 'Cancel'}
                                      </button>
                                    )}
                                    <span className="font-bold text-[#F5F7FA] pl-1">
                                      {formatCurrency(o.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* manual booking CTA */}
                  <button
                    type="button"
                    onClick={() => setIsOrdering(true)}
                    className="w-full rounded-lg bg-[#2AFEB7] py-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4]"
                  >
                    Take New Order
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-6">
                  <p className="text-xs text-[#9AA6B2]">Table is currently empty.</p>
                  <button
                    type="button"
                    disabled={updatingTableId === selectedTable.id}
                    onClick={() => handleSeatGuests(selectedTable)}
                    className="rounded-lg bg-[#2AFEB7] px-6 py-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4]"
                  >
                    Sit Guests
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-sm text-[#9AA6B2]">
              Select a table from the floor map grid to monitor occupancy or manage active sessions.
            </div>
          )}
        </div>
      </div>

      {/* Manual order taking popup */}
      {isOrdering && activeMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#26313C] bg-[#111820] text-[#F5F7FA] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#26313C] p-4">
              <div>
                <h2 className="text-base font-bold">Manual Order — Table {selectedTable?.name}</h2>
                <p className="text-xs text-[#9AA6B2]">Select items from the restaurant menu</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOrdering(false);
                  setCartItems([]);
                }}
                className="text-xs text-[#9AA6B2] hover:text-[#F5F7FA]"
              >
                Cancel Order
              </button>
            </div>

            {/* Content split */}
            <div className="flex flex-1 overflow-hidden">
              {/* Menu items selection grid */}
              <div className="w-2/3 overflow-y-auto p-4 space-y-4 border-r border-[#26313C]">
                {activeMenu.categories.map((cat: any) => (
                  <div key={cat.id} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2AFEB7]">
                      {cat.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {cat.items.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer rounded-xl border border-[#26313C] bg-[#0F141C] p-3 text-xs hover:border-[#2AFEB7]/50"
                        >
                          <div className="font-semibold">{item.name}</div>
                          <div className="mt-2 text-[#2AFEB7] font-bold">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Cart Details Summary */}
              <div className="w-1/3 overflow-y-auto p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    {cartItems.length === 0 ? (
                      <p className="text-xs text-[#9AA6B2]">No items selected.</p>
                    ) : (
                      cartItems.map((cartItem, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-xs border-b border-[#26313C]/50 pb-2"
                        >
                          <div>
                            <span className="font-bold text-[#2AFEB7]">{cartItem.quantity}x </span>
                            <span>{cartItem.name}</span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(cartItem.price * cartItem.quantity)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#26313C] space-y-3">
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleCheckoutManualOrder}
                    className="w-full rounded-lg bg-[#2AFEB7] py-3 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4]"
                  >
                    Send Order to Kitchen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item options sub-popup */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#26313C] bg-[#111820] p-4 text-xs space-y-4">
            <h3 className="text-sm font-bold text-[#F5F7FA]">{selectedItem.name}</h3>

            {/* Variants selection */}
            {selectedItem.variantGroups?.map((group: any) => (
              <div key={group.id} className="space-y-2">
                <div className="font-semibold text-[#9AA6B2]">{group.name}</div>
                <div className="flex gap-2">
                  {group.variants.map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setChosenVariantId(v.id)}
                      className={`rounded px-3 py-1.5 border text-[11px] ${
                        chosenVariantId === v.id
                          ? 'border-[#2AFEB7] bg-[#2AFEB7]/10 text-[#2AFEB7]'
                          : 'border-[#26313C] text-[#F5F7FA]'
                      }`}
                    >
                      {v.name} (+{v.price})
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Addons selection */}
            {selectedItem.addonGroups?.map((group: any) => (
              <div key={group.id} className="space-y-2">
                <div className="font-semibold text-[#9AA6B2]">{group.name}</div>
                <div className="flex flex-wrap gap-2">
                  {group.addons.map((a: any) => {
                    const active = chosenAddonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setChosenAddonIds((prev) =>
                            active ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                          )
                        }
                        className={`rounded px-3 py-1.5 border text-[11px] ${
                          active
                            ? 'border-[#2AFEB7] bg-[#2AFEB7]/10 text-[#2AFEB7]'
                            : 'border-[#26313C] text-[#F5F7FA]'
                        }`}
                      >
                        {a.name} (+{a.price})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center justify-between border-t border-[#26313C] pt-3">
              <span>Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="rounded border border-[#26313C] px-2 py-1 text-sm font-bold text-[#F5F7FA]"
                >
                  −
                </button>
                <span className="w-6 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="rounded border border-[#26313C] px-2 py-1 text-sm font-bold text-[#F5F7FA]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded border border-[#26313C] px-3 py-1.5 text-xs text-[#9AA6B2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCartItem}
                className="rounded bg-[#2AFEB7] px-3 py-1.5 text-xs font-bold text-[#0B0F14]"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only receipt layout */}
      {printOrders.length > 0 && (
        <div className="hidden print:block bg-white text-black font-mono p-6 w-[80mm] text-xs leading-relaxed mx-auto">
          <div className="text-center font-bold text-sm mb-2 uppercase tracking-wide">
            {currentRestaurant.name}
          </div>
          <div className="text-center mb-4">
            {currentBranch.name}
            <br />
            Table {selectedTable?.name} ({selectedTable?.code})
            <br />
            Date: {new Date().toLocaleString()}
          </div>
          
          <div className="border-t border-dashed border-black my-2" />
          
          <div className="space-y-1">
            {(() => {
              // Group items across all orders in the session
              const consolidatedItems: Record<string, { name: string; quantity: number; price: number }> = {};
              let subtotal = 0;
              let taxAmount = 0;
              let discountAmount = 0;
              
              printOrders.forEach(o => {
                subtotal += Number(o.subtotal);
                taxAmount += Number(o.taxAmount);
                discountAmount += Number(o.discountAmount);
                
                o.items.forEach((item: any) => {
                  const key = item.menuItemId;
                  if (consolidatedItems[key]) {
                    consolidatedItems[key].quantity += item.quantity;
                  } else {
                    consolidatedItems[key] = {
                      name: item.name,
                      quantity: item.quantity,
                      price: Number(item.unitPrice),
                    };
                  }
                });
              });
              
              const total = subtotal + taxAmount - discountAmount;
              
              return (
                <>
                  <div className="grid grid-cols-12 gap-1 font-bold border-b border-dashed border-black pb-1 mb-1">
                    <span className="col-span-7">Item</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-3 text-right">Price</span>
                  </div>
                  {Object.values(consolidatedItems).map((item: any, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 py-0.5">
                      <span className="col-span-7 truncate">{item.name}</span>
                      <span className="col-span-2 text-right">{item.quantity}</span>
                      <span className="col-span-3 text-right">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-black my-2" />
                  <div className="space-y-1 text-right text-[11px]">
                    <div>Subtotal: {formatCurrency(subtotal)}</div>
                    {taxAmount > 0 && (
                      <>
                        <div>CGST (2.5%): {formatCurrency(taxAmount / 2)}</div>
                        <div>SGST (2.5%): {formatCurrency(taxAmount / 2)}</div>
                      </>
                    )}
                    {discountAmount > 0 && (
                      <div>Discount: -{formatCurrency(discountAmount)}</div>
                    )}
                    <div className="font-bold border-t border-dashed border-black pt-1 text-sm mt-1">
                      Total Due: {formatCurrency(total)}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          
          <div className="border-t border-dashed border-black my-4" />
          <div className="text-center font-bold text-[10px] uppercase">
            Thank you for dining with us!
          </div>
        </div>
      )}

      {/* Printable POS CSS overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, main, html, #__next, [data-overlay-container], .protected-layout-content {
            background: white !important;
            color: black !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print, header, nav, aside, button, select, dialog, [role="dialog"], .protected-sidebar, .protected-header {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}} />

      {/* Popups Overlays */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full no-print">
        {/* Order Toasts Stacking Column */}
        {orderToasts.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#2AFEB7] pl-1">
              🔔 New Table Orders ({orderToasts.length})
            </span>
            {orderToasts.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenOrderTable(t.tableId, t.id)}
                className="flex items-center justify-between rounded-xl border border-[#2AFEB7]/40 bg-[#111820]/95 p-4 shadow-[0_0_15px_rgba(42,254,183,0.15)] backdrop-blur-md cursor-pointer hover:bg-[#18212B] transition-all transform hover:scale-[1.02]"
              >
                <div>
                  <p className="text-xs font-bold text-[#F5F7FA]">
                    Order <span className="font-mono text-[#2AFEB7]">#{t.orderNumber}</span> placed
                  </p>
                  <p className="text-[10px] text-[#9AA6B2] mt-0.5">
                    Click to open details for Table <span className="text-white font-bold">{t.tableName}</span>
                  </p>
                </div>
                <span className="text-xl">🍽️</span>
              </div>
            ))}
          </div>
        )}

        {/* Call Toasts Stacking Column */}
        {callToasts.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#EAB308] pl-1">
              🛎️ Assistance Alerts ({callToasts.length})
            </span>
            {callToasts.map((t) => {
              let title = 'Waiter Called';
              let badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
              if (t.type === 'WATER') {
                title = 'Request Water';
                badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
              } else if (t.type === 'BILL') {
                title = 'Request Bill';
                badgeColor = 'bg-green-500/20 text-green-400 border-green-500/30';
              } else if (t.type === 'WAITER') {
                title = 'Call Waiter';
                badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
              }

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-[#26313C] bg-[#111820]/95 p-4 shadow-xl backdrop-blur-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${badgeColor}`}>
                        {title}
                      </span>
                      <p className="text-xs font-bold text-[#F5F7FA]">Table {t.tableName}</p>
                    </div>
                    <p className="text-[10px] text-[#9AA6B2] mt-1">
                      Assistance request logged. Click resolve when completed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleResolveCall(t.id)}
                    className="ml-3 rounded-lg bg-[#2AFEB7] p-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] transition-all"
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Cancellation Modal */}
      {cancellationOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-4">
            <div>
              {(() => {
                const hasPaid = cancellationOrder.payments?.some(
                  (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
                );
                return (
                  <>
                    <h3 className="text-base font-bold text-[#F5F7FA]">
                      {hasPaid ? 'Request Order Cancellation' : 'Cancel Unpaid Order'}
                    </h3>
                    <p className="mt-1 text-xs text-[#9AA6B2]">
                      {hasPaid
                        ? 'This order has a recorded payment. Submitting this form will send a cancellation & refund request to the Cashier.'
                        : 'This order is unpaid and will be cancelled immediately.'}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="rounded-xl bg-[#18212B] p-3 text-xs space-y-1.5 border border-[#26313C]">
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Order Number:</span>
                <span className="font-mono font-bold text-[#2AFEB7]">
                  {cancellationOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">Order Total:</span>
                <span className="font-bold text-[#F5F7FA]">
                  {formatCurrency(cancellationOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                  Select Reason
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2.5 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA6B2] uppercase">
                  Additional Notes {cancellationReason === 'OTHER' && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={cancellationNote}
                  onChange={(e) => setCancellationNote(e.target.value)}
                  placeholder={
                    cancellationReason === 'OTHER'
                      ? 'Please specify detailed explanation (required)...'
                      : 'Optional notes for record keeping...'
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] p-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellationOrder(null)}
                className="flex-1 rounded-lg bg-[#18212B] border border-[#26313C] py-2.5 text-xs font-bold text-[#F5F7FA]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleCancelOrderSubmit}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {isSubmittingCancel
                  ? 'Submitting...'
                  : cancellationOrder.payments?.some((p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED')
                  ? 'Submit Request'
                  : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
