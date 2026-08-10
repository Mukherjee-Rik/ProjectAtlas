'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import {
  createPublicCustomerSession,
  type PublicCustomerSessionResponse,
} from '@/services/public-tables.service';

export default function CustomerTableEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [session, setSession] = useState<PublicCustomerSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setIsInvalid(false);

    try {
      const response = await createPublicCustomerSession(token);
      setSession(response.data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('atlas_customer_session_token', response.data.sessionToken);
      }
    } catch (err) {
      console.error(err);
      setIsInvalid(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="w-full max-w-sm rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center shadow-2xl space-y-4 animate-pulse">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#18212B]" />
          <div className="mx-auto h-4 w-32 rounded bg-[#18212B]" />
          <div className="mx-auto h-3 w-48 rounded bg-[#18212B]" />
        </div>
      </div>
    );
  }

  if (isInvalid || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="w-full max-w-sm rounded-2xl border border-[#EF4444]/30 bg-[#111820] p-8 text-center shadow-2xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10 text-3xl text-[#EF4444]">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#F5F7FA]">
              QR Code Unavailable
            </h1>
            <p className="text-xs text-[#9AA6B2] leading-relaxed">
              This table QR code is no longer active or may have been regenerated.
            </p>
          </div>

          <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 text-xs text-[#9AA6B2]">
            Please ask restaurant staff for assistance.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
      <div className="w-full max-w-sm rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#2AFEB7] shadow-[0_0_10px_#2AFEB7]" />
          <span className="text-[#2AFEB7] text-xs font-bold uppercase tracking-widest">
            Atlas Ordering
          </span>
        </div>

        {/* Restaurant & Location Info */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#F5F7FA]">
            {session.restaurant.name}
          </h1>
          <p className="text-xs text-[#9AA6B2]">
            {session.branch.name} • {session.diningArea.name}
          </p>
        </div>

        {/* Table Badge */}
        <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 p-4">
          <p className="text-xs uppercase font-semibold tracking-wider text-[#9AA6B2]">
            Welcome to
          </p>
          <p className="text-3xl font-extrabold text-[#2AFEB7] mt-1">
            {session.table.name}
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={`/t/${token}/menu`}
            className="block w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            View Digital Menu
          </Link>

          <Link
            href={`/t/${token}/cart`}
            className="block w-full rounded-xl border border-[#26313C] bg-[#18212B] py-3 text-xs font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]"
          >
            🛒 View Cart
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <p className="text-[10px] font-mono text-[#9AA6B2]/60">
            Session: {session.sessionToken.slice(0, 16)}...
          </p>
        </div>
      </div>
    </div>
  );
}
