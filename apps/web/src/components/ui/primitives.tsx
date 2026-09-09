'use client';

import type { ReactNode } from 'react';

/* -------------------------------------------------------------------------
   Card
------------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card ${padded ? 'p-4 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Badge
------------------------------------------------------------------------- */

/**
 * Every tone resolves to a theme token, so a badge stays legible in both
 * modes. `accent` is the brand red — it was named `mint` after a palette that
 * no longer exists.
 */
export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30',
  success: 'bg-atlas-success/15 text-atlas-success border-atlas-success/30',
  warning: 'bg-atlas-warning/15 text-atlas-warning border-atlas-warning/30',
  error: 'bg-atlas-error/15 text-atlas-error border-atlas-error/30',
  info: 'bg-atlas-info/15 text-atlas-info border-atlas-info/30',
  accent: 'bg-primary/15 text-primary border-primary/30',
};

export function Badge({
  tone = 'neutral',
  children,
  withDot = false,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_TONES[tone]} ${className}`}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Skeleton

   Replaces the "Loading…" text placeholders. Laying out a shape close to the
   real content stops the page jumping when data lands.
------------------------------------------------------------------------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`atlas-skeleton rounded-md ${className}`} aria-hidden="true" />;
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Loading placeholder for list/table screens. `role="status"` plus a visually
 * hidden label means assistive tech hears "Loading" instead of nothing.
 *
 * The breakpoint has to match DataTable's: it swaps card list for real table
 * at `md`, so a skeleton that shows a table header from `sm` reserves the
 * wrong layout for 128px of width and the page re-flows when data lands.
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <span className="sr-only">Loading data…</span>

      <div className="hidden border-b border-border bg-secondary px-4 py-4 md:flex md:gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
            {/* Under md the real content is a card with a title and a detail
                line, not four equal columns. */}
            <Skeleton className="h-4 w-1/2 md:hidden" />
            <Skeleton className="h-3 w-full md:hidden" />

            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="hidden h-4 flex-1 md:block" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading placeholder shaped like the app shell — a header bar, the desktop
 * sidebar rail and a content column. Use it for a gate that renders *before*
 * AppShell exists (route guards, entitlement checks), where a bare spinner
 * throws the whole layout away and makes the real chrome arrive as a jump.
 * Inside AppShell, reach for SkeletonTable or PageLoading instead.
 */
export function SkeletonAppShell() {
  return (
    <div role="status" aria-live="polite" className="min-h-[100dvh] bg-background">
      <span className="sr-only">Loading…</span>

      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Skeleton className="h-9 w-9 rounded-lg md:hidden" />
        <Skeleton className="h-7 w-24" />
      </div>

      <div className="flex">
        <div className="hidden w-64 shrink-0 border-r border-border p-4 md:block">
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   EmptyState
------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-8 text-center sm:p-16">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   PageHeader
------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ErrorPanel
------------------------------------------------------------------------- */

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center"
    >
      <p className="text-sm font-medium text-atlas-error">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-all hover:border-primary hover:text-primary"
        >
          Try again
        </button>
      )}
    </div>
  );
}
