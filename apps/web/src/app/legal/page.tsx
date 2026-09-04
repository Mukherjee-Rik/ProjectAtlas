import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LegalFooter } from '@/components/legal/LegalPageShell';
import { LEGAL_DOCS, LEGAL_ENTITY } from '@/lib/legal-docs-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal & Trust Center | Kafei',
  description:
    'Every Kafei policy in one place: privacy, terms, acceptable use, cookies, data processing, sub-processors, security, AI usage, refunds and DMCA.',
  alternates: { canonical: '/legal' },
};

const GROUPS: Array<{ key: 'terms' | 'privacy' | 'trust'; label: string; blurb: string }> = [
  {
    key: 'terms',
    label: 'Using Kafei',
    blurb: 'The agreement between you and us, and the rules for the platform.',
  },
  {
    key: 'privacy',
    label: 'Your data',
    blurb: 'What we hold, who touches it, and how to get it back or deleted.',
  },
  {
    key: 'trust',
    label: 'How we operate',
    blurb: 'Security practices, AI behaviour, and intellectual property.',
  },
];

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-6 w-auto rounded-md object-contain"
            />
            <span className="font-display text-[15px] font-extrabold tracking-tight text-foreground">
              Kafei
            </span>
            <span className="hidden text-[13px] text-muted-foreground sm:inline">Legal</span>
          </Link>

          <nav className="flex items-center gap-1 text-[13px]">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="ml-1 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              Sign in
            </Link>
            <span className="ml-1">
              <ThemeToggle />
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <section className="border-b border-border py-14 sm:py-16">
          <h1 className="max-w-[20ch] text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Legal &amp; Trust Center
          </h1>
          <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            Every policy governing {LEGAL_ENTITY.product}, written to be read rather than
            skimmed past. If something here is unclear or you need a signed copy for
            procurement, email{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.legalEmail}`}
              className="text-primary underline underline-offset-[3px]"
            >
              {LEGAL_ENTITY.legalEmail}
            </a>
            .
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {LEGAL_ENTITY.name} · {LEGAL_ENTITY.jurisdiction} · Effective{' '}
            {LEGAL_ENTITY.effectiveDate}
          </p>
        </section>

        {/* ── Policy groups ─────────────────────────────────────────────── */}
        {GROUPS.map((group) => (
          <section key={group.key} className="border-b border-border py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-3">
                <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                  {group.label}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {group.blurb}
                </p>
              </div>

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-9">
                {LEGAL_DOCS.filter((d) => d.group === group.key).map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <li key={doc.href}>
                      <Link
                        href={doc.href}
                        className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Icon className="h-4 w-4 shrink-0 text-primary" />
                          {doc.badge && (
                            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {doc.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-[14px] font-semibold text-foreground">
                          {doc.title}
                        </h3>
                        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                          {doc.shortDesc}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          Read
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}

        {/* ── Google Limited Use ────────────────────────────────────────── */}
        <section className="py-12">
          <div className="rounded-xl border border-primary/25 bg-primary/[0.07] p-6 sm:p-8">
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Google API Services — Limited Use disclosure
            </p>
            <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-foreground">
              Kafei&apos;s use and transfer of information received from Google APIs to any
              other app will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-[3px]"
              >
                Google API Services User Data Policy
                <ExternalLink className="h-3 w-3" />
              </a>
              , including the Limited Use requirements.
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-primary/20 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Never sold', 'We do not sell, rent or broker Google user data.'],
                ['No advertising', 'It is never shared with ad networks or data brokers.'],
                ['No model training', 'It never trains generalized or foundation AI models.'],
                ['Revoke any time', 'Disconnect in Kafei, or from your Google account.'],
              ].map(([term, def]) => (
                <div key={term}>
                  <dt className="font-semibold text-foreground">{term}</dt>
                  <dd className="mt-1 leading-relaxed text-muted-foreground">{def}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">
              Scopes requested: <code className="font-mono text-foreground">openid</code>,{' '}
              <code className="font-mono text-foreground">email</code>,{' '}
              <code className="font-mono text-foreground">profile</code> — nothing else.
              Full detail in the{' '}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-[3px]"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </div>

      <LegalFooter />
    </div>
  );
}
