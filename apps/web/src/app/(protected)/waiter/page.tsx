'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getTables } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import { printThermalReceipt } from '@/lib/receipt-printer';
import { cancelOrder, createCancellationRequest } from '@/services/orders.service';
import { apiClient } from '@/services/api-client';
import type { RestaurantTable } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';
import { CANCELLATION_REASONS } from '@/types/order';
import { formatCurrency } from '@/lib/currency';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

// Synthesize a calming, classical guitar arpeggio pluck sound using Web Audio API
function playGuitarSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const notes = [220, 277.18, 329.63, 440, 554.37, 659.25];
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.25);
    });
  } catch (err) {
    console.warn('Audio feedback failed to play', err);
  }
}

export default function WaiterDashboard() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeAreaId, setActiveAreaId] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Table clearing modal state
  const [tableToClear, setTableToClear] = useState<RestaurantTable | null>(null);
  const [isClearingTable, setIsClearingTable] = useState(false);

  // Selected table detail
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const selectedTableIdRef = useRef<string | null>(null);

  // Keep ref synchronized
  useEffect(() => {
    selectedTableIdRef.current = selectedTable?.id ?? null;
  }, [selectedTable]);

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
      toastWarning('Please provide a note when choosing Other as cancellation reason.');
      return;
    }

    const hasPaid = cancellationOrder.payments?.some(
      (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
    );

    setIsSubmittingCancel(true);
    try {
      await createCancellationRequest(
        cancellationOrder.id,
        cancellationReason,
        cancellationNote,
      );

      // Optimistically update order with pending cancellation request in local state
      setSelectedTable((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          customerSessions: prev.customerSessions?.map((s) => ({
            ...s,
            orders: s.orders?.map((o) =>
              o.id === cancellationOrder.id
                ? {
                    ...o,
                    cancellationRequests: [
                      {
                        status: 'PENDING_REVIEW',
                        reason: cancellationReason,
                        note: cancellationNote,
                      },
                    ],
                  }
                : o,
            ),
          })),
        };
      });

      setTables((prevTables) =>
        prevTables.map((t) => {
          if (t.id !== selectedTableIdRef.current) return t;
          return {
            ...t,
            customerSessions: t.customerSessions?.map((s) => ({
              ...s,
              orders: s.orders?.map((o) =>
                o.id === cancellationOrder.id
                  ? {
                      ...o,
                      cancellationRequests: [
                        {
                          status: 'PENDING_REVIEW',
                          reason: cancellationReason,
                          note: cancellationNote,
                        },
                      ],
                    }
                  : o,
              ),
            })),
          };
        }),
      );

      toastSuccess(
        `Cancellation request for Order #${cancellationOrder.orderNumber} sent to Owner / Cashier for approval!`,
      );

      setCancellationOrder(null);
      setCancellationReason('CUSTOMER_REQUESTED');
      setCancellationNote('');
      void loadDataSilently(notifiedOrderIds, notifiedCallIds);
    } catch (err: any) {
      console.error('Cancellation error:', err);
      toastError(err?.message ?? 'Failed to process cancellation.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const loadData = useCallback(async (showFullLoader = true) => {
    if (!currentBranch) {
      setTables([]);
      setDiningAreas([]);
      setIsLoading(false);
      return;
    }
    if (showFullLoader) {
      setIsLoading(true);
    }
    setError('');
    try {
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);
      const initialTables = tablesRes.data ?? [];
      setDiningAreas(areasRes.data ?? []);
      setTables(initialTables);

      if (selectedTableIdRef.current) {
        const fresh = initialTables.find((t: any) => t.id === selectedTableIdRef.current);
        if (fresh) setSelectedTable(fresh);
      }

      const historicOrderIds = new Set<string>();
      initialTables.forEach((table: any) => {
        table.customerSessions?.forEach((session: any) => {
          session.orders?.forEach((order: any) => {
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

      // Keep open selected table fresh
      if (selectedTableIdRef.current) {
        const freshSelected = nextTables.find((t: any) => t.id === selectedTableIdRef.current);
        if (freshSelected) {
          setSelectedTable(freshSelected);
        }
      }

      checkForNewOrders(nextTables, orderIds);
      void fetchTableCalls(callIds);
    } catch (err) {
      console.error('Silent poll failed', err);
    }
  }, [currentBranch, checkForNewOrders, fetchTableCalls]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Polling loop
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
      toastError('Unable to load menu for order taking.');
    }
  }, [selectedTable, toastError]);

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

  // Manual Seat Guests
  const handleSeatGuests = async (table: RestaurantTable) => {
    setUpdatingTableId(table.id);
    try {
      await apiClient.post(`/public/tables/${table.publicToken}/session`);
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);
      setDiningAreas(areasRes.data ?? []);
      const freshTables = tablesRes.data ?? [];
      setTables(freshTables);

      const updated = freshTables.find((t: any) => t.id === table.id);
      if (updated) setSelectedTable(updated);
      toastSuccess(`Guests seated at Table ${table.name}!`);
    } catch (err: any) {
      toastError(err?.message ?? 'Failed to seat guests.');
    } finally {
      setUpdatingTableId(null);
    }
  };

  // Clear table trigger modal
  const handleClearTable = (table: RestaurantTable) => {
    setTableToClear(table);
  };

  // Execute Clear table after confirmation popup
  const executeClearTable = async () => {
    if (!tableToClear) return;
    const table = tableToClear;
    setIsClearingTable(true);
    setUpdatingTableId(table.id);

    // 1. Optimistically clear active session in UI (turns green immediately)
    setTables((prevTables) =>
      prevTables.map((t) =>
        t.id === table.id ? { ...t, customerSessions: [] } : t,
      ),
    );
    setSelectedTable(null);

    // 2. Perform authenticated clear with public fallback
    try {
      try {
        await apiClient.post(`/tables/${table.id}/clear`);
      } catch (authErr) {
        if (table.publicToken) {
          await apiClient.post(`/public/tables/${table.publicToken}/session/end`);
        } else {
          throw authErr;
        }
      }
      setTableToClear(null);
      toastSuccess(`Table ${table.name} session ended & cleared!`);
      void loadDataSilently(notifiedOrderIds, notifiedCallIds);
    } catch (err: any) {
      console.error('Failed to clear table:', err);
      toastError(err?.message ?? 'Failed to end table session.');
      void loadData(false);
    } finally {
      setIsClearingTable(false);
      setUpdatingTableId(null);
    }
  };

  // Instant 1-Click Order Status Update (Serve / Complete) with immediate optimistic UI
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, label: string) => {
    if (updatingOrderId === orderId) return;
    setUpdatingOrderId(orderId);

    // 1. Immediate optimistic update (0ms UI feedback)
    setSelectedTable((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        customerSessions: prev.customerSessions?.map((s) => ({
          ...s,
          orders: s.orders?.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o)),
        })),
      };
    });

    setTables((prevTables) =>
      prevTables.map((t) => {
        if (t.id !== selectedTableIdRef.current) return t;
        return {
          ...t,
          customerSessions: t.customerSessions?.map((s) => ({
            ...s,
            orders: s.orders?.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o)),
          })),
        };
      })
    );

    // 2. Perform API update & background refresh
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: nextStatus });
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);
      setDiningAreas(areasRes.data ?? []);
      const freshTables = tablesRes.data ?? [];
      setTables(freshTables);

      if (selectedTableIdRef.current) {
        const freshTable = freshTables.find((t: any) => t.id === selectedTableIdRef.current);
        if (freshTable) setSelectedTable(freshTable);
      }
      toastSuccess(`Order status updated to ${label}!`);
    } catch (err: any) {
      console.error(err);
      toastError(err?.message ?? `Failed to update status to ${label.toLowerCase()}.`);
      void loadDataSilently(notifiedOrderIds, notifiedCallIds);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Print bill receipt
  const handlePrintBill = async (table: RestaurantTable) => {
    setIsPrinting(true);
    try {
      const res = await apiClient.get<any>(`/public/tables/${table.publicToken}/orders`);
      const fetchedOrders = res.data ?? [];
      if (fetchedOrders.length === 0) {
        toastWarning('No orders placed in this session yet.');
        return;
      }
      const grandTotal = fetchedOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      printThermalReceipt({
        restaurantName: currentRestaurant?.name || 'CAFE RIZZ',
        branchName: currentBranch?.name || 'Main Branch',
        tableName: table.name,
        dateTime: new Date().toLocaleString(),
        orders: fetchedOrders.map((o: any) => ({
          orderNumber: o.orderNumber,
          totalAmount: Number(o.totalAmount || 0),
          items: (o.items ?? []).map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            totalPrice: Number(it.totalPrice || 0),
          })),
        })),
        grandTotal,
      });
    } catch (err: any) {
      toastError(err?.message ?? 'Failed to prepare bill receipt.');
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

  // Submit manual booking orders
  const handleSubmitManualOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of cartItems) {
        await apiClient.post(`/public/tables/${selectedTable.publicToken}/cart/items`, {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          variantIds: item.variantIds,
          addonIds: item.addonIds,
        });
      }

      await apiClient.post(`/public/tables/${selectedTable.publicToken}/orders`, {});

      setCartItems([]);
      setIsOrdering(false);
      await loadData(false);
      toastSuccess('Order placed successfully for table!');
    } catch (err: any) {
      toastError(err?.message ?? 'Failed to submit order.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">
          📍
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Select branch for Waiter floor
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose the restaurant branch from the header selector to open the service tables floor.
        </p>
      </div>
    );
  }

  // Filter tables by active dining area
  const filteredTables = tables.filter((t) =>
    activeAreaId === 'ALL' ? true : t.diningAreaId === activeAreaId,
  );

  const isOrderUnpaid = (o: any) => {
    if (!o || o.status === 'CANCELLED') return false;
    return !o.payments?.some((p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED');
  };

  // Calculate quick stats (strict occupancy: only occupied if active unsettled orders exist)
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => {
    const session = t.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return false;
    const orders = session.orders ?? [];
    return orders.some(isOrderUnpaid);
  }).length;
  const availableCount = totalTables - occupiedCount;
  const readyCount = tables.filter((t) =>
    t.customerSessions?.some((s) => s.orders?.some((o) => o.status === 'READY')),
  ).length;
  const sentToCashierCount = tables.filter((t) => {
    const session = t.customerSessions?.find((s) => s.status === 'ACTIVE');
    if (!session) return false;
    const orders = session.orders ?? [];
    const unpaid = orders.filter(isOrderUnpaid);
    return unpaid.length > 0 && unpaid.every((o) => o.status === 'COMPLETED');
  }).length;

  return (
    <div className="space-y-6">
      {/* Printable Thermal Receipt (80mm POS Roll) */}
      <div id="printable-receipt" className="hidden print:block text-black bg-foreground font-mono text-xs w-[76mm] mx-auto p-1 leading-tight">
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <h2 className="text-sm font-black uppercase tracking-wider">{currentRestaurant?.name || 'RESTAURANT'}</h2>
          <p className="text-[10px]">{currentBranch?.name}</p>
          <p className="mt-1 font-bold text-xs">TABLE {selectedTable?.name}</p>
          <p className="text-[9px] text-gray-700">{new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-2 border-b border-dashed border-black pb-2 mb-2">
          {printOrders.map((o) => (
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

        {(() => {
          const grandTotal = printOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
          return (
            <div className="space-y-1 border-b border-dashed border-black pb-2 mb-2 text-[11px]">
              <div className="flex justify-between text-xs font-black pt-1">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          );
        })()}

        <div className="text-center text-[9px] text-gray-800 pt-1">
          <p className="font-bold">*** THANK YOU FOR DINING WITH US ***</p>
          <p className="text-[8px] text-gray-600 mt-0.5">Please visit again</p>
        </div>
      </div>

      {/* Screen Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Waiter Service Floor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Active Station: <span className="font-semibold text-foreground">{currentBranch.name}</span>
          </p>
        </div>

        {/* Quick Floor Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full sm:w-auto">
          <div className="rounded-xl border border-border bg-card px-3 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase text-muted-foreground">Total</span>
            <span className="text-sm font-extrabold text-foreground">{totalTables}</span>
          </div>
          <div className="rounded-xl border border-atlas-success/30 bg-atlas-success/5 px-3 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase text-atlas-success">Available</span>
            <span className="text-sm font-extrabold text-atlas-success">{availableCount}</span>
          </div>
          <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/5 px-3 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase text-atlas-error">Occupied</span>
            <span className="text-sm font-extrabold text-atlas-error">{occupiedCount}</span>
          </div>
          <div className="rounded-xl border border-atlas-warning/30 bg-atlas-warning/5 px-3 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase text-atlas-warning">Ready</span>
            <span className="text-sm font-extrabold text-atlas-warning">{readyCount}</span>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase text-purple-400">At Cashier</span>
            <span className="text-sm font-extrabold text-purple-400">{sentToCashierCount}</span>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Dining Area Tabs */}
      <div className="no-print">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveAreaId('ALL')}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeAreaId === 'ALL'
                ? 'bg-primary text-background shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            All Dining Areas ({tables.length})
          </button>
          {diningAreas.map((area) => {
            const count = tables.filter((t) => t.diningAreaId === area.id).length;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveAreaId(area.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                  activeAreaId === area.id
                    ? 'bg-primary text-background shadow-sm'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {area.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Floor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left: Floor Tables Grid */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading && tables.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              Loading dining floor...
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center space-y-2">
              <div className="text-3xl">🍽️</div>
              <h3 className="text-sm font-bold text-foreground">No tables found</h3>
              <p className="text-xs text-muted-foreground">Configure tables in the Tables section to populate this area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTables.map((table) => {
                const activeSession = table.customerSessions?.find((s) => s.status === 'ACTIVE');
                const orders = activeSession?.orders ?? [];
                const unpaidOrders = orders.filter(isOrderUnpaid);
                const isOccupied = !!activeSession && unpaidOrders.length > 0;
                const hasReadyOrders = unpaidOrders.some((o) => o.status === 'READY');
                const isSentToCashier = unpaidOrders.length > 0 && unpaidOrders.every((o) => o.status === 'COMPLETED');
                const isSelected = selectedTable?.id === table.id;

                const cardBorder = isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(42,254,183,0.15)] ring-1 ring-primary'
                  : hasReadyOrders
                  ? 'border-atlas-warning/70 bg-atlas-warning/5 hover:border-atlas-warning shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                  : isSentToCashier
                  ? 'border-purple-500/60 bg-purple-500/5 hover:border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                  : isOccupied
                  ? 'border-atlas-error/40 bg-atlas-error/5 hover:border-atlas-error'
                  : 'border-border bg-card hover:border-primary/40';

                const indicatorDot = hasReadyOrders
                  ? 'bg-atlas-warning animate-ping'
                  : isSentToCashier
                  ? 'bg-purple-500 animate-pulse'
                  : isOccupied
                  ? 'bg-atlas-error'
                  : 'bg-atlas-success';

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 text-left shadow-md transition-all active:scale-[0.98] cursor-pointer ${cardBorder}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-extrabold text-foreground">
                        Table {table.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasReadyOrders && (
                          <span className="text-[10px] font-bold text-atlas-warning">READY</span>
                        )}
                        {isSentToCashier && (
                          <span className="text-[10px] font-bold text-purple-400">AT CASHIER</span>
                        )}
                        <span className={`h-2.5 w-2.5 rounded-full ${indicatorDot}`} />
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground w-full">
                      <span>👥 {table.capacity}p</span>
                      <span className={isSentToCashier ? 'font-bold text-purple-400' : isOccupied ? 'font-bold text-foreground' : 'text-atlas-success'}>
                        {isSentToCashier ? 'Sent to Cashier' : isOccupied ? `${unpaidOrders.length} active order${unpaidOrders.length !== 1 ? 's' : ''}` : 'Available'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Pane / Drawer (Sticky Desktop, Sheet on Mobile) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
            {selectedTable ? (
              <>
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">
                      Table {selectedTable.name}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      {selectedTable.code} • {selectedTable.diningArea?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null)}
                    className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Occupancy details */}
                {selectedTable.customerSessions && selectedTable.customerSessions.some((s) => s.status === 'ACTIVE') ? (
                  (() => {
                    const activeSession = selectedTable.customerSessions.find((s) => s.status === 'ACTIVE')!;
                    const allOrders = activeSession.orders ?? [];
                    const unpaidOrders = allOrders.filter(isOrderUnpaid);
                    const isSentToCashier = unpaidOrders.length > 0 && unpaidOrders.every((o) => o.status === 'COMPLETED');

                    return (
                      <div className="space-y-4">
                        {isSentToCashier ? (
                          <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-3 text-xs text-purple-300 space-y-2.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>Sent to Cashier — Bill Pending</span>
                              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Order marked completed by waiter. Awaiting cashier payment settlement.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isPrinting}
                                onClick={() => handlePrintBill(selectedTable)}
                                className="flex-1 rounded-lg bg-secondary border border-border py-2 text-xs font-bold text-foreground hover:border-primary transition-all text-center cursor-pointer"
                              >
                                {isPrinting ? 'Printing...' : '🖨️ Print Bill'}
                              </button>
                              <button
                                type="button"
                                disabled={updatingTableId === selectedTable.id}
                                onClick={() => handleClearTable(selectedTable)}
                                className="flex-1 rounded-lg bg-atlas-error/20 py-2 text-xs font-bold text-atlas-error hover:bg-atlas-error/30 transition-all disabled:opacity-50 text-center cursor-pointer"
                              >
                                Clear Table
                              </button>
                            </div>
                          </div>
                        ) : unpaidOrders.length > 0 ? (
                          <div className="rounded-xl bg-atlas-error/10 border border-atlas-error/20 p-3 text-xs text-atlas-error space-y-2.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>Occupied Guest Session</span>
                              <span className="h-2 w-2 rounded-full bg-atlas-error animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isPrinting}
                                onClick={() => handlePrintBill(selectedTable)}
                                className="flex-1 rounded-lg bg-secondary border border-border py-2 text-xs font-bold text-foreground hover:border-primary transition-all text-center cursor-pointer"
                              >
                                {isPrinting ? 'Printing...' : '🖨️ Print Bill'}
                              </button>
                              <button
                                type="button"
                                disabled={updatingTableId === selectedTable.id}
                                onClick={() => handleClearTable(selectedTable)}
                                className="flex-1 rounded-lg bg-atlas-error/20 py-2 text-xs font-bold text-atlas-error hover:bg-atlas-error/30 transition-all disabled:opacity-50 text-center cursor-pointer"
                              >
                                Clear Table
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-atlas-success/10 border border-atlas-success/20 p-3 text-xs text-atlas-success space-y-2.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>Table Available</span>
                              <span className="h-2 w-2 rounded-full bg-atlas-success" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              All orders settled / no active orders. Ready for guests.
                            </p>
                            <button
                              type="button"
                              disabled={updatingTableId === selectedTable.id}
                              onClick={() => handleClearTable(selectedTable)}
                              className="w-full rounded-lg bg-secondary border border-border py-2 text-xs font-bold text-muted-foreground hover:text-atlas-error hover:border-atlas-error/40 transition-all text-center cursor-pointer"
                            >
                              Clear Session
                            </button>
                          </div>
                        )}

                        {/* Active Session Orders */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Session Orders ({allOrders.length})
                          </h4>

                          {allOrders.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No orders placed yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {allOrders.map((o) => {
                                const isCancelled = o.status === 'CANCELLED';
                                const isCompleted = o.status === 'COMPLETED';
                                const isReady = o.status === 'READY';
                                const hasPendingReview = o.cancellationRequests?.some(
                                  (cr: any) => cr.status === 'PENDING_REVIEW',
                                );
                                const hasPaid = o.payments?.some(
                                  (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
                                );
                                const isOrderUpdating = updatingOrderId === o.id;

                                return (
                                  <div
                                    key={o.id}
                                    className={`rounded-xl p-3 text-xs border transition-all ${
                                      isReady
                                        ? 'border-atlas-warning/60 bg-atlas-warning/10 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                                        : isCompleted && !hasPaid
                                        ? 'border-purple-500/40 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                                        : isCancelled
                                        ? 'border-atlas-error/20 bg-atlas-error/5 opacity-75'
                                        : 'border-border bg-secondary'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-extrabold text-primary">
                                            {o.orderNumber}
                                          </span>
                                          <span
                                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                              isCancelled
                                                ? 'bg-atlas-error/20 text-atlas-error border border-atlas-error/30'
                                                : isCompleted
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                : isReady
                                                ? 'bg-atlas-warning/25 text-atlas-warning border border-atlas-warning/40 animate-pulse'
                                                : hasPendingReview
                                                ? 'bg-atlas-warning/20 text-atlas-warning border border-atlas-warning/30'
                                                : 'bg-card text-muted-foreground'
                                            }`}
                                          >
                                            {hasPendingReview ? 'Review Pending' : isCompleted ? (hasPaid ? 'Paid' : 'Sent to Cashier') : o.status}
                                          </span>
                                        </div>
                                        {isCancelled && o.cancellationReason && (
                                          <p className="mt-1 text-[10px] text-atlas-error/80">
                                            Reason: {o.cancellationReason}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status) && (
                                          <button
                                            type="button"
                                            disabled={isOrderUpdating}
                                            onClick={() => handleUpdateOrderStatus(o.id, 'SERVED', 'Served')}
                                            className={`rounded px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-[0.97] disabled:opacity-50 ${
                                              isReady
                                                ? 'bg-primary text-background hover:bg-primary-hover shadow-[0_0_8px_rgba(42,254,183,0.3)]'
                                                : 'bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                                            }`}
                                          >
                                            {isOrderUpdating ? 'Serving...' : isReady ? '🔔 Serve' : 'Serve'}
                                          </button>
                                        )}
                                        {o.status === 'SERVED' && (
                                          <button
                                            type="button"
                                            disabled={isOrderUpdating}
                                            onClick={() => handleUpdateOrderStatus(o.id, 'COMPLETED', 'Completed & Sent to Cashier')}
                                            className="rounded bg-[#A855F7] px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-[#9333EA] transition-all active:scale-[0.97] disabled:opacity-50 shadow-md cursor-pointer"
                                          >
                                            {isOrderUpdating ? 'Sending...' : '✨ Send to Cashier'}
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
                                            className="rounded border border-atlas-error/30 bg-atlas-error/10 px-2 py-1.5 text-[10px] font-bold text-atlas-error hover:bg-atlas-error/20"
                                          >
                                            Request Cancel
                                          </button>
                                        )}
                                        <span className="font-bold text-foreground pl-1">
                                          {formatCurrency(o.totalAmount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* CTA Take Order */}
                        <button
                          type="button"
                          onClick={() => setIsOrdering(true)}
                          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-background hover:bg-primary-hover transition-all"
                        >
                          + Take New Order
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-4 text-center py-6">
                    <p className="text-xs text-muted-foreground">Table is currently unoccupied.</p>
                    <button
                      type="button"
                      disabled={updatingTableId === selectedTable.id}
                      onClick={() => handleSeatGuests(selectedTable)}
                      className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-background hover:bg-primary-hover transition-all"
                    >
                      Seat Guests
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                <div className="text-2xl">👈</div>
                <p>Select any dining table on the floor to view active orders or seat guests.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Ordering Modal */}
      {isOrdering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">
                Manual Order — Table {selectedTable?.name}
              </h2>
              <button
                type="button"
                onClick={() => setIsOrdering(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            {/* Menu categories & items */}
            {activeMenu ? (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {activeMenu.categories?.map((cat: any) => (
                  <div key={cat.id} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {cat.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.items?.map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setChosenVariantId(item.variants?.[0]?.id ?? '');
                            setChosenAddonIds([]);
                            setQuantity(1);
                          }}
                          className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3 text-left hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <span className="block text-xs font-bold text-foreground">{item.name}</span>
                            <span className="text-[10px] text-primary">{formatCurrency(item.price)}</span>
                          </div>
                          <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                            + Select
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading menu catalog...</div>
            )}

            {/* Selected item configurator */}
            {selectedItem && (
              <div className="rounded-xl border border-primary/40 bg-secondary p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Configure: {selectedItem.name}</h4>
                  <span className="text-xs font-bold text-primary">{formatCurrency(selectedItem.price)}</span>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-7 w-7 rounded bg-card border border-border text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-foreground">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="h-7 w-7 rounded bg-card border border-border text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCartItem}
                  className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-background hover:bg-primary-hover"
                >
                  Add to Table Cart
                </button>
              </div>
            )}

            {/* Current Cart */}
            {cartItems.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Cart ({cartItems.length} items)
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {cartItems.map((ci, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-secondary p-2 text-xs">
                      <span>{ci.quantity}x {ci.name}</span>
                      <span className="font-bold text-foreground">{formatCurrency(ci.price * ci.quantity)}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSubmitManualOrder}
                  className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-background hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Send Order to Kitchen'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popups & Assistance Overlays */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 flex flex-col gap-3 no-print">
        {orderToasts.map((t) => (
          <div
            key={t.id}
            onClick={() => handleOpenOrderTable(t.tableId, t.id)}
            className="flex items-center justify-between rounded-xl border border-primary/50 bg-card/95 p-3.5 backdrop-blur-md cursor-pointer hover:bg-secondary transition-all"
          >
            <div>
              <p className="text-xs font-bold text-foreground">
                Order <span className="font-mono text-primary">#{t.orderNumber}</span> placed
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Tap to open details for Table <span className="text-foreground font-bold">{t.tableName}</span>
              </p>
            </div>
            <span className="text-xl">🍽️</span>
          </div>
        ))}

        {callToasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl border border-atlas-warning/50 bg-card/95 p-3.5 backdrop-blur-md"
          >
            <div>
              <span className="rounded bg-atlas-warning/20 text-atlas-warning border border-atlas-warning/30 px-1.5 py-0.5 text-[9px] font-bold">
                {t.type} Assistance
              </span>
              <p className="text-xs font-bold text-foreground mt-1">Table {t.tableName}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleResolveCall(t.id)}
              className="ml-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary-hover"
            >
              Resolve
            </button>
          </div>
        ))}
      </div>

      {/* Order Cancellation Modal */}
      {cancellationOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              {(() => {
                const hasPaid = cancellationOrder.payments?.some(
                  (p: any) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
                );
                return (
                  <>
                    <h3 className="text-base font-bold text-foreground">
                      {hasPaid ? 'Request Order Cancellation' : 'Cancel Unpaid Order'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hasPaid
                        ? 'This order has a recorded payment. Submitting this form will send a cancellation & refund request to the Cashier.'
                        : 'This order is unpaid and will be cancelled immediately.'}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="rounded-xl bg-secondary p-3 text-xs space-y-1.5 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-mono font-bold text-primary">
                  {cancellationOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Total:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cancellationOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Select Reason
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-secondary p-2.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Additional Notes {cancellationReason === 'OTHER' && <span className="text-atlas-error">*</span>}
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
                  className="mt-1.5 w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellationOrder(null)}
                className="flex-1 rounded-lg bg-secondary border border-border py-2.5 text-xs font-bold text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleCancelOrderSubmit}
                className="flex-1 rounded-lg bg-atlas-error py-2.5 text-xs font-bold text-foreground hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmittingCancel ? 'Submitting...' : 'Submit Request to Owner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup Modal for Clearing Table (No Browser Alerts) */}
      <ConfirmDialog
        open={!!tableToClear}
        title={`End Session & Clear Table ${tableToClear?.name}?`}
        description={`Are you sure you want to end the dining session for Table ${tableToClear?.name}? This will free up the table for new guests and mark all served orders as closed.`}
        confirmText="Yes, Clear Table"
        confirmLoadingText="Clearing Table..."
        variant="primary"
        icon={<span className="text-xl">🧹</span>}
        isLoading={isClearingTable}
        onConfirm={executeClearTable}
        onCancel={() => setTableToClear(null)}
      />
    </div>
  );
}
