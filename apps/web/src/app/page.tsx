'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeModuleTab, setActiveModuleTab] = useState<'qr' | 'kds' | 'waiter' | 'pos' | 'inventory'>('qr');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    {
      id: 'qr',
      name: '📱 QR Dine-In & Ordering',
      badge: 'Zero App Download',
      title: 'Frictionless QR Dine-In with Live Multi-Token Tracking',
      description:
        'Customers simply scan the table QR code to browse appetite-inducing categorized menus, customize dishes with variants and add-ons, place multiple rounds of orders, and pay directly from their seat via UPI.',
      highlights: [
        'Real-time multi-token round tracking (#AT-000001, #AT-000002)',
        'Custom Standee QR code generation for every table and dining zone',
        'Direct UPI payments at the seat with enlarged scan view',
        'Waiter assistance calls and water requests at the tap of a button',
      ],
      previewStats: {
        metric1: '+38%',
        label1: 'Faster Table Ordering',
        metric2: '0',
        label2: 'App Downloads Required',
      },
    },
    {
      id: 'kds',
      name: '👨‍🍳 Kitchen Display (KDS)',
      badge: 'Sub-Second Sync',
      title: 'Real-Time Paperless Kitchen Ticket Flow',
      description:
        'Equip your chefs with a lightning-fast, color-coded digital ticket screen that eliminates lost paper dockets, prioritizes tickets by cooking prep time, and alerts staff with pleasant audio chimes.',
      highlights: [
        'Audio chime alerts on incoming customer and waiter orders',
        'Live status progression: Pending ➔ Cooking (Preparing) ➔ Ready',
        'Item-level variant selections, modifiers, and allergy tags',
        'Automatic order completion sync with Waiter and Cashier terminals',
      ],
      previewStats: {
        metric1: '< 8 mins',
        label1: 'Average Preparation Time',
        metric2: '100%',
        label2: 'Docket Accuracy',
      },
    },
    {
      id: 'waiter',
      name: '🤵 Waiter Handheld Floor',
      badge: 'Mobile-First',
      title: 'Floor Management & Instant Table Service',
      description:
        'Empower your floor staff with an interactive dining floor map. View table occupancy at a glance, seat guests, take handheld POS orders, serve prepared dishes, and initiate manager-approved cancellations.',
      highlights: [
        'Color-coded floor status: Available (Green), Occupied (Red), Ready (Yellow)',
        'Handheld digital order taking and instant KDS routing',
        'One-click table clearing with strict ghost-session prevention',
        'Two-tier manager cancellation requests for revenue protection',
      ],
      previewStats: {
        metric1: '3x',
        label1: 'Faster Table Turnaround',
        metric2: '100%',
        label2: 'Staff Floor Visibility',
      },
    },
    {
      id: 'pos',
      name: '💵 Cashier POS & Finance',
      badge: 'Audit Compliant',
      title: 'Split Billing, Settlements & Refund Ledger',
      description:
        'A comprehensive cashier terminal engineered for high-volume rush hours. Collect cash or UPI payments, execute split payments, review waiter cancellation requests, and maintain an immutable financial ledger.',
      highlights: [
        'Split cash and UPI payments for large group tables',
        'Formal cancellation review workflow (Approve / Reject with notes)',
        'Full and partial refund ledger with automated audit logs',
        'Instant GST tax calculation and thermal print receipt generation',
      ],
      previewStats: {
        metric1: '0',
        label1: 'Reconciliation Discrepancies',
        metric2: 'Instant',
        label2: 'Split Bill Calculation',
      },
    },
    {
      id: 'inventory',
      name: '📦 Inventory & AI Forecasts',
      badge: 'Automated Stocking',
      title: 'Automated Recipe Stock Deduction & Demand AI',
      description:
        'Eliminate kitchen food waste and stockouts. Project Atlas automatically deducts raw ingredient stocks as orders are completed, alerts you when supplies run low, and predicts weekly demand with AI.',
      highlights: [
        'Automatic ingredient depletion per dish recipe (Meat, Dairy, Veggies)',
        'Real-time low-stock warnings and raw material waste logs',
        'Predictive AI demand forecasting for peak weekend rush hours',
        'Multi-branch supply tracking and unit cost management',
      ],
      previewStats: {
        metric1: '-24%',
        label1: 'Food Waste Reduction',
        metric2: 'Auto',
        label2: 'Ingredient Depletion',
      },
    },
  ];

  const faqs = [
    {
      q: 'Do customers need to download an app to order?',
      a: 'No! Customers simply open their smartphone camera and scan the QR standee on the table. The web menu opens instantly in their browser with high-resolution food images, customization options, and live cooking progress.',
    },
    {
      q: 'What hardware do I need to run Project Atlas?',
      a: 'Project Atlas is 100% web-native and responsive. You can run it on any device: iPads, Android tablets, kitchen touchscreens, laptops, POS billing terminals, or personal staff smartphones.',
    },
    {
      q: 'How does the table payment and QR settlement work?',
      a: 'You can upload your restaurant’s custom UPI QR image in Settings. When customers finish their meal, the system displays the combined bill total and payment QR on their phone. Alternatively, they can pay via cash or card at the cashier counter.',
    },
    {
      q: 'How does the cancellation workflow protect against fraud?',
      a: 'When a waiter requests to cancel any order, it is placed into a "Pending Review" queue on the Cashier / Owner dashboard. The Owner or Manager reviews the reason and notes before approving the cancellation and issuing a refund, ensuring complete financial integrity.',
    },
    {
      q: 'Can I manage multiple branches and dining zones?',
      a: 'Yes. Atlas includes built-in multi-tenant and multi-branch management. You can configure individual dining areas (e.g. AC Hall, Rooftop, Patio), assign specific tables, track branch-specific revenues, and monitor everything from a centralized executive dashboard.',
    },
  ];

  const activeModule = modules.find((m) => m.id === activeModuleTab) || modules[0];

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#F5F7FA] font-sans selection:bg-[#2AFEB7] selection:text-[#070A0E] overflow-x-hidden">
      {/* ── Background Glow Elements ────────────────────────────────────── */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#2AFEB7]/10 blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#A855F7]/10 blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#3B82F6]/5 blur-[120px] pointer-events-none -z-10" />

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#26313C]/60 bg-[#070A0E]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Atlas Logo" className="h-9 w-auto object-contain" />
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              ATLAS
              <span className="rounded bg-[#2AFEB7]/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#2AFEB7] border border-[#2AFEB7]/30">
                Restaurant OS
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
            <a href="#features" className="transition-colors hover:text-[#2AFEB7]">
              Features
            </a>
            <a href="#modules" className="transition-colors hover:text-[#2AFEB7]">
              Modules
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-[#2AFEB7]">
              How It Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#2AFEB7]">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-[#2AFEB7]">
              FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-[#26313C] bg-[#111820] px-4 py-2 text-xs font-bold text-[#F5F7FA] transition-all hover:border-[#2AFEB7]/50 hover:text-[#2AFEB7]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#2AFEB7] px-4 py-2 text-xs font-extrabold text-[#070A0E] shadow-[0_0_20px_rgba(42,254,183,0.3)] transition-all hover:bg-[#22E5A4] hover:shadow-[0_0_25px_rgba(42,254,183,0.5)] active:scale-95"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden rounded-lg border border-[#26313C] bg-[#111820] p-2 text-[#9AA6B2] hover:text-white"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-[#26313C] bg-[#0B0F14] px-4 py-4 sm:hidden space-y-3">
            <div className="flex flex-col space-y-2 text-xs font-bold text-[#9AA6B2]">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#2AFEB7]"
              >
                Features
              </a>
              <a
                href="#modules"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#2AFEB7]"
              >
                Modules
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#2AFEB7]"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#2AFEB7]"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#2AFEB7]"
              >
                FAQ
              </a>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center rounded-xl border border-[#26313C] bg-[#111820] py-2.5 text-xs font-bold text-[#F5F7FA]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full text-center rounded-xl bg-[#2AFEB7] py-2.5 text-xs font-extrabold text-[#070A0E]"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-4 py-1.5 text-xs font-bold text-[#2AFEB7] shadow-sm animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#2AFEB7]" />
            <span>Atlas v2.0 • The Complete Restaurant Operating System</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#F5F7FA] to-[#9AA6B2]">
            Run Your Entire Restaurant <br />
            <span className="bg-clip-text bg-gradient-to-r from-[#2AFEB7] via-[#22E5A4] to-[#A855F7]">
              On Pure Autopilot
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#9AA6B2] leading-relaxed">
            Dynamic QR Dine-In, Live Kitchen Display (KDS), Waiter Floor Terminals, Real-Time Recipe
            Inventory, and AI Demand Forecasting — unified into one lightning-fast platform.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-xl bg-[#2AFEB7] px-8 py-4 text-sm font-black tracking-wider uppercase text-[#070A0E] shadow-[0_0_30px_rgba(42,254,183,0.35)] transition-all hover:bg-[#22E5A4] hover:shadow-[0_0_40px_rgba(42,254,183,0.55)] hover:scale-105 active:scale-95"
            >
              🚀 Launch Restaurant Free
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl border border-[#26313C] bg-[#111820]/80 backdrop-blur px-8 py-4 text-sm font-bold text-[#F5F7FA] transition-all hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7] hover:bg-[#18212B]"
            >
              Live Demo Portal →
            </Link>
          </div>

          {/* Demo Credentials Pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#26313C] bg-[#111820]/60 px-4 py-2 text-[11px] text-[#9AA6B2]">
            <span>🔑 Instant Demo Account:</span>
            <span className="font-mono text-[#2AFEB7] font-bold">test@atlas.com</span>
            <span>/</span>
            <span className="font-mono text-[#2AFEB7] font-bold">Atlas@12345</span>
          </div>

          {/* Stat Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-[#26313C] bg-[#111820]/70 p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#2AFEB7]">&lt; 15s</p>
              <p className="mt-1 text-xs text-[#9AA6B2] font-semibold">QR Order to Kitchen</p>
            </div>
            <div className="rounded-2xl border border-[#26313C] bg-[#111820]/70 p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#A855F7]">+34%</p>
              <p className="mt-1 text-xs text-[#9AA6B2] font-semibold">Table Turnover Speed</p>
            </div>
            <div className="rounded-2xl border border-[#26313C] bg-[#111820]/70 p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#38BDF8]">0%</p>
              <p className="mt-1 text-xs text-[#9AA6B2] font-semibold">Paper Docket Waste</p>
            </div>
            <div className="rounded-2xl border border-[#26313C] bg-[#111820]/70 p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#22C55E]">100%</p>
              <p className="mt-1 text-xs text-[#9AA6B2] font-semibold">Cloud Real-Time Sync</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive OS Simulation Preview ────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#26313C] bg-[#111820]/80 p-4 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mock Window Controls */}
          <div className="flex items-center justify-between border-b border-[#26313C] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
              <span className="h-3 w-3 rounded-full bg-[#EAB308]" />
              <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
              <span className="ml-3 text-xs font-mono text-[#9AA6B2] font-bold">
                atlas-os.restaurant.live • Cafe Rizz (Main Branch)
              </span>
            </div>
            <span className="rounded-full bg-[#2AFEB7]/10 px-3 py-1 text-[10px] font-extrabold uppercase text-[#2AFEB7] border border-[#2AFEB7]/30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2AFEB7] animate-ping" />
              Live Sync
            </span>
          </div>

          {/* Mock Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Live Dining Floor Overview */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#9AA6B2]">
                  Live Floor Map (Main Dining)
                </h3>
                <span className="text-xs text-[#2AFEB7] font-bold">4 Active Tables</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 1</span>
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  </div>
                  <p className="text-[10px] text-[#9AA6B2]">Round 1 (2 Items)</p>
                  <p className="text-xs font-extrabold text-[#2AFEB7]">₹840.00</p>
                </div>

                <div className="rounded-xl border border-[#EAB308]/50 bg-[#EAB308]/10 p-3.5 space-y-2 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 2</span>
                    <span className="h-2 w-2 rounded-full bg-[#EAB308] animate-ping" />
                  </div>
                  <span className="inline-block rounded bg-[#EAB308]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#EAB308]">
                    READY 🔔
                  </span>
                  <p className="text-xs font-extrabold text-[#2AFEB7]">₹1,240.00</p>
                </div>

                <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 3</span>
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  </div>
                  <p className="text-[10px] text-[#22C55E] font-bold">Available</p>
                  <p className="text-xs font-mono text-[#9AA6B2]">👥 4 seats</p>
                </div>

                <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 4</span>
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  </div>
                  <p className="text-[10px] text-[#9AA6B2]">Round 2 (Multi-Token)</p>
                  <p className="text-xs font-extrabold text-[#2AFEB7]">₹2,180.00</p>
                </div>

                <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 5</span>
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  </div>
                  <p className="text-[10px] text-[#22C55E] font-bold">Available</p>
                  <p className="text-xs font-mono text-[#9AA6B2]">👥 6 seats</p>
                </div>

                <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">Table 6</span>
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  </div>
                  <p className="text-[10px] text-[#22C55E] font-bold">Available</p>
                  <p className="text-xs font-mono text-[#9AA6B2]">👥 2 seats</p>
                </div>
              </div>
            </div>

            {/* Live KDS Ticket Feed */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#9AA6B2]">
                  Live Kitchen Queue (KDS)
                </h3>
                <span className="text-xs text-[#EAB308] font-bold">2 In Prep</span>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-[#A855F7]/30 bg-[#18212B] p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#2AFEB7] text-xs">#AT-000012 • Table 2</span>
                    <span className="rounded bg-[#A855F7]/20 px-2 py-0.5 text-[9px] font-bold text-[#A855F7]">
                      COOKING 🍳
                    </span>
                  </div>
                  <p className="text-xs text-[#F5F7FA] font-medium">1x Butter Chicken, 2x Garlic Naan</p>
                  <p className="text-[10px] text-[#9AA6B2]">⏱️ Prep timer: 04:12 mins</p>
                </div>

                <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#2AFEB7] text-xs">#AT-000013 • Table 4</span>
                    <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                      NEW ORDER
                    </span>
                  </div>
                  <p className="text-xs text-[#F5F7FA] font-medium">2x Cold Coffee, 1x Paneer Tikka</p>
                  <p className="text-[10px] text-[#9AA6B2]">⏱️ Placed 30s ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Modules Deep-Dive ───────────────────────────────────────── */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#26313C]/60 bg-[#0B0F14]/50">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#2AFEB7]">
              Comprehensive Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Engineered For Every Role in Your Restaurant
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-[#9AA6B2]">
              Switch between dedicated, high-speed interfaces built specifically for diners, chefs,
              waiters, cashiers, and restaurant owners.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto no-scrollbar pb-2">
            {modules.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModuleTab(m.id as any)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeModuleTab === m.id
                    ? 'bg-[#2AFEB7] text-[#070A0E] shadow-[0_0_20px_rgba(42,254,183,0.3)]'
                    : 'border border-[#26313C] bg-[#111820] text-[#9AA6B2] hover:text-[#F5F7FA] hover:border-[#2AFEB7]/40'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Active Module Card */}
          <div className="rounded-3xl border border-[#26313C] bg-[#111820] p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-3 py-1 text-[10px] font-extrabold uppercase text-[#2AFEB7]">
                {activeModule.badge}
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                {activeModule.title}
              </h3>

              <p className="text-sm text-[#9AA6B2] leading-relaxed">{activeModule.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeModule.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#F5F7FA]">
                    <span className="text-[#2AFEB7] font-bold">✓</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#2AFEB7] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#070A0E] hover:bg-[#22E5A4] transition-all"
                >
                  Try This Feature →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#26313C] bg-[#0B0F14] p-6 space-y-6 text-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
                  <p className="text-3xl font-black text-[#2AFEB7]">{activeModule.previewStats.metric1}</p>
                  <p className="text-[11px] text-[#9AA6B2] mt-1 font-semibold">
                    {activeModule.previewStats.label1}
                  </p>
                </div>
                <div className="rounded-xl border border-[#26313C] bg-[#111820] p-4">
                  <p className="text-3xl font-black text-[#A855F7]">{activeModule.previewStats.metric2}</p>
                  <p className="text-[11px] text-[#9AA6B2] mt-1 font-semibold">
                    {activeModule.previewStats.label2}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#2AFEB7]/20 bg-[#2AFEB7]/5 p-4 text-xs text-left space-y-2">
                <p className="font-bold text-[#2AFEB7] flex items-center gap-2">
                  <span>⚡</span> Instant Cloud Sync
                </p>
                <p className="text-[11px] text-[#9AA6B2]">
                  Changes made in this module propagate across all floor tablets, kitchen displays, and
                  customer devices in under 100 milliseconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works: 4-Step Process ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#2AFEB7]">
              End-To-End Dining Cycle
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">How Atlas Operates in 4 Steps</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-4 relative">
              <div className="h-10 w-10 rounded-xl bg-[#2AFEB7]/10 border border-[#2AFEB7]/30 flex items-center justify-center font-black text-[#2AFEB7]">
                1
              </div>
              <h3 className="text-base font-extrabold text-white">Scan & Order</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Guest scans the table QR, browses rich categorized menus, customizes variants, and receives
                Token #1.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-4 relative">
              <div className="h-10 w-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center font-black text-[#A855F7]">
                2
              </div>
              <h3 className="text-base font-extrabold text-white">Kitchen Prepares</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Kitchen KDS plays a chime alert. Chefs tap Start Cooking ➔ Mark Ready. Customer phone tracks
                progress.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-4 relative">
              <div className="h-10 w-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center font-black text-[#38BDF8]">
                3
              </div>
              <h3 className="text-base font-extrabold text-white">Serve & Multi-Round</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Waiters serve food with 1 tap. Diners can add extra items (Token #2) or pay at seat via UPI QR.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-4 relative">
              <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center font-black text-[#22C55E]">
                4
              </div>
              <h3 className="text-base font-extrabold text-white">Clear & Auto-Sync</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Cashier/Waiter settles bill. Table clears to Green, ingredients auto-deduct, and revenue logs in
                ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights Grid ───────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#26313C]/60 bg-[#0B0F14]/50">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#2AFEB7]">
              Enterprise Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Built For Uncompromising Reliability</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">📸</div>
              <h3 className="text-base font-bold text-white">Visual Menu Photo Uploads</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Direct drag-and-drop image uploads for dishes, drinks, and custom payment standee QR codes with
                instant base64 previews.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">🛡️</div>
              <h3 className="text-base font-bold text-white">Two-Tier Cancellation Security</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Waiter cancellation requests require Owner/Manager review before orders are cancelled or
                refunded, preventing staff fraud.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">⚡</div>
              <h3 className="text-base font-bold text-white">Strict Ghost-Session Prevention</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Read-only polling ensures tables strictly remain Available (Green) after clearing, even if
                the customer phone remains on the last page.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">🏢</div>
              <h3 className="text-base font-bold text-white">Multi-Branch Architecture</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Manage all your locations, dining rooms, tax rates, and staff permissions under a single unified
                restaurant umbrella.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">📊</div>
              <h3 className="text-base font-bold text-white">Deep Financial Analytics</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                Hourly sales heatmaps, category profit margins, top-selling items, and custom PDF report
                generation.
              </p>
            </div>

            <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 space-y-3 hover:border-[#2AFEB7]/40 transition-all">
              <div className="text-2xl">🖨️</div>
              <h3 className="text-base font-bold text-white">Thermal Receipt Printing</h3>
              <p className="text-xs text-[#9AA6B2] leading-relaxed">
                One-click print receipt formatting for standard 80mm POS thermal printers with table number,
                tax breakdown, and GST details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#2AFEB7]">
              Simple & Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Start Free. Scale As You Grow.</h2>
            <p className="mx-auto max-w-2xl text-sm text-[#9AA6B2]">
              No hidden gateway charges. No locked-in long term contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="rounded-3xl border border-[#26313C] bg-[#111820] p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase text-[#9AA6B2]">Starter / Cafe</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹0</span>
                  <span className="text-xs text-[#9AA6B2]">/ 14-day trial</span>
                </div>
                <p className="text-xs text-[#9AA6B2]">Ideal for single cafes and small dining setups.</p>
                <ul className="space-y-2.5 text-xs text-[#F5F7FA] pt-2">
                  <li className="flex items-center gap-2">✓ Up to 10 Tables</li>
                  <li className="flex items-center gap-2">✓ Digital QR Menu & Dine-In</li>
                  <li className="flex items-center gap-2">✓ 1 Kitchen KDS Screen</li>
                  <li className="flex items-center gap-2">✓ Cashier POS & Billing</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full text-center rounded-xl border border-[#26313C] bg-[#18212B] py-3 text-xs font-bold text-[#F5F7FA] hover:border-[#2AFEB7] hover:text-[#2AFEB7] transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Tier 2 (Featured) */}
            <div className="rounded-3xl border-2 border-[#2AFEB7] bg-[#111820] p-8 space-y-6 flex flex-col justify-between shadow-[0_0_30px_rgba(42,254,183,0.15)] relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2AFEB7] px-3 py-0.5 text-[10px] font-black uppercase text-[#070A0E]">
                Most Popular
              </span>
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase text-[#2AFEB7]">Growth Restaurant</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹1,499</span>
                  <span className="text-xs text-[#9AA6B2]">/ month</span>
                </div>
                <p className="text-xs text-[#9AA6B2]">Complete OS for busy, high-volume dining restaurants.</p>
                <ul className="space-y-2.5 text-xs text-[#F5F7FA] pt-2">
                  <li className="flex items-center gap-2">✓ Unlimited Tables & QR Standees</li>
                  <li className="flex items-center gap-2">✓ Multi-Token Live Tracking</li>
                  <li className="flex items-center gap-2">✓ Unlimited KDS & Waiter Tablets</li>
                  <li className="flex items-center gap-2">✓ Automated Inventory Stock Deduction</li>
                  <li className="flex items-center gap-2">✓ Split Billing & Refund Audit Ledger</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full text-center rounded-xl bg-[#2AFEB7] py-3 text-xs font-black uppercase tracking-wider text-[#070A0E] shadow-lg hover:bg-[#22E5A4] transition-all"
              >
                Get Growth Plan
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="rounded-3xl border border-[#26313C] bg-[#111820] p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase text-[#9AA6B2]">Multi-Branch Enterprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹3,999</span>
                  <span className="text-xs text-[#9AA6B2]">/ month</span>
                </div>
                <p className="text-xs text-[#9AA6B2]">Designed for multi-city restaurant chains & franchises.</p>
                <ul className="space-y-2.5 text-xs text-[#F5F7FA] pt-2">
                  <li className="flex items-center gap-2">✓ Unlimited Branches & Outlets</li>
                  <li className="flex items-center gap-2">✓ AI Predictive Demand Forecasting</li>
                  <li className="flex items-center gap-2">✓ Centralized Multi-Branch Inventory</li>
                  <li className="flex items-center gap-2">✓ Custom Domain & Dedicated SLA Support</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full text-center rounded-xl border border-[#26313C] bg-[#18212B] py-3 text-xs font-bold text-[#F5F7FA] hover:border-[#2AFEB7] hover:text-[#2AFEB7] transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#26313C]/60 bg-[#0B0F14]/50">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#2AFEB7]">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#26313C] bg-[#111820] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-[#F5F7FA] hover:text-[#2AFEB7] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-lg text-[#9AA6B2]">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#9AA6B2] leading-relaxed border-t border-[#26313C]/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final High-Conversion CTA Banner ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#2AFEB7]/40 bg-gradient-to-tr from-[#111820] via-[#18212B] to-[#111820] p-10 sm:p-16 text-center space-y-8 shadow-[0_0_50px_rgba(42,254,183,0.15)]">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Ready to Upgrade Your Restaurant Operations?
            </h2>
            <p className="mx-auto max-w-xl text-sm text-[#9AA6B2]">
              Join hundreds of high-performing dining establishments running with zero downtime, fast table
              turnover, and automated accounting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-xl bg-[#2AFEB7] px-8 py-4 text-sm font-black uppercase tracking-wider text-[#070A0E] shadow-xl hover:bg-[#22E5A4] transition-all hover:scale-105 active:scale-95"
            >
              Get Started Free Today
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl border border-[#26313C] bg-[#111820] px-8 py-4 text-sm font-bold text-[#F5F7FA] hover:text-[#2AFEB7] transition-all"
            >
              Sign In to Existing Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#26313C] bg-[#070A0E] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#9AA6B2]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Atlas Logo" className="h-7 w-auto object-contain" />
            <span className="font-extrabold text-[#F5F7FA]">Project Atlas Restaurant OS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-[#2AFEB7] transition-colors">
              Login
            </Link>
            <Link href="/signup" className="hover:text-[#2AFEB7] transition-colors">
              Register
            </Link>
            <Link href="/docs" className="hover:text-[#2AFEB7] transition-colors">
              Documentation
            </Link>
            <Link href="/support" className="hover:text-[#2AFEB7] transition-colors">
              Support
            </Link>
          </div>

          <p className="text-[11px] text-[#9AA6B2]">
            © {new Date().getFullYear()} Atlas Systems Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
