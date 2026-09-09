'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Monitor,
  Smartphone,
  Layers,
  BarChart3,
  Clock,
  Zap,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { PosComparisonTable } from '@/components/landing/PosComparisonTable';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const POS_FEATURES = [
  {
    icon: Monitor,
    title: 'Cloud-Native Floor Management',
    desc: 'Live visual table layout showing occupied tables, open checks, cooking progress, and settlement status in real-time.',
  },
  {
    icon: Smartphone,
    title: 'Waiter Mobile Handheld App',
    desc: 'Empower waitstaff to take orders at the table, modify modifiers, and push tickets directly to the kitchen bump bar.',
  },
  {
    icon: Layers,
    title: 'Multi-Branch & Dining Area Sync',
    desc: 'Control indoor dining, outdoor patios, rooftop lounges, and multiple branch outlets from a single cloud dashboard.',
  },
  {
    icon: BarChart3,
    title: 'AI Revenue & Demand Forecasting',
    desc: 'Predict peak dining hours, track top-grossing menu items, and optimize staff schedules with intelligent reporting.',
  },
  {
    icon: Clock,
    title: 'Instant 5-Minute Setup',
    desc: 'No technician visits or hardware installations. Sign up, create your menu, generate table QR codes, and start taking orders.',
  },
  {
    icon: Zap,
    title: 'Ultra-Fast Browser Printing',
    desc: 'Supports direct 80mm and 58mm ESC/POS thermal printing over USB, Bluetooth, or LAN with full GST breakout.',
  },
];

const POS_FAQS = [
  {
    q: 'What is a cloud restaurant POS system?',
    a: 'A cloud restaurant POS system is modern software that runs over the web rather than being locked to an expensive physical terminal. It lets restaurant owners, managers, and staff access live orders, sales reports, and floor statuses from any tablet, phone, or computer anywhere in the world.',
  },
  {
    q: 'Why should I switch from traditional desktop POS to Kafei Cloud POS?',
    a: 'Traditional POS systems lock you into expensive proprietary machines, charge hefty upfront license fees, and crash when local hard drives fail. Kafei is cloud-based, costs a fraction of legacy software (from ₹499/mo), takes 0% commission, and runs seamlessly on any device with a browser.',
  },
  {
    q: 'Can multiple staff members use Kafei POS simultaneously?',
    a: 'Yes. Kafei supports concurrent multi-user access with granular role permissions: Owners, Branch Managers, Cashiers, Waiters, and Kitchen Staff each see only the tools and screens they need.',
  },
  {
    q: 'Does Kafei POS work for cafes, bars, and food trucks?',
    a: 'Yes. Kafei is designed to adapt to any F&B concept: dine-in cafes, high-volume bars, quick-service eateries, fine dining rooms, and multi-location franchises.',
  },
];

export default function RestaurantPosSystemPage() {
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
            Next-Gen Cloud Restaurant POS
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1] text-foreground">
            The Complete Cloud Restaurant POS System for Fast-Moving Floors
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-muted-foreground">
            Transform iPads, Android tablets, and phones into an agile point-of-sale system.
            Manage tables, route tickets to kitchen screens, and settle bills in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[15px] font-semibold text-background hover:bg-primary-hover transition-colors shadow-lg"
            >
              Start Free for 14 Days
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Request Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Engineered to Accelerate Your Service Flow
            </h2>
            <p className="mt-4 text-muted-foreground text-[15px]">
              Every tool your front-of-house and back-of-house teams need to deliver flawless dining experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POS_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-background p-6 space-y-4 hover:border-primary/40 transition-colors shadow-sm"
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

      {/* Comparison Table */}
      <PosComparisonTable />

      {/* FAQs */}
      <section className="border-t border-border px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions About Restaurant POS Systems
            </h2>
          </div>

          <div className="space-y-4">
            {POS_FAQS.map((faq, idx) => {
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
            <Link href="/restaurant-billing-software" className="hover:text-foreground">Billing Software</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/legal" className="hover:text-foreground">Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
