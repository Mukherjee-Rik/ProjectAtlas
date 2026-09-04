'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Settings2, X, Check } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  savedAt: string;
}

const STORAGE_KEY = 'kafei_cookie_consent';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);

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
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden"
        >
          <div className="rounded-2xl border border-border/80 bg-background/95 p-5 shadow-2xl backdrop-blur-xl md:p-6">
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

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-xl border border-border bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background shadow-md transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Granular Preferences Modal ─────────────────────────────── */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
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
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close preferences"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">
                    2. Analytics & Performance Cookies
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Aggregated, anonymized statistics about page responsiveness, floor map rendering speed, and error telemetry.
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">
                    3. Functional & UI Preferences
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={functional}
                      onChange={(e) => setFunctional(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Remembers your light/dark theme preference, sidebar pinned state, and restaurant table zoom level.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/70 pt-4 text-xs">
              <Link
                href="/cookies"
                className="text-primary hover:underline font-medium text-[11px]"
              >
                Read Full Cookie Policy →
              </Link>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="rounded-xl border border-border bg-secondary px-3.5 py-2 font-semibold text-foreground hover:bg-border transition-colors cursor-pointer"
                >
                  Reject All Optional
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-bold text-background shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
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
        'rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background shadow transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer shrink-0'
      }
    >
      Open Cookie Preferences
    </button>
  );
}
