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
      className={`rounded-xl border border-[#26313C] bg-[#111820] shadow-xl ${padded ? 'p-4 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Badge
------------------------------------------------------------------------- */

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'mint'
  | 'purple';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[#9AA6B2]/15 text-[#9AA6B2] border-[#9AA6B2]/30',
  success: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
  warning: 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30',
  error: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
  info: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
  mint: 'bg-[#2AFEB7]/15 text-[#2AFEB7] border-[#2AFEB7]/30',
  purple: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30',
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
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl"
    >
      <span className="sr-only">Loading data…</span>

      <div className="hidden border-b border-[#26313C] bg-[#18212B] px-4 py-4 sm:flex sm:gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>

      <div className="divide-y divide-[#26313C]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
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
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center sm:p-16">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-[#2AFEB7]">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold text-[#F5F7FA]">{title}</h2>
      {description && <p className="max-w-md text-sm text-[#9AA6B2]">{description}</p>}
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
        <h1 className="text-2xl font-bold text-[#F5F7FA] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-[#9AA6B2]">{description}</p>}
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
      className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center"
    >
      <p className="text-sm font-medium text-[#EF4444]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA] transition-all hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
