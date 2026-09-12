'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * The seven settings screens used to each invent their own chrome — two of
 * them had no way back to the hub at all, which on a phone (where the sidebar
 * sits behind the hamburger) left the section a dead end. One strip here
 * replaces the three ad-hoc back links and gives every sub-page the same
 * measure.
 */
const SETTINGS_SECTIONS = [
  { href: '/settings', label: 'Overview' },
  { href: '/settings/payments', label: 'Payments' },
  { href: '/settings/billing', label: 'Billing' },
  { href: '/settings/ai', label: 'AI' },
  { href: '/settings/organization', label: 'Organization' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/privacy', label: 'Privacy' },
] as const;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* The strip scrolls rather than wraps: seven labels are ~520px of
          min-content, which would otherwise be three ragged rows at 320px. */}
      <nav
        aria-label="Settings sections"
        className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]"
      >
        <ul className="flex min-w-max items-center gap-1.5">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = pathname === section.href;

            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg border px-3.5 text-xs font-semibold transition-colors sm:min-h-10 ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </div>
  );
}
