'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Check,
  ChevronRight,
  Copy,
  ListFilter,
  Mail,
  Phone,
  Printer,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LEGAL_DOCS, LEGAL_ENTITY, type LegalNavDoc } from '@/lib/legal-docs-data';

export { LEGAL_DOCS, type LegalNavDoc };

/**
 * Typography for the policy body. The pages are plain semantic HTML, so all
 * rhythm lives here — that way every document reads identically and a page
 * author never hand-rolls a className on a <ul> again.
 *
 * The reading measure is applied to the top-level text elements rather than to
 * the container: a paragraph needs to stop at ~68 characters, but the tables,
 * callout grids and controller rows a policy drops in between them are content
 * that wants the whole card — clamping the container made the sub-processor
 * table scroll sideways inside a 520px box on a 1920px display.
 */
const PROSE = [
  'text-[13.5px] sm:text-sm leading-[1.75] text-muted-foreground',
  '[&>p]:max-w-[68ch] [&>ul]:max-w-[68ch] [&>ol]:max-w-[68ch]',
  '[&>h2]:max-w-[68ch] [&>h3]:max-w-[68ch] [&>blockquote]:max-w-[68ch]',
  '[&>*+*]:mt-4',
  '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground',
  '[&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:scroll-mt-24',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-foreground',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2',
  '[&_li]:pl-1 [&_li]:marker:text-border',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:decoration-primary/40 hover:[&_a]:decoration-primary',
  '[&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5',
  '[&_code]:font-mono [&_code]:text-[11px] [&_code]:text-foreground [&_code]:before:content-none [&_code]:after:content-none',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:bg-secondary/50',
  '[&_blockquote]:rounded-r-lg [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-foreground',
].join(' ');

export interface PublicHeaderLink {
  href: string;
  label: string;
  /** Marks the route the visitor is already on. */
  current?: boolean;
}

/**
 * The one header every public route wears.
 *
 * Each of the public pages used to hand-roll its own bar, which is how the site
 * ended up with five different heights, paddings and logo sizes — and with rows
 * that overflowed a 320px viewport, because `pointer: coarse` widens the theme
 * toggle to 44px and nothing was allowed to shrink. Secondary links are gated at
 * `sm` for that reason: below it, only the wordmark, one action and the toggle
 * are guaranteed to fit.
 */
