'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Settings
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Manage your Atlas platform preferences, payments, and security.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Payment & UPI QR Settings */}
        <Link
          href="/settings/payments"
          className="group block rounded-xl border border-[#2AFEB7]/40 bg-gradient-to-br from-[#18212B] to-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7] hover:shadow-[0_0_20px_rgba(42,254,183,0.15)] sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2AFEB7]/15 text-xl">
                💳
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#F5F7FA] group-hover:text-[#2AFEB7] transition-colors">
                    Payment & UPI QR Settings
                  </h2>
                  <span className="rounded-full bg-[#2AFEB7]/15 border border-[#2AFEB7]/30 px-2 py-0.5 text-[10px] font-bold text-[#2AFEB7]">
                    Customer Seat Pay
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#9AA6B2]">
                  Set your UPI ID (GPay / PhonePe / Paytm), merchant name, custom QR standee image, and table payment options.
                </p>
              </div>
            </div>
            <span className="text-lg font-bold text-[#2AFEB7] group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Organization */}
        <Link
          href="/settings/organization"
          className="block rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7] hover:bg-[#18212B]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F5F7FA]">
              🏢 Organization & Tenants
            </h2>
            <span className="text-[#2AFEB7]">→</span>
          </div>

          <p className="mt-2 text-xs text-[#9AA6B2]">
            View active tenant organization, role assignments, and restaurant profile details.
          </p>
        </Link>

        {/* Security & Sessions */}
        <Link
          href="/settings/security"
          className="block rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7] hover:bg-[#18212B]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F5F7FA]">
              🔒 Security & Credentials
            </h2>
            <span className="text-[#2AFEB7]">→</span>
          </div>

          <p className="mt-2 text-xs text-[#9AA6B2]">
            Manage password policies, active authentication tokens, and session credentials.
          </p>
        </Link>
      </div>
    </div>
  );
}
