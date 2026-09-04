'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { ScrollProgressBar } from '@/components/landing/ScrollProgressBar';
import { ScrollReveal, ScrollStagger, staggerItemVariants } from '@/components/landing/ScrollReveal';
import { AuthenticHeroTerminal } from '@/components/landing/AuthenticHeroTerminal';
import { BentoModulesGrid } from '@/components/landing/BentoModulesGrid';
import { ServiceFlow } from '@/components/landing/ServiceFlow';
import { InteractiveTableStandee } from '@/components/landing/InteractiveTableStandee';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/* ---------------------------------------------------------------------------
   Page content
   Kept above the component so the markup below stays readable, and so copy
   edits don't mean scrolling through JSX.
--------------------------------------------------------------------------- */

/** Facts about the product, not invented traction numbers. */
const facts = [
  { value: '4', label: 'screens, one order' },
  { value: '0', label: 'apps for guests to install' },
  { value: '80mm', label: 'receipts, standard rolls' },
  { value: '14', label: 'days free, no card' },
];

/**
 * Reference-toned, not prose. The sections above already narrate the service;
 * this one is a spec sheet, so each line stays short enough to scan.
 */
const capabilities = [
  {
    name: 'Receipts',
    detail: '80mm thermal, tax broken out, order token on the footer. Prints from the browser.',
  },
  {
    name: 'Voids and refunds',
    detail: 'Waiter requests with a reason, manager approves. Both names stay on the record.',
  },
  {
    name: 'Table state',
    detail: 'Clears the moment you settle. A guest’s open menu can’t hold a table hostage.',
  },
  {
    name: 'Branches',
    detail: 'Unlimited, each with its own dining areas, tax rules and staff. One login for all.',
  },
  {
    name: 'Inventory',
    detail: 'Recipe-level. Ingredients deduct as dishes leave the pass, not at close of night.',
  },
  {
    name: 'Standees',
    detail: 'Print-ready QR per table, generated under your name rather than ours.',
  },
  {
    name: 'Roles',
    detail: 'Owner, manager, cashier, waiter, kitchen. Each sees only the screens they need.',
  },
];

const devices = [
  'Android tablet',
  'iPad',
  'Kitchen touchscreen',
  'Laptop',
  'POS terminal',
  'A waiter’s own phone',
];

/**
 * The four plans, in the order a room grows through them.
 *
 * Every quota line here is the number the app actually enforces — they come
 * from each plan's `limits` JSON in the database, so this page cannot quietly
 * promise more than the software allows.
 */
const plans = [
  {
    name: 'Free trial',
    price: '₹0',
    period: 'for 14 days',
    blurb: 'Set the room up and take real orders before you pay anything.',
    features: [
      '1 table',
      '1 staff member',
      '1 branch',
      '1 menu',
      'QR ordering, kitchen display and cashier terminal',
    ],
    cta: 'Start free',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Starter',
    price: '₹499',
    period: 'per month',
    blurb: 'One café or one room, running a full service.',
    features: [
      'Up to 20 tables',
      'Up to 5 staff members',
      '5 menus, 1 branch',
      'Orders, kitchen display and billing',
    ],
    cta: 'Choose Starter',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Growth',
    price: '₹999',
    period: 'per month',
    blurb: 'A busy floor, or a second outlet on the way.',
    features: [
      'Up to 100 tables',
      'Up to 50 staff members',
      '20 menus, 5 branches',
      'Analytics and demand forecasting',
      'AI copilot and automations',
    ],
    cta: 'Choose Growth',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    subheading: 'Starting from',
    price: '₹4,999',
    period: '/ year',
    blurb: 'Several outlets that need to roll up into one view.',
    features: [
      'Unlimited tables, staff, menus and branches',
      'Stock synced across outlets',
      'Everything in Growth',
      'Priority support with an SLA',
    ],
    cta: 'Talk to us',
    href: '/contact',
    featured: false,
  },
];