export function PublicHeader({
  label,
  links = [],
  action,
}: {
  label?: string;
  links?: PublicHeaderLink[];
  /** Replaces the default "Sign in" pill, e.g. with a dashboard link. */
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-6 w-auto shrink-0 rounded-md object-contain"
          />
          <span className="shrink-0 font-display text-[15px] font-extrabold tracking-tight text-foreground">
            Kafei
          </span>
          {label && (
            <span className="hidden truncate text-[13px] text-muted-foreground sm:inline">
              {label}
            </span>
          )}
        </Link>

        <nav className="flex shrink-0 items-center gap-1 text-[13px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.current ? 'page' : undefined}
              className={`hidden rounded-lg px-2.5 py-1.5 font-medium transition-colors sm:inline-block ${
                link.current
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {action ?? (
            <Link
              href="/login"
              className="ml-1 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              Sign in
            </Link>
          )}
          <span className="ml-1">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}

interface LegalPageShellProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  badge?: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated = LEGAL_ENTITY.effectiveDate,
  badge,
  children,
}: LegalPageShellProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL bar still works */
    }
  };

  const index = (
    <nav className="space-y-0.5">
      {LEGAL_DOCS.map((doc) => {
        const isActive = pathname === doc.href;
        const Icon = doc.icon;
        return (
          <Link
            key={doc.href}
            href={doc.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors ${
              isActive
                ? 'bg-secondary font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`}
            />
            <span className="truncate">{doc.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <PublicHeader
        label="Legal"
        links={[
          { href: '/legal', label: 'All policies' },
          { href: '/contact', label: 'Contact' },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground print:hidden"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-border" />
          <Link href="/legal" className="transition-colors hover:text-foreground">
            Legal
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-border" />
          <span className="truncate font-medium text-foreground">{title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ── Document index ────────────────────────────────────────── */}
          <aside className="lg:col-span-3 print:hidden">
            {/* Mobile: collapsed by default so the policy stays above the fold */}
            <details className="rounded-xl border border-border bg-card lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                  All policies
                </span>
                <span className="font-mono text-[11px] font-normal text-muted-foreground">
                  {LEGAL_DOCS.length}
                </span>
              </summary>
              <div className="border-t border-border p-2">{index}</div>
            </details>

            <div className="sticky top-20 hidden lg:block">
              <p className="px-2.5 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Policies
              </p>
              {index}
            </div>
          </aside>

          {/* ── Document ──────────────────────────────────────────────── */}
          <main className="lg:col-span-9">
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9 print:border-0 print:p-0 print:shadow-none">
              <header className="border-b border-border pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2.5">
                    {badge && (
                      <span className="inline-block rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {badge}
                      </span>
                    )}
                    <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
                      {title}
                    </h1>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 print:hidden">
                    <button
                      type="button"
                      onClick={copyLink}
                      title="Copy link to this policy"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="sr-only">Copy link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="Print or save as PDF"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="sr-only">Print</span>
                    </button>
                  </div>
                </div>

                {subtitle && (
                  <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-4">
                  {[
                    ['Effective', lastUpdated],
                    ['Entity', LEGAL_ENTITY.name],
                    ['Jurisdiction', LEGAL_ENTITY.jurisdiction],
                    ['Applies to', LEGAL_ENTITY.domain],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </header>

              <div className={`mt-8 ${PROSE}`}>{children}</div>

              {/* ── Contact ─────────────────────────────────────────── */}
              <div className="mt-12 rounded-xl border border-border bg-secondary/40 p-5">
                <h2 className="text-[13px] font-bold text-foreground">
                  Questions about this policy?
                </h2>
                <p className="mt-1.5 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">
                  Write to us for data subject requests, deletion requests, security
                  reports, or compliance reviews. We respond within 5 business days.
                </p>
                <div className="mt-4 flex flex-col gap-2.5 text-xs sm:flex-row sm:gap-6">
                  <a
                    href={`mailto:${LEGAL_ENTITY.privacyEmail}`}
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {LEGAL_ENTITY.privacyEmail}
                  </a>
                  <a
                    href={`tel:${LEGAL_ENTITY.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {LEGAL_ENTITY.phone}
                  </a>
                </div>
                <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {LEGAL_ENTITY.name}, {LEGAL_ENTITY.address}
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}

/**
 * Shared across every public route so no page is a dead end — /docs and
 * /sitemap previously shipped no footer at all.
 */
export function LegalFooter() {
  const columns: Array<[string, LegalNavDoc[]]> = [
    ['Terms', LEGAL_DOCS.filter((d) => d.group === 'terms')],
    ['Privacy & data', LEGAL_DOCS.filter((d) => d.group === 'privacy')],
    ['Trust', LEGAL_DOCS.filter((d) => d.group === 'trust')],
  ];

  return (
    <footer className="mt-16 border-t border-border print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map(([heading, docs]) => (
            <div key={heading}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {heading}
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                {docs.map((doc) => (
                  <li key={doc.href}>
                    <Link
                      href={doc.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contact
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/data-deletion"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Data Deletion
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('kafei:open-cookie-preferences'));
                    }
                  }}
                  className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer text-left"
                >
                  Cookie Preferences
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_ENTITY.legalEmail}`}
                  className="text-muted-foreground transition-colors break-all hover:text-foreground"
                >
                  {LEGAL_ENTITY.legalEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {LEGAL_ENTITY.name}. All rights reserved (Copyright Claim from 03-09-2026).
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/data-deletion" className="hover:text-foreground transition-colors">Data Deletion</Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              ← Back to {LEGAL_ENTITY.domain}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Alias so a non-legal public page (docs, support, sitemap) can adopt the same
 * footer without the import reading as if the page were a policy document.
 */
export const PublicFooter = LegalFooter;
