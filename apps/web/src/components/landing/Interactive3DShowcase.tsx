'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tilt3DCard } from './Tilt3DCard';

export function Interactive3DShowcase() {
  const [activeTab, setActiveTab] = useState<'qr' | 'kds' | 'waiter' | 'pos' | 'inventory'>('qr');
  const [splitSeats, setSplitSeats] = useState(3);
  const [kdsCompleted, setKdsCompleted] = useState(false);

  return (
    <section id="modules" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/60 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/3 left-[-15%] w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#A855F7]/10 blur-[150px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase text-primary shadow-sm">
            <span>✨ 3D Interactive Module Explorer</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            One Operating System. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#38BDF8] to-[#A855F7]">
              Every Restaurant Workflow.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Click through the live interfaces below to experience how Kafei connects diners, chefs, waiters, cashiers, and managers seamlessly.
          </p>
        </div>

        {/* 3D Tab Switcher */}
        <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'qr', icon: '📱', name: 'QR Dine-In & Multi-Token' },
            { id: 'kds', icon: '👨‍🍳', name: 'Kitchen KDS Display' },
            { id: 'waiter', icon: '🤵', name: 'Waiter Handheld Floor' },
            { id: 'pos', icon: '💵', name: 'Cashier & Split Billing' },
            { id: 'inventory', icon: '📦', name: 'Inventory & AI Forecast' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`group relative flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-[#070A0E] shadow-[0_0_25px_rgba(42,254,183,0.4)] scale-105'
                    : 'border border-border bg-card/90 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Tilt Feature Viewport */}
        <Tilt3DCard maxTilt={6} glare={true} scaleOnHover={1.01} className="border border-border/80 bg-card/90 shadow-2xl">
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description Column */}
            <div className="lg:col-span-6 space-y-6">
              {activeTab === 'qr' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[11px] font-black uppercase text-primary">
                    Zero Friction • No App Download
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                    Multi-Round QR Dine-In with Instant UPI Payment
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Diners scan table QR standees to view high-definition dishes, customize toppings & spice levels, place consecutive order rounds (#AT-0001, #AT-0002), and pay directly from their seat without waiting for physical bills.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Real-time multi-token round tracking',
                      'Direct UPI QR enlarged view at seat',
                      'Custom Standee QR generation per zone',
                      'One-touch waiter service & water calls',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'kds' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-black uppercase text-amber-400">
                    Sub-Second Sync • Color-Coded Flow
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                    Real-Time Paperless Kitchen Ticket Flow
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Eliminate lost paper tickets and kitchen chaos. Incoming orders sound pleasant chime alerts, sort by preparation time, and highlight allergy notes and modifier choices instantly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Audio chimes on new tickets',
                      'Live Pending ➔ Cooking ➔ Ready status',
                      'Item-level modifier & spice tag alerts',
                      'Auto-sync with Waiter and Cashier screens',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <span className="h-4 w-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'waiter' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 px-3 py-1 text-[11px] font-black uppercase text-[#A855F7]">
                    Mobile-First • Table Floor Control
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                    Handheld Floor Terminal & Table Management
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Floor staff view live table occupancy at a glance, take walk-in POS orders on any tablet or smartphone, serve prepared dishes in one tap, and trigger cancellation requests with audit protection.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Floor map color status (Green, Red, Amber)',
                      'Instant KDS routing from table side',
                      'Ghost-session prevention on table clear',
                      'Manager approval cancellation protection',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <span className="h-4 w-4 rounded-full bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'pos' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 px-3 py-1 text-[11px] font-black uppercase text-[#38BDF8]">
                    Audit Proof • Split Settlements
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                    High-Velocity Cashier Billing & Refund Ledger
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Designed for peak dinner rush hours. Settle bills across cash and UPI, divide group payments evenly with split billing, review waiter cancellations, and generate GST thermal receipts with 1 click.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Split payments across cash & digital UPI',
                      'Formal cancellation review workflow',
                      'Full & partial refund audit ledger',
                      '80mm standard thermal receipt printing',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <span className="h-4 w-4 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'inventory' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[11px] font-black uppercase text-primary">
                    Automated Deductions • Machine Learning
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                    Automated Recipe Depletion & Demand AI
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Never run out of essential ingredients during peak weekend rushes. Kafei automatically tracks gram-level stock depletion per dish recipe and forecasts weekly material needs with AI.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Automatic recipe ingredient depletion',
                      'Low-stock alerts & waste ledger',
                      'Predictive AI rush-hour demand curves',
                      'Multi-branch warehouse sync',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-[#070A0E] shadow-[0_0_20px_rgba(42,254,183,0.3)] hover:bg-primary-hover hover:shadow-[0_0_30px_rgba(42,254,183,0.5)] transition-all"
                >
                  Launch Interactive Demo →
                </Link>
              </div>
            </div>

            {/* Right Interactive Mockup Simulation Preview */}
            <div className="lg:col-span-6 rounded-2xl border border-border bg-[#070A0E] p-5 sm:p-6 shadow-inner">
              {activeTab === 'qr' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  {/* Smartphone Frame Simulation */}
                  <div className="rounded-3xl border-2 border-border bg-card p-4 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          AT
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">Cafe Rizz • Table 04</p>
                          <p className="text-[10px] text-primary font-mono">Token #AT-0019 Active</p>
                        </div>
                      </div>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary">
                        LIVE
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-xl bg-secondary p-3 flex items-center justify-between border border-border">
                        <div>
                          <p className="text-xs font-bold text-foreground">Truffle Alfredo Pasta</p>
                          <p className="text-[10px] text-muted-foreground">Extra Cheese, Spicy</p>
                        </div>
                        <span className="text-xs font-mono font-black text-primary">₹420</span>
                      </div>

                      <div className="rounded-xl bg-secondary p-3 flex items-center justify-between border border-border">
                        <div>
                          <p className="text-xs font-bold text-foreground">Peach Sparkler Iced Tea</p>
                          <p className="text-[10px] text-muted-foreground">Less Sweet</p>
                        </div>
                        <span className="text-xs font-mono font-black text-primary">₹180</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center justify-between">
                      <span className="text-xs text-foreground font-bold">Total Bill:</span>
                      <span className="text-sm font-black text-primary font-mono">₹600.00</span>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-wider text-[#070A0E] shadow-[0_0_15px_rgba(42,254,183,0.3)] hover:bg-primary-hover"
                    >
                      💳 Pay ₹600 via Instant UPI QR
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'kds' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground">KDS DISPATCH SCREEN</span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                      Live Kitchen Sync
                    </span>
                  </div>

                  <div className="rounded-2xl border border-amber-500/40 bg-secondary p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-primary">#AT-0021 • Table 02</span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
                        {kdsCompleted ? 'READY FOR SERVING ✅' : 'COOKING (03:45)'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-foreground font-medium border-y border-border py-2">
                      <p>• 2x Grilled Chicken Steak (Medium Rare)</p>
                      <p>• 1x Rosemary Garlic Mashed Potato</p>
                      <p className="text-[10px] text-amber-400 font-bold">⚠️ Note: No Peanuts (Allergy)</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setKdsCompleted(!kdsCompleted)}
                      className={`w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        kdsCompleted
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      }`}
                    >
                      {kdsCompleted ? '✓ Order Marked Ready (Click to Reset)' : '🔔 Tap When Ready'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'waiter' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground">WAITER TABLE OVERVIEW</span>
                    <span className="text-xs font-bold text-[#A855F7]">🤵 Server: Rahul S.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-500/40 bg-secondary p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">Table 1</span>
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Seated • 4 Guests</p>
                      <span className="inline-block rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                        Round 2 Active
                      </span>
                    </div>

                    <div className="rounded-xl border border-cyan-500/50 bg-secondary p-3 space-y-2 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">Table 2</span>
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      </div>
                      <p className="text-[10px] text-cyan-300 font-bold">Food Ready to Serve!</p>
                      <button
                        type="button"
                        className="w-full rounded-lg bg-cyan-500/20 border border-cyan-500/40 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/40"
                      >
                        ✓ Mark Served
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground">SPLIT BILL CALCULATOR</span>
                    <span className="text-xs font-mono font-black text-primary">Total: ₹2,400.00</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Number of Diners to Split:</span>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSplitSeats(num)}
                            className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                              splitSeats === num
                                ? 'bg-primary text-[#070A0E] shadow-[0_0_10px_rgba(42,254,183,0.4)]'
                                : 'bg-secondary text-muted-foreground border border-border'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-4 text-center space-y-1">
                      <p className="text-[11px] text-muted-foreground">Each Guest Pays Exactly:</p>
                      <p className="text-2xl font-black text-primary font-mono">
                        ₹{(2400 / splitSeats).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-primary font-medium">
                        Instant QR code generated for each split share!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-border bg-secondary py-2.5 text-xs font-bold text-foreground hover:border-primary"
                      >
                        🖨️ Print 80mm Receipt
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-primary py-2.5 text-xs font-black uppercase text-[#070A0E] hover:bg-primary-hover"
                      >
                        ✓ Settle & Clear Table
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground">LIVE RECIPE STOCK DEPLETION</span>
                    <span className="text-[10px] font-bold text-primary">🤖 AI Predictive Mode</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">Mozzarella Cheese</span>
                        <span className="font-mono text-primary">8.2 kg remaining</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '82%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">Arabica Coffee Beans</span>
                        <span className="font-mono text-amber-400">1.4 kg (Low Stock Warning)</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '22%' }} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs space-y-1">
                      <p className="font-bold text-primary">📈 Saturday Rush AI Forecast:</p>
                      <p className="text-[11px] text-muted-foreground">
                        Expected 140% surge in coffee orders between 6 PM - 9 PM. Automated supplier reorder triggered.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tilt3DCard>
      </div>
    </section>
  );
}
