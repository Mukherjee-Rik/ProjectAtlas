'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Sparkles, WifiOff, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { apiClient } from '@/services/api-client';
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

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const pathname = usePathname();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [canAccessAi, setCanAccessAi] = useState(false);

  // Restore sidebar collapse state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atlas_sidebar_collapsed');
      if (saved === 'true') {
        setIsSidebarCollapsed(true);
      }
    }
  }, []);

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

  // Subscription & Role gating for AI Copilot (Only OWNER, MANAGER, PLATFORM_ADMIN)
  useEffect(() => {
    if (!user || !currentRestaurant?.id) {
      setCanAccessAi(false);
      return;
    }

    const isAuthorizedRole =
      user.role === 'OWNER' ||
      user.role === 'MANAGER' ||
      user.role === 'PLATFORM_ADMIN';

    // Staff below manager (Waiter, Cashier, Kitchen, Staff, User) cannot access Ask AI
    if (!isAuthorizedRole) {
      setCanAccessAi(false);
      return;
    }

    // Platform Admins always have AI Copilot access
    if (user.role === 'PLATFORM_ADMIN') {
      setCanAccessAi(true);
      return;
    }

    let isMounted = true;
    apiClient.get<any>('/subscriptions/my-subscription')
      .then((res) => {
        if (!isMounted) return;
        const sub: Subscription | null = (res as any)?.data ?? res;
        if (!sub || !sub.plan) {
          setCanAccessAi(false);
          return;
        }

        const planName = (sub.plan.name || '').toLowerCase();
        const status = sub.status;
        const features = (sub.plan.features as string[]) || [];

        // Users on Free Trial, Trialing state, or Starter plans do NOT have Ask AI option
        const isPeriodValid =
          status === 'ACTIVE' ||
          (status === 'CANCELLED' && sub.currentPeriodEnd && new Date() <= new Date(sub.currentPeriodEnd));

        if (
          !isPeriodValid ||
          planName.includes('starter') ||
          planName.includes('trial') ||
          planName.includes('free')
        ) {
          setCanAccessAi(false);
          return;
        }

        // Paid Plans with ai_copilot feature (Growth, Pro, Enterprise)
        const hasAiFeature =
          planName.includes('enterprise') ||
          planName.includes('growth') ||
          planName.includes('pro') ||
          features.includes('ai_copilot') ||
          features.includes('ai-copilot');
          
        setCanAccessAi(hasAiFeature);
      })
      .catch(() => {
        if (isMounted) setCanAccessAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, currentRestaurant]);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Lets keyboard users bypass the header and nav on every page. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div
          role="status"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-atlas-warning px-4 py-2 text-xs font-bold text-background shadow-md"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>You are currently working offline. Changes will automatically sync once your internet connection is restored.</span>
        </div>
      )}

      {/* Top Header */}
      <header className="liquid-glass sticky top-0 z-40 rounded-none border-b border-border/60 print:hidden">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile Hamburger Button */}
            {user && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden flex items-center justify-center p-2 rounded-lg border border-border bg-secondary text-foreground hover:border-primary transition-colors"
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
                className="hidden md:flex items-center justify-center p-2 rounded-xl border border-border bg-secondary text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
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
              href={
                user?.role === 'PLATFORM_ADMIN'
                  ? '/platform-admin'
                  : user?.role === 'CASHIER'
                  ? '/cashier'
                  : user?.role === 'WAITER' || user?.role === 'STAFF'
                  ? '/waiter'
                  : user?.role === 'KITCHEN'
                  ? '/kitchen'
                  : '/dashboard'
              }
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Kafei Logo"
                className="h-9 w-auto object-contain rounded-md"
              />
            </Link>

            {user && (
              <div className="hidden lg:block">
                <ContextSelectors />
              </div>
            )}

            {/* Universal Command Search Trigger */}
            {user && (
              <div className="flex-1 max-w-sm mx-6 hidden md:block">
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

          <div className="flex items-center gap-3">
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

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>

            <ThemeToggle />

            {user && <NotificationBell />}

            {user && canAccessAi && (
              <button
                type="button"
                onClick={() => setIsAiOpen(true)}
                className="rounded-lg border border-border bg-secondary/85 hover:border-primary hover:bg-secondary px-3 py-2 text-sm font-semibold text-primary transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />{' '}
                <span className="hidden sm:inline">Ask AI</span>
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

      {/* Main Layout Area */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          aria-label="Main navigation"
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-border bg-card sidebar-scroll transition-all duration-200 ease-in-out md:block print:hidden ${
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
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative flex flex-col w-4/5 max-w-xs bg-card border-r border-border h-full z-10 p-4 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Link
                href={
                  user?.role === 'PLATFORM_ADMIN'
                    ? '/platform-admin'
                    : user?.role === 'CASHIER'
                    ? '/cashier'
                    : user?.role === 'WAITER' || user?.role === 'STAFF'
                    ? '/waiter'
                    : user?.role === 'KITCHEN'
                    ? '/kitchen'
                    : '/dashboard'
                }
                className="flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img src="/logo.png" alt="Kafei Logo" className="h-7 w-auto object-contain rounded-md" />
                <span className="rounded bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {user.role}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                ✕
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

            {/* Mobile Actions Footer */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="text-xs text-muted-foreground">
                Logged in as <span className="font-semibold text-foreground">{user.name}</span>
              </div>
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
