'use client';

import { useState, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Settings2, X, Check } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  savedAt: string;
}

const STORAGE_KEY = 'kafei_cookie_consent';

/**
 * Consent switches. The input stays visually hidden but keeps its label and its
 * focus ring — the ring lives on the track, which is why the old
 * `peer-focus:outline-none` left the control with no keyboard indicator at all.
 * `allow-small-target` keeps the coarse-pointer 44px floor off the hidden input;
 * the track and its label are the real target.
 */
const TOGGLE_INPUT = 'peer sr-only allow-small-target';
const TOGGLE_TRACK = [
  'block h-5 w-9 rounded-full bg-border transition-colors',
  "after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:content-['']",
  'after:rounded-full after:border after:border-border after:bg-card after:shadow-sm after:transition-all',
  'peer-checked:bg-primary peer-checked:after:translate-x-full',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card',
].join(' ');

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Show banner after short delay for better UX
        const timer = setTimeout(() => setShowBanner(true), 800);
        return () => clearTimeout(timer);
      } else {
        const parsed: CookiePreferences = JSON.parse(stored);
        setAnalytics(parsed.analytics ?? true);
        setFunctional(parsed.functional ?? true);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenPreferences = () => {
      setShowPreferencesModal(true);
    };

    window.addEventListener('kafei:open-cookie-preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('kafei:open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  // A consent dialog is the one surface a keyboard or screen-reader user must
  // be able to identify, move through and dismiss, so it follows the same
  // contract as ConfirmDialog: focus moves in, Tab is trapped, Escape closes,
  // the page behind stops scrolling and focus returns to whatever opened it.
  useEffect(() => {
    if (!showPreferencesModal) return;

    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPreferencesModal(false);
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [showPreferencesModal]);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      window.dispatchEvent(
        new CustomEvent('kafei:cookie-consent-updated', { detail: prefs })
      );
    } catch (e) {
      console.warn('Failed to persist cookie consent:', e);
    }
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      functional: true,
      savedAt: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      functional: false,
      savedAt: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      necessary: true,
      analytics,
      functional,
      savedAt: new Date().toISOString(),
    });
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── Floating Cookie Banner ─────────────────────────────────── */}
      {showBanner && !showPreferencesModal && (
        <aside
          role="dialog"
          aria-label="Cookie consent banner"
          // The banner is mounted in the root layout, so it also floats over the
          // kitchen, waiter and cashier terminals on a notched tablet — it has to
          // clear the home-indicator strip rather than sit under it.
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-50 mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden"
        >
          <div className="rounded-2xl border border-border/80 bg-background/95 p-5 shadow-2xl sm:backdrop-blur-xl md:p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-display text-sm font-bold text-foreground">
                  We value your privacy
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Kafei uses essential cookies to keep you signed in securely and optional telemetry cookies to improve our restaurant management tools. We never sell your data or train AI on your business records. Read our{' '}
                  <Link
                    href="/cookies"
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2.5">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer sm:w-auto"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-full rounded-xl border border-border bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary cursor-pointer sm:w-auto"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer sm:w-auto"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Granular Preferences Modal ─────────────────────────────── */}
      {showPreferencesModal && (
        <div
          onClick={() => setShowPreferencesModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200 print:hidden"
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 id={titleId} className="text-base font-bold text-foreground">
                    Cookie & Privacy Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Control which cookies and telemetry Kafei is allowed to store.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close preferences"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      1. Strictly Necessary Cookies
                    </span>
                    <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary">
                      Always Active
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Required for authentication sessions, workspace context, CSRF security, and order processing. Cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="cookie-analytics" className="font-semibold text-xs text-foreground">
                    2. Analytics & Performance Cookies
                  </label>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      id="cookie-analytics"
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className={TOGGLE_INPUT}
                    />
                    <span className={TOGGLE_TRACK} />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Aggregated, anonymized statistics about page responsiveness, floor map rendering speed, and error telemetry.
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="cookie-functional" className="font-semibold text-xs text-foreground">
                    3. Functional & UI Preferences
                  </label>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      id="cookie-functional"
                      type="checkbox"
                      checked={functional}
                      onChange={(e) => setFunctional(e.target.checked)}
                      className={TOGGLE_INPUT}
                    />
                    <span className={TOGGLE_TRACK} />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Remembers your light/dark theme preference, sidebar pinned state, and restaurant table zoom level.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/cookies"
                className="text-primary hover:underline font-medium text-[11px]"
              >
                Read Full Cookie Policy →
              </Link>

              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="flex-1 justify-center rounded-xl border border-border bg-secondary px-3.5 py-2 font-semibold text-foreground hover:bg-border transition-colors cursor-pointer sm:flex-none"
                >
                  Reject All Optional
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer sm:flex-none"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kafei:open-cookie-preferences'));
        }
      }}
      className={
        className ||
        'rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer shrink-0'
      }
    >
      Open Cookie Preferences
    </button>
  );
}
