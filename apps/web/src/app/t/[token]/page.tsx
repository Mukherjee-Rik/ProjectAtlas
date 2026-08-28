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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4 text-foreground">
        {/* Animated logo */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/30" />
          <span className="relative text-3xl">🍽️</span>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-bold text-primary animate-pulse">
            Setting up your table…
          </p>
          <p className="text-xs text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isInvalid || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-atlas-error/30 bg-card p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-atlas-error/10 text-3xl text-atlas-error">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              QR Code Unavailable
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This table QR code is no longer active or may have been regenerated.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary p-4 text-xs text-muted-foreground">
            Please ask restaurant staff for assistance.
          </div>
        </div>
      </div>
    );
  }

  // ── Splash / redirect state ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center space-y-6">

        {/* Brand logo */}
        <div className="flex justify-center items-center">
          <img
            src="/logo.png"
            alt="Atlas Logo"
            className="h-14 w-auto object-contain drop-shadow-[0_0_10px_rgba(42,254,183,0.3)]"
          />
        </div>

        {/* Big welcome icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl shadow-inner">
          🍽️
        </div>

        {/* Restaurant & Table */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground">
            {session.restaurant.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {session.branch.name} · {session.diningArea.name}
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
            Welcome to
          </p>
          <p className="text-3xl font-extrabold text-primary mt-1">
            {session.table.name}
          </p>
        </div>

        {/* Auto-redirect countdown */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Opening menu in <span className="font-bold text-primary">{countdown}s</span>…
          </p>
          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: countdown === 2 ? '100%' : countdown === 1 ? '50%' : '0%' }}
            />
          </div>
          <button
            type="button"
            onClick={() => router.push(`/t/${token}/menu`)}
            className="block w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            View Menu Now →
          </button>
        </div>

      </div>
    </div>
  );
}
