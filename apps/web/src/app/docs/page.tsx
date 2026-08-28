'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const DOC_SECTIONS = [
  {
    id: 'owner',
    title: 'Restaurant Owner Guide',
    icon: '👑',
    badge: 'Operations & Growth',
    articles: [
      {
        title: '1. Fast Onboarding & Restaurant Setup',
        desc: 'Set up your restaurant concept, primary branch location, floor dining areas, and currency.',
        content: `• Access the guided onboarding wizard at /onboarding.
• Define your operational currency (default INR ₹).
• Configure branch addresses and contact information for digital invoices.`,
      },
      {
        title: '2. Table QR Codes & Digital Guest Ordering',
        desc: 'Deploy encrypted table QR codes for instant guest ordering without physical menus.',
        content: `• Generate table QR codes under Tables > QR Codes.
• Download SVG vectors for clean printing on table stands or stickers.
• Guests scan QR -> browse live menu -> add items to cart -> submit order without app downloads.`,
      },
      {
        title: '3. Automation Engine & Proactive Alerts',
        desc: 'Set up automated rules for nightly revenue summaries, stock warnings, and cancellation alerts.',
        content: `• Navigate to Automations in your dashboard.
• Choose from preset templates: Nightly Sales Report, Low Stock Warning, AI Growth Insights.
• Atlas monitors real-time restaurant events and dispatches notifications automatically.`,
      },
      {
        title: '4. AI Restaurant Copilot & Natural Language Queries',
        desc: 'Interact with your real-time restaurant database through natural conversation.',
        content: `• Open the AI Copilot tab in your command center.
• Ask questions like: "What was our highest selling dish today?", "Which hours were busiest?", or "What is our average order value?"
• AI context aggregates orders, stock levels, and revenue instantly.`,
      },
    ],
  },
  {
    id: 'staff',
    title: 'Kitchen & Floor Staff Guide',
    icon: '🍳',
    badge: 'Floor & KDS Workflow',
    articles: [
      {
        title: '1. Kitchen Display System (KDS)',
        desc: 'Live order ticket management for chefs and kitchen expeditors.',
        content: `• Access the Kitchen screen at /kitchen.
• New orders appear in real-time under PENDING with dish notes and modifications.
• Click "Start Cooking" to transition ticket to PREPARING.
• Click "Ready for Pickup" to notify floor staff that food is hot and plated.`,
      },
      {
        title: '2. Waiter & Table Order Assistance',
        desc: 'Mobile floor terminal for table assistance and order tracking.',
        content: `• Waitstaff view active tables at /waiter.
• Deliver prepared dishes and mark tickets as SERVED.
• Respond to live Table Calls (Water, Waiter, Check Requests) directly on mobile devices.`,
      },
      {
        title: '3. Cashier & Settlement Desk',
        desc: 'Finalize customer invoices, process card/cash/UPI settlements, and close sessions.',
        content: `• Open Cashier terminal at /cashier.
• Match bill total with table items and apply applicable CGST/SGST taxes.
• Select Payment Method (Cash, Card POS, Dynamic UPI) to mark order COMPLETED.`,
      },
    ],
  },
  {
    id: 'admin',
    title: 'Platform Operator & Runbook',
    icon: '🛡️',
    badge: 'Infrastructure & SLA',
    articles: [
      {
        title: '1. Multi-Tenant Security & Tenant Isolation',
        desc: 'How Atlas guarantees strict tenant boundary enforcement.',
        content: `• Every request is guarded by TenantAccessGuard, RestaurantAccessGuard, and BranchAccessGuard.
• Cross-tenant querying is blocked with strict HTTP 403 Forbidden.
• JWT access tokens carry user roles and session identifiers with automatic rotation.`,
      },
      {
        title: '2. Observability, Latency & Health Probes',
        desc: 'Real-time infrastructure health and latency monitoring.',
        content: `• GET /health/live: Quick liveness probe.
• GET /health/ready: Deep readiness probe checking PostgreSQL ping and memory headroom.
• Telemetry records P50, P95, P99 latency percentiles and throughput req/min.`,
      },
      {
        title: '3. Automated Disaster Recovery & Backups',
        desc: 'Disaster recovery execution and database snapshot drills.',
        content: `• Run automated backups with: pnpm db:backup.
• Backups snapshot 13 core relational entities and verify foreign key consistency.
• In case of disaster, restore data into PostgreSQL without schema corruption.`,
      },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('owner');
  const [search, setSearch] = useState('');

  const currentSectionData = DOC_SECTIONS.find((s) => s.id === activeSection) || DOC_SECTIONS[0];

  const filteredArticles = currentSectionData.articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
              📖 Project Atlas v1 Documentation
            </div>
            <h1 className="text-3xl font-black text-foreground">Knowledge Base & User Manual</h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive operational playbooks for Restaurant Owners, Floor Staff, and Platform Operators.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-border bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Back to Dashboard
              </button>
            </Link>
            <Link href="/support">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-primary text-background text-xs font-black hover:bg-primary"
              >
                🆘 Support Desk
              </button>
            </Link>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DOC_SECTIONS.map((sec) => {
            const isSelected = sec.id === activeSection;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-primary/10'
                    : 'bg-card border-border hover:border-input'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-background border border-border text-xl">
                    {sec.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-primary">
                    {sec.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{sec.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {sec.id === 'owner' && 'Setup, Menu, QRs, AI & Analytics'}
                  {sec.id === 'staff' && 'Kitchen KDS, Waiter & POS Settlement'}
                  {sec.id === 'admin' && 'Multi-Tenancy, Runbooks & Recovery'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides, operations, and technical workflows..."
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl text-center py-12 px-4 space-y-2">
              <div className="text-3xl mb-1">📄</div>
              <p className="text-xs text-muted-foreground">No articles matching your search.</p>
            </div>
          ) : (
            filteredArticles.map((art, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{art.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{art.desc}</p>
                </div>
                <pre className="p-4 rounded-xl bg-background border border-border text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {art.content}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
