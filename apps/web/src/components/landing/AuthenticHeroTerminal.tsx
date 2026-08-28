'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  QrCode,
  CheckCircle2,
  Volume2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface TableState {
  id: string;
  name: string;
  zone: string;
  guests: number;
  status: 'available' | 'ordered' | 'cooking' | 'ready' | 'paid';
  bill: number;
  token?: string;
  timer: string;
  items: { name: string; qty: number; notes?: string }[];
}

export function AuthenticHeroTerminal() {
  const [activeTab, setActiveTab] = useState<'floor' | 'kds' | 'terminal'>('floor');
  const [tables, setTables] = useState<TableState[]>([
    {
      id: 't1',
      name: 'Table 01',
      zone: 'Main Hall',
      guests: 4,
      status: 'cooking',
      bill: 1480,
      token: '#AT-1082',
      timer: '04:18',
      items: [
        { name: 'Woodfired Truffle Pizza', qty: 1, notes: 'Extra crispy base' },
        { name: 'House Smoked Wings', qty: 2, notes: 'Spicy glaze' },
      ],
    },
    {
      id: 't2',
      name: 'Table 02',
      zone: 'Patio',
      guests: 2,
      status: 'ready',
      bill: 860,
      token: '#AT-1084',
      timer: '01:10',
      items: [
        { name: 'Wild Mushroom Risotto', qty: 1 },
        { name: 'Sparkling Yuzu Soda', qty: 2 },
      ],
    },
    {
      id: 't3',
      name: 'Table 03',
      zone: 'AC Hall',
      guests: 6,
      status: 'available',
      bill: 0,
      timer: '00:00',
      items: [],
    },
    {
      id: 't4',
      name: 'Table 04',
      zone: 'Rooftop',
      guests: 4,
      status: 'ordered',
      bill: 2150,
      token: '#AT-1085',
      timer: '00:45',
      items: [
        { name: 'Signature Lamb Chops', qty: 2, notes: 'Medium rare' },
        { name: 'Garlic Herb Fries', qty: 2 },
        { name: 'Cold Brew Negroni', qty: 2 },
      ],
    },
  ]);

  const [selectedTableId, setSelectedTableId] = useState('t1');
  const [isSimulating, setIsSimulating] = useState(false);
  const [receiptPrinted, setReceiptPrinted] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const handleSimulateOrder = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    // Update Table 3 from Available to Ordered
    setTimeout(() => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === 't3'
            ? {
                ...t,
                status: 'cooking',
                bill: 1720,
                token: '#AT-1086',
                timer: '00:15',
                items: [
                  { name: 'Burrata Bruschetta', qty: 2 },
                  { name: 'Artisan Sourdough Pasta', qty: 2, notes: 'Al dente' },
                ],
              }
            : t
        )
      );
      setSelectedTableId('t3');
      setIsSimulating(false);
    }, 800);
  };

  const getStatusBadge = (status: TableState['status']) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-primary/10 text-primary border-primary/20',
          label: 'Available',
          dot: 'bg-primary',
        };
      case 'ordered':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          label: 'New Order',
          dot: 'bg-sky-400 animate-pulse',
        };
      case 'cooking':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'In Kitchen',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'ready':
        return {
          bg: 'bg-primary/15 text-primary border-primary/30',
          label: 'Ready to Serve',
          dot: 'bg-primary animate-pulse',
        };
      default:
        return {
          bg: 'bg-secondary text-muted-foreground border-zinc-700',
          label: 'Settled',
          dot: 'bg-zinc-500',
        };
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl rounded-2xl border border-border bg-card overflow-hidden">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56]/80" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E]/80" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F]/80" />
          </div>
          <div className="h-4 w-px bg-secondary hidden sm:block" />
          <span className="font-mono text-xs text-muted-foreground font-medium hidden sm:inline-flex items-center gap-2">
            <span>atlas.terminal</span>
            <span className="text-subtle">/</span>
            <span className="text-foreground font-semibold">Cafe Rizz (Main Dining)</span>
          </span>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('floor')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'floor'
                  ? 'bg-secondary text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>Floor Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kds')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'kds'
                  ? 'bg-secondary text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>Kitchen KDS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'terminal'
                  ? 'bg-secondary text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>POS Billing</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSimulateOrder}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Simulate</span> Scan
          </button>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'floor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span className="uppercase tracking-wider font-semibold text-foreground">
                  Floor Occupancy • 4 Zones
                </span>
                <span className="font-mono text-primary font-semibold">
                  3 / 4 Tables Occupied
                </span>
              </div>

              {/* Table Card Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {tables.map((table) => {
                  const badge = getStatusBadge(table.status);
                  const isSelected = selectedTableId === table.id;

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-border bg-secondary shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                          : 'border-border bg-card hover:border-border hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground tracking-tight">
                          {table.name}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Zone</span>
                          <span className="text-foreground">{table.zone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Party</span>
                          <span className="text-foreground font-mono">{table.guests} seats</span>
                        </div>

                        {table.status !== 'available' ? (
                          <div className="flex items-center justify-between pt-1 border-t border-border">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {table.token}
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              ₹{table.bill.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-primary/80 pt-1 border-t border-border">
                            Ready for seating
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'kds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span className="uppercase tracking-wider font-semibold text-foreground">
                  Kitchen Live Dockets
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  <span>Audio Chimes Active</span>
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-amber-500/30 bg-secondary p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #AT-1082 • Table 01 (Main Hall)
                    </span>
                    <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                      PREP • 04:18m
                    </span>
                  </div>
                  <div className="text-xs text-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>1x Woodfired Truffle Pizza</span>
                      <span className="text-amber-400 text-[11px]">Extra crispy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x House Smoked Wings</span>
                      <span className="text-amber-400 text-[11px]">Spicy glaze</span>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-primary/15 border border-primary/30 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 transition-all"
                    >
                      ✓ Mark Ready for Pickup
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #AT-1085 • Table 04 (Rooftop)
                    </span>
                    <span className="rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                      NEW • 00:45m
                    </span>
                  </div>
                  <div className="text-xs text-foreground space-y-1">
                    <p>2x Signature Lamb Chops (Medium rare)</p>
                    <p>2x Garlic Herb Fries</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span className="uppercase tracking-wider font-semibold text-foreground">
                  Split Settlement & Ledger
                </span>
                <span className="font-mono text-primary font-semibold">
                  GST Invoice Engine
                </span>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Table 01 Settle Screen</h4>
                    <p className="text-xs text-muted-foreground">Token #AT-1082 • 4 Guests</p>
                  </div>
                  <span className="font-mono text-lg font-bold text-foreground">₹1,480.00</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <span className="text-muted-foreground block mb-1">UPI Direct Scan</span>
                    <span className="font-mono text-primary font-semibold text-sm">
                      ₹1,480.00
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <span className="text-muted-foreground block mb-1">Split (2 Diners)</span>
                    <span className="font-mono text-sky-400 font-semibold text-sm">
                      ₹740.00 / seat
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptPrinted(!receiptPrinted)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>{receiptPrinted ? 'Receipt Printed ✓' : 'Print 80mm Slip'}</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-background hover:bg-primary transition-all cursor-pointer"
                  >
                    <span>Confirm Settlement</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Table Inspector / Realistic Receipt Slip (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono text-primary font-semibold">
                  LIVE INSPECTOR
                </span>
                <h4 className="text-base font-bold text-foreground tracking-tight">
                  {selectedTable.name} ({selectedTable.zone})
                </h4>
              </div>
              <span className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground">
                <QrCode className="h-4 w-4" />
              </span>
            </div>

            {selectedTable.status !== 'available' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Ordered Dishes
                  </p>
                  <div className="space-y-1.5">
                    {selectedTable.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between text-xs bg-secondary rounded-lg p-2.5 border border-border"
                      >
                        <div>
                          <p className="text-foreground font-medium">
                            {item.qty}x {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-400/90">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-primary text-[11px] font-mono">Kitchen Synced</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-background p-3 border border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Live Bill:</span>
                  <span className="font-mono text-base font-bold text-foreground">
                    ₹{selectedTable.bill.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
                <p className="font-medium text-foreground">Table is vacant</p>
                <p className="text-[11px] text-muted-foreground">
                  Click &apos;Simulate Scan&apos; in top right to place a test live order.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
