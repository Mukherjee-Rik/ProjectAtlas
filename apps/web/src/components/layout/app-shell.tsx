'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Sparkles, WifiOff, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useMySubscription } from '@/hooks/use-my-subscription';
import type { Subscription } from '@/services/subscriptions.service';
import { Sidebar } from './sidebar';
import { ContextSelectors } from './context-selectors';
import { SearchOverlay } from '../search/search-overlay';
import { AIAssistantDrawer } from '../dashboard/ai-assistant-drawer';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from '../ui/theme-toggle';

interface AppShellProps {
  children: ReactNode;
}

/** Staff below manager (Waiter, Cashier, Kitchen, Staff, User) never see Ask AI. */
const AI_COPILOT_ROLES = new Set(['OWNER', 'MANAGER', 'PLATFORM_ADMIN']);

/**
 * Whether this session may open the AI Copilot.
 *
 * Deliberately NOT `hasLiveEntitlement` from use-my-subscription: that answers
 * the broader question of whether the app opens at all, and the two rules are
 * not the same rule. A running trial and a Starter plan both get the app and
 * neither gets the copilot; a cancelled plan loses nothing until the period it
 * has already paid for actually ends. Collapsing the two would either hand the
 * copilot to trials or take it from a customer who is still paid up, so the
 * plan predicate stays here, beside the roles it is paired with.
 */