const faqs = [
  {
    q: 'Do guests have to download anything?',
    a: 'No. They point their camera at the standee on the table and the menu opens in whatever browser their phone already has — photos, variants, and a live cooking countdown once the kitchen accepts.',
  },
  {
    q: 'What hardware do we need to buy?',
    a: 'None, in most cases. Kafei is a web application. If a device has a browser it can be a terminal — the tablet behind your counter, a kitchen touchscreen, a laptop, or a waiter’s own phone.',
  },
  {
    q: 'How does the payment QR work?',
    a: 'You upload your own UPI QR image in Settings. When guests are done, their phone shows the bill total alongside that QR. They can also just pay cash or card at the counter — the cashier screen handles both.',
  },
  {
    q: 'What stops a waiter from quietly cancelling an order?',
    a: 'Nothing gets cancelled on the spot. The request goes into a review queue on the cashier and owner screens with the waiter’s reason attached, and it stays there until a manager approves it. Refunds work the same way.',
  },
  {
    q: 'Can we run more than one room, or more than one outlet?',
    a: 'Yes. Dining areas are separate inside a branch, and branches are separate inside your account — each with its own tables, tax rules, and staff. Revenue from all of them rolls up into one dashboard.',
  },
];

/* ------------------------------------------------------------------------- */

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background font-sans text-foreground selection:bg-primary/25 selection:text-foreground">
      {/* Ambient light for the glass nav to refract. Without it the nav has a
          flat fill behind it and the lens has nothing to bend. */}
      <div className="ambient" aria-hidden="true" />
      <ScrollProgressBar />

      {/* ═══ Nav ═════════════════════════════════════════════════════════ */}
      <header className="liquid-glass sticky top-0 z-50 rounded-none border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei"
              width={34}
              height={34}
              priority
              className="h-8 w-auto object-contain rounded-md"
            />
            <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-foreground">
              Kafei
            </span>
          </Link>

          <nav className="hidden items-center gap-9 text-[13px] text-muted-foreground md:flex">
            <a href="#floor" className="transition-colors hover:text-foreground">
              Floor view
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact Us
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Hero ════════════════════════════════════════════════════════
          Reduced gap between navbar and content for a crisp, immediate hero view */}
      {/* No hero image, deliberately. The type carries this section and the
          floor view lands immediately below — a mockup in a narrow column
          only ever competed with the headline. The measure is capped so the
          space to the right reads as composition rather than a gap. */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 pt-8 sm:pt-14 lg:px-8 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
          {/* Hero Left Column */}
          <div className="lg:col-span-6 xl:col-span-5">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Kafei 2.0 is live
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-5 max-w-4xl font-display text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[3.2rem] lg:text-[3.8rem]"
            >
              Nothing gets lost
              <br />
              <span className="text-muted-foreground">between the table</span>
              <br />
              and the kitchen.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-6 max-w-xl text-[14px] sm:text-[15px] leading-[1.7] text-muted-foreground"
            >
              Kafei runs the whole floor on one system: the QR menu your guests order
              from, the screen your kitchen cooks off, the tablet your waiters carry,
              and the counter where the bill gets settled.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-8 flex flex-col items-start gap-x-8 gap-y-4 sm:flex-row sm:items-center"
            >
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-background transition-colors hover:bg-primary-hover sm:w-auto"
              >
                Start free for 14 days
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#floor"
                className="inline-flex items-center gap-2 border-b border-border pb-0.5 text-[14px] text-foreground transition-colors hover:border-border hover:text-foreground"
              >
                See the floor view
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 font-mono text-[12px] text-subtle"
            >
              Or poke around the live demo —{' '}
              <span className="text-muted-foreground">demo@kafei.app</span>
              <span className="mx-1.5 text-subtle">/</span>
              <span className="text-muted-foreground">Kafei@12345</span>
            </motion.p>
          </div>

          {/* Hero Right Column: Interactive 3D Acrylic Table Standee */}
          <div className="lg:col-span-6 xl:col-span-7 min-w-0">
            <InteractiveTableStandee />
          </div>
        </div>
      </section>

      {/* ═══ Facts strip ═════════════════════════════════════════════════
          gap-px over a hairline-coloured track gives clean rules between
          cells at any column count — including the row gap once this wraps
          to two columns on a phone. */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px bg-secondary sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-background px-5 py-8 sm:px-7">
                <p className="font-display text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
                  {fact.value}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{fact.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Floor view (product) ════════════════════════════════════════ */}
      <section id="floor" className="px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto mb-12 max-w-6xl">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              The floor, right now
            </p>
            <h2 className="mt-5 max-w-2xl font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
              Every table, every token, on one screen.
            </h2>
          </ScrollReveal>
        </div>
        {/* Pinned dark: this is a product shot of the app's floor view, and a
            dark screenshot reads as a screenshot on either page theme. */}
        <div className="dark">
          <AuthenticHeroTerminal />
        </div>
      </section>

      {/* ═══ Modules ═════════════════════════════════════════════════════ */}
      <BentoModulesGrid />

      {/* ═══ Service flow ════════════════════════════════════════════════ */}
      <ServiceFlow />

      {/* ═══ Capabilities ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="grid gap-6 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  The unglamorous half
                </p>
                <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
                  The parts nobody demos.
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground md:col-span-5">
                Ordering is the easy bit. What decides whether you keep using a system
                is the printing, the voids, and the day the Wi-Fi drops.
              </p>
            </div>
          </ScrollReveal>

          {/* A spec list on hairlines, not seven identical boxes. */}
          <ScrollStagger className="mt-14 border-t border-border">
            {capabilities.map((cap) => (
              <motion.div
                key={cap.name}
                variants={staggerItemVariants}
                className="grid items-baseline gap-x-12 gap-y-1.5 border-b border-border py-5 md:grid-cols-12"
              >
                <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground md:col-span-3">
                  {cap.name}
                </h3>
                <p className="text-[15px] leading-[1.6] text-muted-foreground md:col-span-9">
                  {cap.detail}
                </p>
              </motion.div>
            ))}
          </ScrollStagger>
        </div>
      </section>

      {/* ═══ Where it runs ═══════════════════════════════════════════════ */}
      <section className="px-6 py-24 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="grid gap-x-12 gap-y-8 md:grid-cols-12">
              <div className="md:col-span-6">
                <h2 className="font-display text-[1.75rem] font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
                  It runs on whatever is already on your counter.
                </h2>
              </div>
              <div className="md:col-span-6 md:pt-2">
                <p className="text-[15px] leading-[1.75] text-muted-foreground">
                  Kafei is a web application, not an install. There is no proprietary terminal to
                  buy or lease, and no dongle that stops working when a cable goes
                  missing. If a device has a browser, it can be a station.
                </p>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {devices.map((device) => (
                    <li
                      key={device}
                      className="rounded-full border border-border px-3.5 py-1.5 text-[13px] text-muted-foreground"
                    >
                      {device}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ Pricing ═════════════════════════════════════════════════════ */}
      <section id="pricing" className="border-t border-border px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="grid gap-6 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Pricing
                </p>
                <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
                  Flat monthly. No cut of your sales.
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground md:col-span-5">
                We don’t sit between you and your payment provider, so there is no
                percentage skimmed off each bill. Start on 14 free days, then pick the
                plan that matches your floor.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-secondary sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col justify-between gap-10 p-8 ${
                  plan.featured ? 'bg-card' : 'bg-background'
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[15px] font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    {plan.featured && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                        Most rooms pick this
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    {(plan as any).subheading && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                        {(plan as any).subheading}
                      </p>
                    )}
                    <p className="flex items-baseline gap-2">
                      <span className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.04em] text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-[13px] text-muted-foreground">{plan.period}</span>
                    </p>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                    {plan.blurb}
                  </p>

                  <ul className="mt-8 space-y-3 border-t border-border pt-7">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-[14px] leading-snug text-foreground"
                      >
                        <span
                          aria-hidden
                          className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`rounded-lg py-3 text-center text-[14px] font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-primary text-background hover:bg-primary-hover'
                      : 'border border-border text-foreground hover:bg-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════ */}
      <section id="faq" className="border-t border-border px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.5rem]">
              Questions we
              <br />
              actually get.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
              Something not here?{' '}
              <Link
                href="/contact"
                className="border-b border-border pb-px text-primary transition-colors hover:border-primary hover:text-primary-hover font-semibold"
              >
                Ask us
              </Link>
              .
            </p>
          </div>

          <div className="border-t border-border md:col-span-8">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-5 py-6 text-left"
                  >
                    <span className="mt-0.5 font-mono text-[11px] text-subtle">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 font-display text-[16px] font-medium tracking-[-0.01em] text-foreground sm:text-[17px]">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Plus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="max-w-2xl pb-7 pl-9 text-[15px] leading-[1.75] text-muted-foreground">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Closing ═════════════════════════════════════════════════════ */}
      <section className="border-t border-border px-6 py-28 sm:py-36 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="max-w-3xl font-display text-[2.25rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[3.25rem]">
              Put it on one room and see how service goes.
            </h2>
            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-muted-foreground">
              Fourteen days, no card, no call with a salesperson. Set up your tables in
              an afternoon and run a real dinner service on it.
            </p>
            <div className="mt-10 flex flex-col items-start gap-x-8 gap-y-5 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[14px] font-semibold text-background transition-colors hover:bg-primary-hover sm:w-auto"
              >
                Start free for 14 days
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center border-b border-border pb-0.5 text-[14px] text-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Sign in instead
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ Footer ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-background px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="Kafei"
                  width={28}
                  height={28}
                  className="h-7 w-auto object-contain rounded-md"
                />
                <span className="font-display text-[15px] font-extrabold tracking-[-0.02em] text-foreground">
                  Kafei
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                Restaurant billing and floor software for dine-in operations. Built for rooms that fill up.
              </p>
            </div>

            <div className="md:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                <li>
                  <a href="#floor" className="transition-colors hover:text-foreground">
                    Floor view
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="transition-colors hover:text-foreground">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="transition-colors hover:text-foreground">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-foreground">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                Legal & Trust
              </p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="transition-colors hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="transition-colors hover:text-foreground">
                    Security Policy
                  </Link>
                </li>
                <li>
                  <Link href="/ai-policy" className="transition-colors hover:text-foreground">
                    AI Usage Policy
                  </Link>
                </li>
                <li>
                  <Link href="/dpa" className="transition-colors hover:text-foreground">
                    Data Processing (DPA)
                  </Link>
                </li>
                <li>
                  <Link href="/data-deletion" className="transition-colors hover:text-foreground">
                    Data Deletion
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className="transition-colors hover:text-foreground">
                    Refund & Cancellation
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="text-primary font-medium hover:underline">
                    All legal policies →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                Help & Contact
              </p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                <li>
                  <Link href="/docs" className="transition-colors hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="transition-colors hover:text-foreground">
                    Support Desk
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition-colors hover:text-foreground font-semibold text-primary">
                    Contact & Talk to Us
                  </Link>
                </li>
                <li>
                  <a href="tel:9903085026" className="text-primary font-mono text-[12px] hover:underline">
                    +91 9903085026
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-between border-t border-border pt-7 text-[12px] text-subtle gap-4">
            <p>© {new Date().getFullYear()} Antigravity. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('kafei:open-cookie-preferences'));
                  }
                }}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Cookie Preferences
              </button>
              <Link href="/data-deletion" className="hover:text-foreground transition-colors">Data Deletion</Link>
              <Link href="/legal" className="hover:text-foreground transition-colors">Legal Hub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
