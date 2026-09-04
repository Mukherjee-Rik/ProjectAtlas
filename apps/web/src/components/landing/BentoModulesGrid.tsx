'use client';

import React, { useState } from 'react';
import {
  QrCode,
  ChefHat,
  Receipt,
  ShieldCheck,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export function BentoModulesGrid() {
  // Card 1: QR ordering cart state
  const [cartQty, setCartQty] = useState(2);
  const dishPrice = 380;

  // Card 3: Split bill state
  const [splitCount, setSplitCount] = useState(3);
  const totalBill = 2100;

  // Card 4: Cancellation review state
  const [cancellationState, setCancellationState] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <section
      id="modules"
      className="mx-auto max-w-6xl space-y-12 border-t border-border px-6 py-24 sm:py-32 lg:px-8"
    >
      {/* Section Header */}
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Try it here
          </p>
          <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
            Poke at the real thing.
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground md:col-span-5">
          These aren’t screenshots. Add a dish, split a bill, approve a void — the
          panels below behave the way the real thing does.
        </p>
      </div>

      {/* Bento Layout Grid */}
      {/* `dark` is pinned here on purpose. These panels are product shots of a
          dark app UI; re-rendering them light would mean re-designing four
          bespoke mockups, and a dark screenshot on a light page is the normal
          convention anyway. Scoping the class re-resolves every token inside
          to its dark value, so the panels stay legible in either page theme. */}
      <div className="dark grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Bento 1: QR Dine-In Ordering (7 Cols) */}
        <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-border transition-all group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                <QrCode className="h-4 w-4 text-primary" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                At the table
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground tracking-[-0.02em]">
              Guests order from their own phone
            </h3>
            <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-[1.65]">
              They scan the standee, browse with photos, pick their variants and send it.
              A second round an hour later joins the same table under its own token.
            </p>
          </div>

          {/* Interactive Phone Widget Mockup */}
          <div className="rounded-xl border border-border bg-secondary p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-foreground">Table 04 • Cafe Rizz</span>
              </div>
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Token #AT-0041
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-foreground font-medium">Truffle Fettuccine Alfredo</p>
                <p className="text-[10px] text-muted-foreground">Extra Parmesan, Spicy</p>
              </div>
              <div className="flex items-center gap-2 bg-input rounded-lg border border-border px-2 py-1">
                <button
                  type="button"
                  onClick={() => setCartQty(Math.max(1, cartQty - 1))}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono text-xs font-semibold text-foreground">{cartQty}</span>
                <button
                  type="button"
                  onClick={() => setCartQty(cartQty + 1)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Total:</span>
              <span className="font-mono text-sm font-bold text-foreground">
                ₹{(cartQty * dishPrice).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bento 2: Sub-Second Kitchen KDS (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-border transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                <ChefHat className="h-4 w-4 text-primary" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                In the kitchen
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground tracking-[-0.02em]">
              The line works off a screen
            </h3>
            <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-[1.65]">
              Tickets arrive in the order they were placed, with modifiers and allergy
              notes in the same spot every time. A chime for each new round.
            </p>
          </div>

          <div className="rounded-xl border border-atlas-warning/20 bg-secondary p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-foreground font-semibold">#AT-1082 • Station 1</span>
              <span className="text-atlas-warning font-semibold">03:45m</span>
            </div>
            <p className="text-foreground">2x Grilled Lamb Chops (Med Rare)</p>
            <p className="text-[11px] font-medium text-atlas-warning">Contains nuts — flagged</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                <Check className="h-3 w-3" /> Audio Alert Connected
              </span>
            </div>
          </div>
        </div>

        {/* Bento 3: Split-Bill Calculator (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-border transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                <Receipt className="h-4 w-4 text-primary" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                At the counter
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground tracking-[-0.02em]">
              Split it however they ask
            </h3>
            <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-[1.65]">
              By head or by item, each share carrying its own UPI QR. Then an 80mm
              receipt with the tax broken out.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Split between diners:</span>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={`h-6 w-6 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      splitCount === num
                        ? 'bg-primary text-background font-bold'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-card p-3 border border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Each Guest Pays:</span>
              <span className="font-mono text-sm font-bold text-primary">
                ₹{(totalBill / splitCount).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Bento 4: Security & Audit (7 Cols) */}
        <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-border transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Approvals
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground tracking-[-0.02em]">
              Voids need a second signature
            </h3>
            <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-[1.65]">
              A waiter files the request with a reason attached. It sits in the manager’s
              queue until someone approves it, and only then does the refund go through.
              Try it below.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
              <span className="font-mono text-foreground">Cancellation Request #CR-09</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                  cancellationState === 'approved'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : cancellationState === 'rejected'
                    ? 'bg-atlas-error/10 text-atlas-error border border-atlas-error/20'
                    : 'bg-atlas-warning/10 text-atlas-warning border border-atlas-warning/20'
                }`}
              >
                {cancellationState === 'approved'
                  ? 'Approved & Reconciled'
                  : cancellationState === 'rejected'
                  ? 'Rejected'
                  : 'Pending Review'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Waiter Rahul S. requested cancellation of &apos;1x Peach Sparkler Iced Tea&apos; (Table 02). Reason: Guest changed mind.
            </p>

            {cancellationState === 'pending' ? (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCancellationState('approved')}
                  className="flex-1 rounded-lg bg-primary/15 border border-primary/30 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 transition-all cursor-pointer"
                >
                  Approve with manager PIN
                </button>
                <button
                  type="button"
                  onClick={() => setCancellationState('rejected')}
                  className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Reject
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCancellationState('pending')}
                className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Reset demo state
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
