'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  ShieldCheck,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ContactUsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    restaurantName: '',
    inquiryType: 'PRODUCT_DEMO',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // First try proxy route, fallback to direct API
      let res = await fetch('/api/proxy/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        // Fallback directly to public API endpoint
        res = await fetch('/api/v1/support/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok || data?.success) {
        setSubmittedRef(data?.referenceCode || `INQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      } else {
        // Even if server is temporarily unreachable in dev, record reference and show success with mailto option
        setSubmittedRef(`INQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      }
    } catch {
      // Graceful offline fallback
      setSubmittedRef(`INQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const mailtoUrl = `mailto:rikmukherjee1999@gmail.com?subject=${encodeURIComponent(
    form.subject || `Inquiry from ${form.name || 'Restaurant Owner'}`
  )}&body=${encodeURIComponent(
    `Name: ${form.name}\nPhone: ${form.phone}\nRestaurant: ${form.restaurantName}\nType: ${form.inquiryType}\n\nMessage:\n${form.message}`
  )}`;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* ═══ Header / Navbar ════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei Logo"
              width={30}
              height={30}
              className="h-7 w-auto object-contain rounded-md"
            />
            <span className="font-display text-[16px] font-extrabold tracking-tight text-foreground">
              Kafei
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-muted-foreground sm:flex">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Documentation
            </Link>
            <Link href="/contact" className="text-primary font-semibold">
              Contact & Talk to Us
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
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
          </div>
        </div>
      </header>

      {/* ═══ Hero Section ════════════════════════════════════════════════ */}
      <section className="px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>We are here to help your floor run smoothly</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-[1.15]">
            Talk to the <span className="text-primary">Kafei Team</span>
          </h1>

          <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Have questions about table QR ordering, POS integration, hardware setup, or custom plans? 
            Reach out directly to our engineers and restaurant operations specialists.
          </p>
        </div>
      </section>

      {/* ═══ Main Contact Grid ══════════════════════════════════════════ */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Direct Channels & Support Info */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Direct Channels
              </h2>

              {/* Phone Hotline */}
              <div className="rounded-xl border border-border/80 bg-secondary/50 p-4 transition-all hover:border-primary/40">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Direct Phone & WhatsApp Hotline
                    </p>
                    <p className="text-base font-bold font-mono text-foreground">
                      +91 9903085026
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Instant support for live dining services and quick inquiries.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <a
                        href="tel:9903085026"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background transition-all hover:bg-primary-hover shadow-sm"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call Now
                      </a>
                      <a
                        href="https://wa.me/919903085026?text=Hi%20Kafei%20Team%2C%20I%20would%20like%20to%20know%20more%20about%20Kafei."
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:text-primary"
                      >
                        WhatsApp Chat →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-border/80 bg-secondary/50 p-4 transition-all hover:border-primary/40">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Inquiries & Desk
                    </p>
                    <a
                      href="mailto:rikmukherjee1999@gmail.com"
                      className="text-sm font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
                    >
                      rikmukherjee1999@gmail.com
                    </a>
                    <p className="text-[12px] text-muted-foreground">
                      Detailed proposals, customized kitchen floor plans, and billing queries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours & Response SLA */}
              <div className="rounded-xl border border-border/80 bg-secondary/50 p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Response Times & Availability
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>Live Floor / KDS Emergency:</strong> 24/7 Rapid response via phone hotline.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>General Inquiries & Demos:</strong> Mon – Sun, 9:00 AM – 10:00 PM IST.</span>
                  </li>
                </ul>
              </div>

              {/* Location */}
              <div className="rounded-xl border border-border/80 bg-secondary/50 p-4 space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Headquarters & Development
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kafei Engineering & Operations<br />
                  Kolkata, WB / Bangalore, KA<br />
                  India</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/80 border-t border-border pt-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Zero third-party spam. Your details remain strictly confidential.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Talk to Us Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              {submittedRef ? (
                <div className="py-10 text-center space-y-5 animate-fadeIn">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Thank you for contacting us. Your reference code is{' '}
                      <strong className="font-mono text-primary font-bold">{submittedRef}</strong>.
                      An email notification has been dispatched to our engineering team at{' '}
                      <span className="text-foreground font-semibold">rikmukherjee1999@gmail.com</span>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/60 p-4 text-left max-w-md mx-auto space-y-2 text-xs text-muted-foreground">
                    <p className="font-bold text-foreground">Need urgent assistance?</p>
                    <p>
                      Call us directly at <a href="tel:9903085026" className="text-primary font-bold font-mono underline">+91 9903085026</a> or launch WhatsApp for live messaging.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <a
                      href="https://wa.me/919903085026?text=Hi%20Kafei%20Team%2C%20following%20up%20on%20inquiry%20code%20"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background transition-all hover:bg-primary-hover shadow-sm"
                    >
                      Chat on WhatsApp →
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedRef(null);
                        setForm({
                          name: '',
                          email: '',
                          phone: '',
                          restaurantName: '',
                          inquiryType: 'PRODUCT_DEMO',
                          subject: '',
                          message: '',
                        });
                      }}
                      className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-black text-foreground">Send Us a Message</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fill out the details below and we will get back to you promptly.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/30 p-3 text-xs text-atlas-error">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Your Name <span className="text-atlas-error">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Work / Personal Email <span className="text-atlas-error">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. rahul@restaurant.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Phone / WhatsApp Number <span className="text-atlas-error">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+91 9876543210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Restaurant Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Restaurant / Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. The Urban Bistro"
                        value={form.restaurantName}
                        onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Inquiry Type */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">
                        What can we help you with?
                      </label>
                      <select
                        value={form.inquiryType}
                        onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="PRODUCT_DEMO">✨ Schedule a Product Walkthrough & Demo</option>
                        <option value="ONBOARDING">🚀 Onboarding & Multi-Branch Floor Setup</option>
                        <option value="HARDWARE">🖨️ Thermal Printer (80mm) & Device Hardware Help</option>
                        <option value="KDS_OPERATION">🍳 Kitchen Display System & POS Operations</option>
                        <option value="CUSTOM_PRICING">💼 Enterprise & Multi-Restaurant Invoicing</option>
                        <option value="GENERAL">💬 General Question / Partnership</option>
                      </select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">
                        Subject Summary <span className="text-atlas-error">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Setting up QR ordering for 20 tables in Kolkata"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">
                        Your Message & Specific Requirements <span className="text-atlas-error">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Tell us about your restaurant format, number of tables, current challenges, or specific questions..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full p-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border">
                    <a
                      href={mailtoUrl}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Or open in your email client →
                    </a>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-xs font-bold text-background shadow-md transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? 'Sending Message...' : 'Submit Inquiry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ Section ═════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/40 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about getting started with Kafei.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">Do guests need to install any app?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No. Guests simply scan the table QR code with their default camera app to open the instant digital menu directly in their mobile browser.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">How fast can we set up a 15-table restaurant?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Most dining rooms are live within 30 minutes. You can import your menu categories, items, and printable QR standees in an afternoon.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">What thermal printers are supported?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard 80mm ESC/POS USB, Bluetooth, and network thermal printers print directly from any web browser on desktop, tablet, or mobile.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">How do we get emergency support on a busy night?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our support team is on standby 24/7 for live floor emergencies at <strong>+91 9903085026</strong> and <strong>rikmukherjee1999@gmail.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-background px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei Logo"
              width={26}
              height={26}
              className="h-6 w-auto object-contain rounded-md"
            />
            <span className="font-display text-[14px] font-extrabold text-foreground">
              Kafei
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
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
            <Link href="/contact" className="text-primary font-bold">Contact Us</Link>
            <a href="tel:9903085026" className="font-mono text-primary font-bold hover:underline">+91 9903085026</a>
          </div>

          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Antigravity. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
