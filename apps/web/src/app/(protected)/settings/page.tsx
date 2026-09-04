'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your Kafei platform preferences, payments, and security.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Payment & UPI QR Settings */}
        <Link
          href="/settings/payments"
          className="group block rounded-xl border border-primary/40 bg-gradient-to-br from-secondary to-card p-6 transition-all hover:border-primary sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-xl">
                💳
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                    Payment & UPI QR Settings
                  </h2>
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Customer Seat Pay
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Set your UPI ID (GPay / PhonePe / Paytm), merchant name, custom QR standee image, and table payment options.
                </p>
              </div>
            </div>
            <span className="text-lg font-bold text-primary group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Billing & Subscription Plans */}
        <Link
          href="/settings/billing"
          className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-secondary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              📦 Billing & Plans
            </h2>
            <span className="text-primary">→</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Manage your store license, upgrade tiers, quotas, or cancel recurring subscription.
          </p>
        </Link>

        {/* AI & Automation Governance */}
        <Link
          href="/settings/ai"
          className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-secondary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              ✨ AI & Automations
            </h2>
            <span className="text-primary">→</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Configure assistive AI copilot, prep forecasting opt-out, and model safety controls.
          </p>
        </Link>

        {/* Organization */}
        <Link
          href="/settings/organization"
          className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-secondary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              🏢 Organization & Tenants
            </h2>
            <span className="text-primary">→</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            View active tenant organization, role assignments, and restaurant profile details.
          </p>
        </Link>

        {/* Security & Sessions */}
        <Link
          href="/settings/security"
          className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-secondary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              🔒 Security & Credentials
            </h2>
            <span className="text-primary">→</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Manage password policies, active authentication tokens, and session credentials.
          </p>
        </Link>

        {/* Privacy & Data Management */}
        <Link
          href="/settings/privacy"
          className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-secondary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              🛡️ Privacy & Data Export
            </h2>
            <span className="text-primary">→</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Export personal data, manage Google OAuth permissions, and account erasure.
          </p>
        </Link>
      </div>
    </div>
  );
}
