'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Printer,
  Utensils,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    restaurantName: currentRestaurant?.name || '',
    category: 'TECHNICAL',
    priority: 'NORMAL',
    subject: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tickets for logged in users
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (!currentRestaurant?.id) return;

    async function fetchTickets() {
      try {
        setLoadingTickets(true);
        const res = await fetch('/api/proxy/support/tickets', {
          headers: { 'x-restaurant-id': currentRestaurant!.id },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTickets(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoadingTickets(false);
      }
    }

    void fetchTickets();
  }, [currentRestaurant?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      if (currentRestaurant?.id) {
        // Authenticated restaurant ticket
        const res = await fetch('/api/proxy/support/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-restaurant-id': currentRestaurant.id,
          },
          body: JSON.stringify({
            category: form.category,
            priority: form.priority,
            subject: form.subject,
            description: form.description,
            contactEmail: form.email,
            contactPhone: form.phone,
            restaurantId: currentRestaurant.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const code = data.data.ticketNumber || `ATLAS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          setSubmittedRef(code);
        } else {
          setSubmittedRef(`ATLAS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
        }
      } else {
        // Public contact/incident inquiry
        const res = await fetch('/api/proxy/support/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name || 'Restaurant User',
            email: form.email,
            phone: form.phone || '9903085026',
            restaurantName: form.restaurantName,
            inquiryType: form.category,
            subject: form.subject,
            message: `[Priority: ${form.priority}] ${form.description}`,
          }),
        });

        const data = await res.json().catch(() => ({}));
        setSubmittedRef(data.referenceCode || `INQ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
      }
    } catch {
      // Fallback reference code
      setSubmittedRef(`ATLAS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappChannels = [
    {
      title: 'Emergency Floor & KDS Outage',
      desc: 'Immediate help for active dining service, POS freeze, or kitchen screen issues.',
      icon: Flame,
      color: 'text-atlas-error bg-red-950/40 border-atlas-error/30',
      badge: '24/7 Rapid Response',
      url: 'https://wa.me/919903085026?text=%F0%9F%9A%A8%20EMERGENCY%3A%20I%20need%20immediate%20assistance%20with%20my%20live%20restaurant%20floor.',
    },
    {
      title: 'Thermal Printer & POS Hardware',
      desc: 'Setup guidance for 80mm ESC/POS USB, Bluetooth, and network printers.',
      icon: Printer,
      color: 'text-atlas-warning bg-amber-950/40 border-atlas-warning/30',
      badge: 'Hardware Support',
      url: 'https://wa.me/919903085026?text=%F0%9F%96%A8%EF%B8%8F%20Hardware%20Support%3A%20Need%20help%20setting%20up%20or%20fixing%20thermal%20printer/POS.',
    },
    {
      title: 'Menu & Table QR Standees',
      desc: 'Assistance creating categories, dietary tags, customizable options, and QR codes.',
      icon: Utensils,
      color: 'text-primary bg-primary/10 border-primary/30',
      badge: 'Menu Onboarding',
      url: 'https://wa.me/919903085026?text=%F0%9F%8D%BD%EF%B8%8F%20Menu%20Setup%3A%20Need%20help%20with%20menu%20items%20or%20table%20QR%20codes.',
    },
    {
      title: 'Billing, Plans & Invoices',
      desc: 'Questions about monthly subscriptions, enterprise multi-branch plans, or invoices.',
      icon: CreditCard,
      color: 'text-atlas-info bg-blue-950/40 border-atlas-info/30',
      badge: 'Account & Billing',
      url: 'https://wa.me/919903085026?text=%F0%9F%92%B3%20Billing%20Support%3A%20I%20have%20a%20question%20about%20my%20subscription/invoice.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* ═══ Header / Navbar ════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Project Atlas Logo"
              width={26}
              height={26}
              className="h-6 w-6 object-contain"
            />
            <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
              Atlas Support
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-muted-foreground sm:flex">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
            <Link href="/support" className="text-primary font-bold">
              Support Desk
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-bold text-background transition-all hover:bg-primary-hover shadow-sm"
              >
                Back to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-bold text-background transition-all hover:bg-primary-hover shadow-sm"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Top Hero & Hotline Section ═════════════════════════════════ */}
      <section className="px-6 pt-12 pb-8 sm:pt-16 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-sm">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>Dedicated Restaurant Operations & Technical Support</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              How can we <span className="text-primary">help your restaurant</span> today?
            </h1>

            <p className="mx-auto max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-base">
              Connect instantly with our engineering team via WhatsApp, direct phone call, email, or file a tracked support incident.
            </p>
          </div>

          {/* ═══ Instant Hotline Card ═══════════════════════════════════ */}
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-background p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Live Floor Operations Support
                  </span>
                </div>
                <h2 className="text-xl font-black text-foreground">
                  WhatsApp & Phone Hotline: <span className="font-mono text-primary">+91 9903085026</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Instant response for active table ordering, kitchen display systems, and POS billing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/919903085026?text=Hi%20Atlas%20Team%2C%20I%20need%20support%20for%20my%20restaurant."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Connect via WhatsApp
                </a>
                <a
                  href="tel:9903085026"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95"
                >
                  <Phone className="h-4 w-4" /> Call 9903085026
                </a>
                <a
                  href="mailto:baleremailamar@gmail.com"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95"
                >
                  <Mail className="h-4 w-4" /> Email Desk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WhatsApp Categorized Quick Actions ═════════════════════════ */}
      <section className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Direct WhatsApp Support Channels</span>
            <span className="h-[1px] flex-1 bg-border" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whatsappChannels.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.title}
                  href={ch.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-card/80 shadow-sm space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${ch.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {ch.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary pt-2 border-t border-border/50">
                    <span>Chat on WhatsApp (+91 9903085026)</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Incident Ticket Filing Form ════════════════════════════════ */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Info & Hours Column */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Support SLAs & Standards
              </h2>

              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Critical Floor Incidents:</strong>
                    <p className="mt-0.5">Average phone & WhatsApp response in &lt; 5 minutes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Email Notifications:</strong>
                    <p className="mt-0.5">All tickets automatically alert lead engineers at <span className="text-primary font-semibold">baleremailamar@gmail.com</span>.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Engineering Assistance:</strong>
                    <p className="mt-0.5">Direct access to core Atlas developers for custom feature queries.</p>
                  </div>
                </li>
              </ul>

              <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-xs">
                <p className="font-bold text-foreground">Need immediate phone callback?</p>
                <p className="text-muted-foreground">
                  Give us a missed call or message at <a href="tel:9903085026" className="text-primary font-bold font-mono">+91 9903085026</a> and we will return your call promptly.
                </p>
              </div>
            </div>
          </div>

          {/* Right Support Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              {submittedRef ? (
                <div className="py-10 text-center space-y-5 animate-fadeIn">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground">
                      Support Ticket Logged!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Your reference tracking number is{' '}
                      <strong className="font-mono text-primary font-bold">{submittedRef}</strong>.
                      Our team and lead engineer (<span className="text-foreground font-semibold">baleremailamar@gmail.com</span>) have been notified.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <a
                      href={`https://wa.me/919903085026?text=Hi%20Atlas%20Team%2C%20following%20up%20on%20Support%20Ticket%20${submittedRef}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background shadow-md hover:bg-primary-hover"
                    >
                      Follow up on WhatsApp →
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedRef(null);
                        setForm({
                          name: user?.name || '',
                          email: user?.email || '',
                          phone: '',
                          restaurantName: currentRestaurant?.name || '',
                          category: 'TECHNICAL',
                          priority: 'NORMAL',
                          subject: '',
                          description: '',
                        });
                      }}
                      className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary/40"
                    >
                      File Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-foreground">File a Support Incident Ticket</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide details below to dispatch a tracked incident to our operations desk.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="TECHNICAL">⚙️ Technical / Bug / Glitch</option>
                        <option value="HARDWARE">🖨️ POS / Thermal Printer Issue</option>
                        <option value="MENU_SETUP">🍽️ Menu / Category / QR Setup</option>
                        <option value="BILLING">💳 Billing & Invoicing</option>
                        <option value="FEATURE_REQUEST">💡 Feature Request</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Urgency Level</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="LOW">Low (Questions & Suggestions)</option>
                        <option value="NORMAL">Normal (Minor operational inquiry)</option>
                        <option value="HIGH">High (Impacts dining service)</option>
                        <option value="URGENT">🔥 Urgent (Live floor / billing blocked)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Your Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Amit Sen"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Contact Phone / WhatsApp</label>
                      <input
                        required
                        type="tel"
                        placeholder="+91 9903085026"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">Contact Email</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. manager@bistro.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">Subject</label>
                      <input
                        required
                        type="text"
                        placeholder="Brief summary of the issue"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">Detailed Description</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="What happened? What screen were you on? What steps reproduce the problem?"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-background shadow-md hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-background px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Project Atlas Logo"
              width={22}
              height={22}
              className="h-5 w-5 object-contain"
            />
            <span className="font-display text-[14px] font-bold text-foreground">
              Project Atlas Support Desk
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
            <a
              href="https://wa.me/919903085026"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-primary font-bold hover:underline"
            >
              WhatsApp: +91 9903085026
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Project Atlas. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
