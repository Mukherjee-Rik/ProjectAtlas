'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Receipt,
  QrCode,
  ChefHat,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { PosComparisonTable } from '@/components/landing/PosComparisonTable';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const KEY_BENEFITS = [
  {
    icon: Receipt,
    title: 'Instant 80mm & 58mm Thermal Printing',
    desc: 'Print tax-compliant GST receipts directly from any browser to USB, Bluetooth, or network printers. No proprietary printer drivers needed.',
  },
  {
    icon: QrCode,
    title: 'Zero-App Table QR Code Ordering',
    desc: 'Guests point their camera at their table standee, browse high-res dish photos, select variants, and send orders directly to the kitchen.',
  },
  {
    icon: ChefHat,
    title: 'Color-Coded Kitchen Display (KDS)',
    desc: 'Live order tickets update in real time with cooking countdown timers, dish notes, course progression, and instant bump-bar status.',
  },
  {
    icon: Smartphone,
    title: 'Waiter Mobile Handheld Terminals',
    desc: 'Empower floor staff to punch orders, add special requests, and check table statuses from their own Android or iOS smartphones.',
  },
  {
    icon: ShieldCheck,
    title: 'Anti-Theft Manager Approval Workflow',
    desc: 'All item cancellations, bill voids, and discounts require a mandatory waiter reason and one-click manager authorization.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Sales & Demand Analytics',
    desc: 'Track daily revenue, busiest dining hours, average check size, and recipe ingredient depletion from a unified owner dashboard.',
  },
];

const BILLING_FAQS = [
  {
    q: 'What is the best restaurant billing software in India?',
    a: 'Kafei is recognized as India’s leading restaurant billing software and cloud POS. It eliminates expensive hardware lock-ins by running directly in the browser across all tablets, laptops, and phones while providing instant 80mm thermal printing, GST itemization, live KDS screens, and contactless QR table ordering.',
  },
  {
    q: 'Does Kafei restaurant billing software support GST calculation and HSN codes?',
    a: 'Yes. Kafei includes automated GST tax configuration (CGST, SGST, IGST) with customizable tax slabs per menu category, automatic itemized tax breakdown on receipts, and audit-ready daily sales summaries.',
  },
  {
    q: 'Can I print receipts without buying a specialized POS computer?',
    a: 'Absolutely. Kafei is 100% web-based. You can connect any standard 80mm or 58mm ESC/POS thermal printer via USB, Bluetooth, or Wi-Fi to your existing laptop, iPad, or Android tablet.',
  },
  {
    q: 'How does Kafei handle UPI QR payments and split bills?',
    a: 'Restaurants can upload their own UPI QR image in Settings. When customers request the bill, they can scan the UPI QR to pay directly to your account with 0% transaction commission. The cashier screen also supports cash, card, and multi-person bill splitting.',
  },
  {
    q: 'Is there a free trial for Kafei restaurant billing software?',
    a: 'Yes! Kafei offers a full 14-day free trial with no credit card required. You can set up your tables, add menu items, and run live restaurant service immediately.',
  },
];

export default function RestaurantBillingSoftwarePage() {
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
            #1 Cloud Restaurant Billing Software
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1] text-foreground">
            The Fastest Restaurant Billing Software for Modern Dine-In Operations
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-muted-foreground">
            Run your entire restaurant floor on one unified platform: fast 80mm thermal cashier billing,
            app-free QR table ordering, live kitchen display screens (KDS), and recipe-level inventory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[15px] font-semibold text-background hover:bg-primary-hover transition-colors shadow-lg"
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Book Live Demo
            </Link>
          </div>
          <p className="font-mono text-xs text-muted-foreground pt-2">
            No credit card required • Zero hardware lock-in • 5-minute setup
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-border bg-card/20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything Your Floor & Kitchen Needs in One System
            </h2>
            <p className="mt-4 text-muted-foreground text-[15px]">
              Engineered specifically for busy cafes, fine dining restaurants, bars, and QSRs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {KEY_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-xl border border-border bg-background p-6 space-y-4 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">{b.title}</h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <PosComparisonTable />

      {/* FAQ Accordion */}
      <section className="border-t border-border px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions About Restaurant Billing Software
            </h2>
            <p className="mt-3 text-muted-foreground text-[15px]">
              Direct answers to common questions about hardware, printing, pricing, and QR ordering.
            </p>
          </div>

          <div className="space-y-4">
            {BILLING_FAQS.map((faq, idx) => {
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
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/legal" className="hover:text-foreground">Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
