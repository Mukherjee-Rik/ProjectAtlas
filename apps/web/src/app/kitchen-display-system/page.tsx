'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChefHat,
  Timer,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const KDS_FEATURES = [
  {
    icon: ChefHat,
    title: 'Paperless Kitchen Order Tickets (KOT)',
    desc: 'Orders placed by table QR or waiter tablets appear instantaneously on kitchen screens, eliminating lost or grease-stained paper tickets.',
  },
  {
    icon: Timer,
    title: 'Color-Coded Cooking Timers',
    desc: 'Tickets transition dynamically from green (fresh) to yellow (in-progress) and red (delayed) so expeditors prioritize orders effortlessly.',
  },
  {
    icon: CheckCircle2,
    title: 'One-Tap Status Bumping',
    desc: 'Chefs tap to start cooking, and tap again when food is plated. Floor staff and customers receive instant ready-for-pickup notifications.',
  },
  {
    icon: AlertCircle,
    title: 'Modifier & Allergy Highlighting',
    desc: 'Special guest instructions (e.g. "No peanuts", "Extra spicy", "Dressing on side") are clearly highlighted in bold amber warnings.',
  },
];

const KDS_FAQS = [
  {
    q: 'What is a Kitchen Display System (KDS)?',
    a: 'A Kitchen Display System (KDS) replaces traditional noisy paper ticket printers with a digital touchscreen in the kitchen. It displays incoming orders in real time with cooking countdown timers, dish modifications, and table numbers.',
  },
  {
    q: 'Can I use an ordinary tablet or monitor as a KDS screen?',
    a: 'Yes! Kafei KDS runs directly inside any web browser. You can use an inexpensive Android tablet, an iPad, a touchscreen monitor, or a smart TV mounted above the prep line.',
  },
];

export default function KitchenDisplaySystemPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei"
              width={32}
              height={32}
              className="h-7 w-auto object-contain rounded-md"
            />
            <span className="font-display text-lg font-extrabold text-foreground">Kafei</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-background hover:bg-primary-hover transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Digital Kitchen Order System (KDS)
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1] text-foreground">
            The Kitchen Display System That Eliminates Service Chaos
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-muted-foreground">
            Keep your kitchen line running at peak speed. Color-coded order queues, dish modifier alerts, and live cooking timers on any screen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[15px] font-semibold text-background hover:bg-primary-hover transition-colors shadow-lg"
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KDS_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-background p-6 space-y-3 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-border px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions About Kitchen Display Systems
            </h2>
          </div>

          <div className="space-y-4">
            {KDS_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-border bg-card/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <span className="font-display text-[16px] font-semibold text-foreground">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <Minus className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 border-t border-border/40 text-[14px] leading-relaxed text-muted-foreground">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Kafei Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/restaurant-billing-software" className="hover:text-foreground">Billing</Link>
            <Link href="/restaurant-pos-system" className="hover:text-foreground">POS System</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
