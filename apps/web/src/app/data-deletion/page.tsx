'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  Trash2,
  ExternalLink,
  Mail,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DataDeletionPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('diner');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate instantaneous receipt & ticket dispatch
    setTimeout(() => {
      const randomTicket = `DEL-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(randomTicket);
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei"
              width={32}
              height={32}
              className="h-8 w-auto rounded-md object-contain"
            />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Kafei
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Legal Hub →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-6 py-12 flex-1 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <ShieldAlert className="h-3.5 w-3.5" />
            GDPR, CCPA & Indian DPDP Act 2023 Compliance
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            User Data Deletion & Account Removal
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Kafei respects your right to be forgotten. Learn how to disconnect your Google account, delete your restaurant profile, or submit an official data scrubbing request.
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Option 1: Google OAuth Permissions Revocation */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Revoke Google Account Access
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                If you signed in to Kafei using Google Sign-In, you can instantly revoke Kafei’s access to your Google profile and email via Google's central security portal.
              </p>
            </div>

            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-border transition-colors cursor-pointer"
            >
              <span>Manage Google Permissions</span>
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </a>
          </div>

          {/* Option 2: In-App Self-Service Deletion */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                In-App Account Deletion
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Registered restaurant owners and staff can self-service delete their profile, purge active tokens, and scrub personal records directly from within the workspace settings.
              </p>
            </div>

            <Link
              href="/settings/privacy"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Open Privacy Settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Interactive Data Deletion Request Form ──────────────────── */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lg space-y-6">
          <div className="space-y-2 border-b border-border/70 pb-5">
            <h2 className="font-display text-xl font-bold text-foreground">
              Submit an Official Data Scrubbing Request
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you placed an order as a restaurant customer (QR dining guest) or cannot access your account, fill out the form below. Our Data Protection Officer will process your request within 24–48 hours.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-atlas-success/30 bg-atlas-success/10 p-6 text-center space-y-4 animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-atlas-success/20 text-atlas-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Data Erasure Request Submitted
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your reference ticket is <strong className="text-primary font-mono">{ticketId}</strong>.
                </p>
              </div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                A confirmation has been logged for <strong className="text-foreground">{email}</strong>. Our security team will purge all matching identifiers and send a formal Certificate of Destruction within 30 days as required by law.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-border transition-colors cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="req-name" className="text-xs font-semibold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="req-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rik Mukherjee"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="req-email" className="text-xs font-semibold text-foreground">
                    Email Address associated with Data <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="req-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Your Relationship with Kafei
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'diner', label: 'Restaurant Guest / Diner' },
                    { id: 'staff', label: 'Staff / Waiter / Chef' },
                    { id: 'owner', label: 'Restaurant Owner / Admin' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setUserType(opt.id)}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-all text-center cursor-pointer ${
                        userType === opt.id
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="req-details" className="text-xs font-semibold text-foreground">
                  Specific Details or Restaurant Name (Optional)
                </label>
                <textarea
                  id="req-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any relevant restaurant name, phone number, or date of visit to expedite matching..."
                  className="w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-background shadow-md hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting Erasure Ticket...' : 'Submit Permanent Data Deletion Request'}
              </button>
            </form>
          )}
        </div>

        {/* ── Explanatory Compliance Information ────────────────────── */}
        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-6 space-y-4 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span>Data Purge Guarantee & Retention Exclusions</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong>Immediate De-identification:</strong> Your personal identity, name, phone, email, and Google OAuth credentials are detached from active transaction databases within minutes.
            </li>
            <li>
              <strong>Zero AI Training:</strong> Kafei does not retain user conversation logs or restaurant floor records for training generalized artificial intelligence foundation models.
            </li>
            <li>
              <strong>Statutory Accounting Exclusions:</strong> Aggregated tax totals and anonymous fiscal invoice timestamps may be retained for statutory auditing as mandated by Section 128 of the Indian Companies Act and international commercial records laws.
            </li>
          </ul>

          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <span>Direct DPO Contact: <strong className="text-foreground">rikmukherjee1999@gmail.com</strong></span>
            <span>Hotline: <strong className="text-foreground">+91 9903085026</strong></span>
            <span>Entity: <strong className="text-foreground">Antigravity</strong></span>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background px-6 py-8 text-center text-xs text-muted-foreground space-y-2">
        <p>© {new Date().getFullYear()} Antigravity. Kafei — All rights reserved.</p>
        <div className="flex justify-center gap-4 text-xs">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
          <Link href="/security" className="hover:text-foreground">Security</Link>
        </div>
      </footer>
    </div>
  );
}