function canUseAiCopilot(
  role: string | undefined,
  restaurantId: string | null,
  subscription: Subscription | null,
): boolean {
  if (!role || !restaurantId) return false;
  if (!AI_COPILOT_ROLES.has(role)) return false;

  // Platform Admins administer the platform and are not billed for it.
  if (role === 'PLATFORM_ADMIN') return true;

  if (!subscription?.plan) return false;

  const planName = (subscription.plan.name || '').toLowerCase();
  const isPeriodValid =
    subscription.status === 'ACTIVE' ||
    (subscription.status === 'CANCELLED' &&
      Boolean(subscription.currentPeriodEnd) &&
      new Date() <= new Date(subscription.currentPeriodEnd));

  if (
    !isPeriodValid ||
    planName.includes('starter') ||
    planName.includes('trial') ||
    planName.includes('free')
  ) {
    return false;
  }

  // Paid Plans with ai_copilot feature (Growth, Pro, Enterprise)
  const features = (subscription.plan.features as string[]) || [];
  return (
    planName.includes('enterprise') ||
    planName.includes('growth') ||
    planName.includes('pro') ||
    features.includes('ai_copilot') ||
    features.includes('ai-copilot')
  );
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { currentRestaurantId } = useRestaurant();
  const pathname = usePathname();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Reading storage during the first render rather than in an effect: AppShell
  // only ever renders in the browser (ProtectedRoute holds an app-shaped
  // skeleton until it has mounted), so there is no server render for this to
  // disagree with. Restoring it afterwards painted the expanded rail first and
  // then animated 200px of the content column sideways on every single load.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('atlas_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const wasMobileMenuOpen = useRef(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('atlas_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Subscription & Role gating for AI Copilot. The subscription comes from the
  // shared query SubscriptionGate also reads, so the pair costs one request
  // rather than two and the answer is already in hand on a repeat navigation.
  const { subscription } = useMySubscription();
  const canAccessAi = useMemo(
    () => canUseAiCopilot(user?.role, currentRestaurantId, subscription),
    [user?.role, currentRestaurantId, subscription],
  );

  // Keyboard shortcuts: Ctrl + K (Search), Ctrl + B (Toggle Sidebar), Escape (Close Drawer).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // A drawer that covers the page should not leave the page behind it scrolling.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const original = document.body.style.overflow;
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : original;

    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileMenuOpen]);

  // The drawer claims aria-modal, so focus has to actually go into it and come
  // back out to the control that opened it — otherwise a keyboard user opens a
  // dialog and carries on tabbing through the page hidden behind it.
  useEffect(() => {
    if (isMobileMenuOpen) {
      drawerCloseRef.current?.focus();
    } else if (wasMobileMenuOpen.current) {
      hamburgerRef.current?.focus();
    }
    wasMobileMenuOpen.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  const trapDrawerFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Offline status listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Register PWA service worker (Production only)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed', err);
      });
    }
  }, []);

  const homeHref =
    user?.role === 'PLATFORM_ADMIN'
      ? '/platform-admin'
      : user?.role === 'CASHIER'
      ? '/cashier'
      : user?.role === 'WAITER' || user?.role === 'STAFF'
      ? '/waiter'
      : user?.role === 'KITCHEN'
      ? '/kitchen'
      : '/dashboard';

  // The offline banner is exactly 2rem tall (py-2 around a 1rem line), so the
  // sticky rail below has to start 2rem lower while it is showing.
  const railOffset = isOffline
    ? 'top-24 h-[calc(100dvh-6rem)]'
    : 'top-16 h-[calc(100dvh-4rem)]';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Lets keyboard users bypass the header and nav on every page. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* One sticky context for the whole top bar. The banner and the header
          used to pin independently at top:0, so going offline stacked the
          warning on top of the logo, hamburger and search — hiding the controls
          at the moment a floor tablet most needs them. */}
      <div className="sticky top-0 z-40">
        {/* Offline Status Alert Banner */}
        {isOffline && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-atlas-warning px-4 py-2 text-xs font-bold text-background"
          >
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Offline — changes sync when you reconnect</span>
          </div>
        )}

        {/* Top Header */}
        <header className="liquid-glass rounded-none border-b border-border/60 print:hidden">
          <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              {/* Mobile Hamburger Button */}
              {user && (
                <button
                  ref={hamburgerRef}
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="md:hidden flex shrink-0 items-center justify-center p-2 rounded-lg border border-border bg-secondary text-foreground hover:border-primary transition-colors"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              )}

              {/* Desktop Sidebar Toggle Button */}
              {user && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex shrink-0 items-center justify-center p-2 rounded-xl border border-border bg-secondary text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
                  title={isSidebarCollapsed ? 'Expand sidebar (Ctrl + B)' : 'Collapse sidebar (Ctrl + B)'}
                  aria-label="Toggle sidebar width"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}

              <Link
                href={homeHref}
                className="flex shrink-0 items-center gap-2 hover:opacity-90 transition-opacity"
              >
                {/* Explicit dimensions so the header reserves the slot before the
                    file lands — an intrinsically 1024px-wide source arriving late
                    used to shove the hamburger and search sideways after paint.
                    The file itself stays full size: it doubles as the OG image
                    and the favicon, so the resize belongs at the use site. */}
                <Image
                  src="/logo.png"
                  alt="Kafei"
                  width={66}
                  height={36}
                  priority
                  className="h-9 w-auto object-contain rounded-md"
                />
              </Link>

              {user && (
                <div className="hidden min-w-0 lg:block">
                  <ContextSelectors />
                </div>
              )}

              {/* Universal Command Search Trigger */}
              {user && (
                <div className="hidden min-w-0 flex-1 max-w-sm mx-6 md:block">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-secondary px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5" aria-hidden="true" /> Search Kafei...
                    </span>
                    <span className="rounded bg-card border border-border px-1.5 py-0.5 text-[10px] font-mono">
                      Ctrl K
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Quick search button for mobile */}
              {user && (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search Kafei"
                  className="md:hidden flex items-center justify-center p-1.5 hover:bg-secondary rounded-lg border border-border"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                </button>
              )}

              {/* An email is one unbreakable token — roughly 240px of it — so it
                  only appears where there is room for it and is capped even
                  there. The drawer carries the same identity on a phone. */}
              <div className="hidden min-w-0 max-w-[160px] text-right lg:block xl:max-w-[220px]">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>

              <ThemeToggle />

              {user && <NotificationBell />}

              {user && canAccessAi && (
                <button
                  type="button"
                  onClick={() => setIsAiOpen(true)}
                  className="hidden sm:flex rounded-lg border border-border bg-secondary/85 hover:border-primary hover:bg-secondary px-3 py-2 text-sm font-semibold text-primary transition-all items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Ask AI</span>
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="hidden sm:block rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground transition-all hover:border-primary hover:text-primary"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Layout Area */}
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <aside
          aria-label="Main navigation"
          className={`sticky hidden shrink-0 overflow-y-auto border-r border-border bg-card sidebar-scroll transition-all duration-200 ease-in-out md:block print:hidden ${railOffset} ${
            isSidebarCollapsed ? 'w-16 lg:w-20' : 'w-64 lg:w-72'
          }`}
        >
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </aside>

        <main id="main-content" className="min-w-0 flex-1 p-4 md:p-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer Slide-Over */}
      {user && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onKeyDown={trapDrawerFocus}
            className="relative flex flex-col w-4/5 max-w-xs bg-card border-r border-border h-full z-10 p-4 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <Link
                href={homeHref}
                className="flex min-w-0 items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Image
                  src="/logo.png"
                  alt="Kafei"
                  width={51}
                  height={28}
                  className="h-7 w-auto object-contain rounded-md"
                />
                <span className="shrink-0 rounded bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {user.role}
                </span>
              </Link>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="shrink-0 p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Context Selectors on Mobile */}
            <div className="border-b border-border pb-3">
              <ContextSelectors />
            </div>

            {/* Sidebar Navigation */}
            <div className="flex-1 overflow-y-auto sidebar-scroll" onClick={() => setIsMobileMenuOpen(false)}>
              <Sidebar />
            </div>

            {/* Mobile Actions Footer. Carries the two header controls that do not
                fit a 320px row — Ask AI and Logout — so the drawer is the whole
                desktop header rather than a subset of it. The safe-area pad
                keeps Logout clear of the iOS home indicator. */}
            <div className="space-y-3 border-t border-border pt-4 pb-[env(safe-area-inset-bottom)]">
              <div className="min-w-0 text-xs text-muted-foreground">
                Logged in as{' '}
                <span className="font-semibold text-foreground">{user.name}</span>
              </div>

              {canAccessAi && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAiOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Ask AI
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-atlas-error hover:bg-atlas-error/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Search Modal (Ctrl + K) */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* AI Assistant Drawer */}
      {canAccessAi && (
        <AIAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      )}
    </div>
  );
}
