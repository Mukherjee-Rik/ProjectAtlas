'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const [session, setSession] = useState<PublicCustomerSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [countdown, setCountdown] = useState(2);

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

  // Auto-redirect to menu after session loads
  useEffect(() => {
    if (!session || isLoading) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isLoading]);

  useEffect(() => {
    if (countdown === 0 && session) {
      router.push(`/t/${token}/menu`);
    }
  }, [countdown, session, token, router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0B0F14] p-4 text-[#F5F7FA]">
        {/* Animated logo */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#2AFEB7]/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-[#2AFEB7]/30" />
          <span className="relative text-3xl">🍽️</span>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-bold text-[#2AFEB7] animate-pulse">
            Setting up your table…
          </p>
          <p className="text-xs text-[#9AA6B2]">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
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

  // ── Splash / redirect state ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
      <div className="w-full max-w-sm rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center shadow-2xl space-y-6">

        {/* Brand logo */}
        <div className="flex justify-center items-center">
          <img
            src="/logo.png"
            alt="Atlas Logo"
            className="h-14 w-auto object-contain drop-shadow-[0_0_10px_rgba(42,254,183,0.3)]"
          />
        </div>

        {/* Big welcome icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#2AFEB7]/10 text-4xl shadow-inner">
          🍽️
        </div>

        {/* Restaurant & Table */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#F5F7FA]">
            {session.restaurant.name}
          </h1>
          <p className="text-xs text-[#9AA6B2]">
            {session.branch.name} · {session.diningArea.name}
          </p>
        </div>

        <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 p-4">
          <p className="text-xs uppercase font-semibold tracking-wider text-[#9AA6B2]">
            Welcome to
          </p>
          <p className="text-3xl font-extrabold text-[#2AFEB7] mt-1">
            {session.table.name}
          </p>
        </div>

        {/* Auto-redirect countdown */}
        <div className="space-y-3">
          <p className="text-xs text-[#9AA6B2]">
            Opening menu in <span className="font-bold text-[#2AFEB7]">{countdown}s</span>…
          </p>
          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#26313C]">
            <div
              className="h-full bg-[#2AFEB7] transition-all duration-1000 ease-linear"
              style={{ width: countdown === 2 ? '100%' : countdown === 1 ? '50%' : '0%' }}
            />
          </div>
          <button
            type="button"
            onClick={() => router.push(`/t/${token}/menu`)}
            className="block w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            View Menu Now →
          </button>
        </div>

      </div>
    </div>
  );
}
