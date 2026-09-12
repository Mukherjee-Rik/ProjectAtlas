'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CreditCard,
  Package,
  Lock,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/ui/primitives';

interface SettingsEntry {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
}

const SETTINGS_ENTRIES: SettingsEntry[] = [
  {
    href: '/settings/payments',
    icon: CreditCard,
    title: 'Payment & UPI QR Settings',
    description:
      "Set your UPI ID (GPay / PhonePe / Paytm), merchant name, custom QR standee image, and table payment options.",
    badge: 'Customer Seat Pay',
    featured: true,
  },
  {
    href: '/settings/billing',
    icon: Package,
    title: 'Billing & Plans',
    description:
      'Manage your store license, upgrade tiers, quotas, or cancel recurring subscription.',
  },
  {
    href: '/settings/ai',
    icon: Sparkles,
    title: 'AI & Automations',
    description:
      'Configure assistive AI copilot, prep forecasting opt-out, and model safety controls.',
  },
  {
    href: '/settings/organization',
    icon: Building2,
    title: 'Organization & Tenants',
    description:
      'View active tenant organization, role assignments, and restaurant profile details.',
  },
  {
    href: '/settings/security',
    icon: Lock,
    title: 'Security & Credentials',
    description:
      'Manage password policies, active authentication tokens, and session credentials.',
  },
  {
    href: '/settings/privacy',
    icon: ShieldCheck,
    title: 'Privacy & Data Export',
    description: 'Export personal data, manage Google OAuth permissions, and account erasure.',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your Kafei platform preferences, payments, and security."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_ENTRIES.map(({ href, icon: Icon, title, description, badge, featured }) => (
          <Link
            key={href}
            href={href}
            className={`group flex gap-3.5 rounded-xl border bg-card p-5 transition-colors hover:border-primary ${
              featured ? 'border-primary/40 sm:col-span-2' : 'border-border hover:bg-secondary'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                  {title}
                </span>
                {badge && (
                  <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {badge}
                  </span>
                )}
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                {description}
              </span>
            </span>

            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
