'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  Zap,
  Receipt,
  QrCode,
  ChefHat,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const FREE_TRIAL_PERKS = [
  'Full access to Cashier POS billing and 80mm thermal receipt printing',
  'Unlimited Table QR ordering codes for your dining room',
  'Live Kitchen Display System (KDS) for kitchen expediting',
  'Waiter mobile terminal access from staff smartphones',
  'Instant menu creation with categories, variants, and modifiers',
  'No credit card required to start • Instant 5-minute setup',
];

const FREE_FAQS = [
  {
    q: 'Is Kafei restaurant billing software really free to try?',
    a: 'Yes! Kafei offers a 100% free 14-day trial with full access to all essential billing, QR table ordering, and kitchen display features. You do not need to enter a credit card or speak with a salesperson.',
  },
  {
    q: 'What happens after my 14-day free trial ends?',
    a: 'After 14 days, you can choose the plan that fits your dining room (Starter at ₹499/mo, Growth at ₹999/mo, or Enterprise at ₹4,999/yr). Your menus, tables, and settings remain saved so your service never stops.',
  },
  {
    q: 'Do I need to buy any new equipment to use the free trial?',
    a: 'No. You can test Kafei on your existing laptop, iPad, Android phone, or counter PC. You can also print test receipts to standard thermal receipt printers.',
  },
];

export default function FreeRestaurantBillingSoftwarePage() {
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
            14-Day Full Access Free Trial
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.1] text-foreground">
            Try India’s Best Restaurant Billing Software for Free
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-muted-foreground">
            Set up your dining room in an afternoon and run a real dinner service on Kafei with zero upfront cost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-[15px] font-semibold text-background hover:bg-primary-hover transition-colors shadow-lg"
            >
              Create Your Free Account Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="font-mono text-xs text-muted-foreground pt-2">
            No credit card • No phone sales pitch • Instant browser access
          </p>
        </div>
      </section>

      {/* Perks Box */}
      <section className="border-t border-border bg-card/20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border bg-background p-8 sm:p-12 shadow-md">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              What’s Included in Your 14-Day Free Trial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FREE_TRIAL_PERKS.map((perk) => (
                <div key={perk} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-[14px] text-foreground leading-snug">{perk}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-border text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-[14px] font-semibold text-background hover:bg-primary-hover transition-colors"
              >
                Claim Your Free 14 Days
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-border px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Free Trial Questions & Answers
            </h2>
          </div>

          <div className="space-y-4">
            {FREE_FAQS.map((faq, idx) => {
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
            <Link href="/restaurant-pos-system" className="hover:text-foreground">POS System</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
