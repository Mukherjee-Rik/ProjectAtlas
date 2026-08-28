'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface TableData {
  id: number;
  name: string;
  seats: number;
  status: 'available' | 'occupied' | 'cooking' | 'ready' | 'settled';
  orderTotal?: number;
  tokens?: string[];
  items?: string[];
  zone: string;
}

export function IsometricRestaurantFloor3D() {
  const [tables, setTables] = useState<TableData[]>([
    {
      id: 1,
      name: 'Table 01',
      seats: 4,
      status: 'occupied',
      orderTotal: 840,
      tokens: ['#AT-0011'],
      items: ['2x Butter Chicken', '4x Garlic Naan'],
      zone: 'AC Hall',
    },
    {
      id: 2,
      name: 'Table 02',
      seats: 2,
      status: 'ready',
      orderTotal: 1240,
      tokens: ['#AT-0012'],
      items: ['1x Truffle Pasta', '2x Peach Iced Tea'],
      zone: 'Patio',
    },
    {
      id: 3,
      name: 'Table 03',
      seats: 6,
      status: 'available',
      zone: 'Main Dining',
    },
    {
      id: 4,
      name: 'Table 04',
      seats: 4,
      status: 'cooking',
      orderTotal: 2180,
      tokens: ['#AT-0009', '#AT-0014'],
      items: ['3x Paneer Tikka', '2x Biryani', '3x Mocktails'],
      zone: 'Rooftop',
    },
    {
      id: 5,
      name: 'Table 05',
      seats: 2,
      status: 'available',
      zone: 'AC Hall',
    },
    {
      id: 6,
      name: 'Table 06',
      seats: 8,
      status: 'occupied',
      orderTotal: 3450,
      tokens: ['#AT-0015'],
      items: ['4x Classic Burger', '4x Loaded Fries', '4x Shakes'],
      zone: 'VIP Lounge',
    },
  ]);

  const [activeKdsTickets, setActiveKdsTickets] = useState([
    { id: '#AT-0014', table: 'Table 04', dish: '3x Paneer Tikka', timer: '02:45', status: 'COOKING' },
    { id: '#AT-0012', table: 'Table 02', dish: '1x Truffle Pasta', timer: '00:15', status: 'READY' },
  ]);

  const [selectedTable, setSelectedTable] = useState<TableData | null>(tables[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string>('');
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');

  // Trigger interactive simulated order workflow
  const triggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34D399', '#A855F7', '#38BDF8'],
      });
    } catch {
      // ignore
    }

    setSimulationStep('📱 1. Customer Scans QR Standee at Table 03...');

    setTimeout(() => {
      setSimulationStep('⚡ 2. Order Placed! Token #AT-0016 sent to KDS in 8ms');
      setTables((prev) =>
        prev.map((t) =>
          t.id === 3
            ? {
                ...t,
                status: 'cooking',
                orderTotal: 1560,
                tokens: ['#AT-0016'],
                items: ['2x Farmhouse Pizza', '2x Cold Brew'],
              }
            : t
        )
      );

      setActiveKdsTickets((prev) => [
        { id: '#AT-0016', table: 'Table 03', dish: '2x Farmhouse Pizza, 2x Cold Brew', timer: '00:05', status: 'COOKING' },
        ...prev,
      ]);
    }, 1400);

    setTimeout(() => {
      setSimulationStep('👨‍🍳 3. Kitchen Chefs Prep Dish → Waiter Notified!');
    }, 3200);

    setTimeout(() => {
      setSimulationStep('✅ 4. Food Served! Ready for Table UPI Settlement.');
      setIsSimulating(false);
    }, 5200);
  };

  const getStatusBadge = (status: TableData['status']) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-primary/10 border-primary/30 text-primary',
          indicator: 'bg-primary',
          label: 'Available',
          glow: 'group-hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]',
        };
      case 'cooking':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
          indicator: 'bg-amber-400 animate-ping',
          label: 'Cooking 🍳',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-500/60',
        };
      case 'ready':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400',
          indicator: 'bg-cyan-400 animate-pulse',
          label: 'Ready 🔔',
          glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)] border-cyan-500/60',
        };
      case 'occupied':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          indicator: 'bg-rose-400',
          label: 'Occupied',
          glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]',
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          indicator: 'bg-slate-400',
          label: 'Settled',
          glow: '',
        };
    }
  };

  return (
    <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-[#0E151E] via-[#0B0F15] to-[#070A0E] p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F1F2615_1px,transparent_1px),linear-gradient(to_bottom,#1F1F2615_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Header Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <span className="font-mono text-xs font-bold text-muted-foreground pl-2 border-l border-border">
            ATLAS 3D LIVE RESTAURANT CORE v2.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 3D Perspective Toggle */}
          <div className="inline-flex rounded-xl border border-border bg-card p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-primary text-[#070A0E] shadow-[0_0_12px_rgba(42,254,183,0.4)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🎲 3D Isometric
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                viewMode === 'flat'
                  ? 'bg-primary text-[#070A0E] shadow-[0_0_12px_rgba(42,254,183,0.4)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📐 Plan View
            </button>
          </div>

          {/* Interactive Simulation Launcher */}
          <button
            type="button"
            onClick={triggerSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-xs font-black uppercase tracking-wider text-[#070A0E] shadow-[0_0_20px_rgba(42,254,183,0.35)] hover:shadow-[0_0_25px_rgba(42,254,183,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">⚡</span>
            {isSimulating ? 'Simulating...' : 'Simulate Live QR Order'}
          </button>
        </div>
      </div>

      {/* Live Simulation Banner Step */}
      {simulationStep && (
        <div className="relative z-10 mb-6 rounded-2xl border border-primary/40 bg-primary/10 p-3.5 text-center text-xs font-extrabold text-primary shadow-[0_0_20px_rgba(42,254,183,0.2)] animate-pulse">
          {simulationStep}
        </div>
      )}

      {/* Main 3D Interactive Floor Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D Dining Room Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
              <span>🏛️ Floor Plan (Multi-Zone)</span>
              <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] text-primary font-mono">
                {tables.filter((t) => t.status !== 'available').length} Active Dining Tables
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Cooking
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Ready
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Seated
              </span>
            </div>
          </div>

          {/* 3D Isometric Canvas Container */}
          <div
            className={`transition-all duration-700 ease-out ${
              viewMode === '3d'
                ? 'perspective-[1200px] [transform:rotateX(20deg)_rotateZ(-4deg)_scale(0.97)]'
                : 'perspective-none'
            }`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {tables.map((table) => {
                const badge = getStatusBadge(table.status);
                const isSelected = selectedTable?.id === table.id;

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`group relative rounded-2xl border bg-gradient-to-b from-secondary to-card p-4 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-primary shadow-[0_0_30px_rgba(42,254,183,0.3)] scale-[1.03] -translate-y-2'
                        : 'border-border hover:border-primary/50 hover:-translate-y-1'
                    } ${badge.glow}`}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* 3D Floating Token Badge */}
                    {table.tokens && table.tokens.length > 0 && (
                      <div className="absolute -top-3 -right-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-2 py-0.5 text-[9px] font-black text-foreground shadow-lg flex items-center gap-1 animate-bounce">
                        <span>🏷️</span>
                        <span>{table.tokens[0]}</span>
                      </div>
                    )}

                    {/* Table Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-black text-foreground">{table.name}</span>
                        <p className="text-[10px] text-muted-foreground">{table.zone}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${badge.indicator}`} />
                      </div>
                    </div>

                    {/* Table Details */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-mono text-foreground font-bold">👥 {table.seats} seats</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      {table.orderTotal ? (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-muted-foreground">Live Bill</span>
                          <span className="font-mono text-xs font-black text-primary">
                            ₹{table.orderTotal.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-primary font-medium pt-1">
                          Ready for guests
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Selected Table Inspector & Instant KDS Terminal */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Table Card */}
          {selectedTable && (
            <div className="rounded-2xl border border-primary/30 bg-card/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <span>{selectedTable.name}</span>
                    <span className="text-[10px] text-primary font-mono uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                      {selectedTable.zone}
                    </span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Live Handheld Terminal Status</p>
                </div>
                <span className="text-xl">🪑</span>
              </div>

              {selectedTable.status !== 'available' && selectedTable.items ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
                      Ordered Items (Round 1)
                    </p>
                    <div className="space-y-1">
                      {selectedTable.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5 text-xs text-foreground"
                        >
                          <span>{item}</span>
                          <span className="text-primary font-mono font-bold">✓ Sent</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#070A0E] p-3 border border-border">
                    <span className="text-xs text-muted-foreground">Total Live Balance:</span>
                    <span className="text-base font-black text-primary font-mono">
                      ₹{selectedTable.orderTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground space-y-2">
                  <p className="text-primary font-bold">✨ Table is vacant</p>
                  <p className="text-[11px]">
                    Scan QR Standee with any phone to initiate Token #AT-0017 immediately.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mini Live KDS Feed */}
          <div className="rounded-2xl border border-border bg-card/90 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span>👨‍🍳 Live Kitchen Feed</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              </h4>
              <span className="text-[10px] font-bold text-amber-400 font-mono">
                {activeKdsTickets.length} ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              {activeKdsTickets.map((ticket, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-secondary p-3 space-y-1.5 transition-all hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-primary">
                      {ticket.id} • {ticket.table}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                        ticket.status === 'READY'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-amber-500/20 text-amber-400 animate-pulse'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium truncate">{ticket.dish}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>⏱️ Cooking Timer:</span>
                    <span className="font-mono text-foreground font-bold">{ticket.timer} mins</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
