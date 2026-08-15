'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { apiClient } from '@/services/api-client';
import type { Subscription } from '@/services/subscriptions.service';
import { Sidebar } from './sidebar';
import { ContextSelectors } from './context-selectors';
import { SearchOverlay } from '../search/search-overlay';
import { AIAssistantDrawer } from '../dashboard/ai-assistant-drawer';
import { NotificationBell } from './notification-bell';

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
  const [isOffline, setIsOffline] = useState(false);
  const [canAccessAi, setCanAccessAi] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Subscription gating for AI Copilot (Hidden for Free Trial & Starter plans)
  useEffect(() => {
    if (!user) {
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
        if (
          status === 'TRIALING' ||
          status !== 'ACTIVE' ||
          planName.includes('starter') ||
          planName.includes('trial') ||
          planName.includes('free')
        ) {
          setCanAccessAi(false);
          return;
        }

        // Only Active Paid Plans with ai_copilot feature (Growth, Pro, Enterprise)
        const hasAiFeature =
          features.includes('ai_copilot') ||
          planName.includes('growth') ||
          planName.includes('pro') ||
          planName.includes('enterprise');
          
        setCanAccessAi(hasAiFeature);
      })
      .catch(() => {
        if (isMounted) setCanAccessAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, currentRestaurant]);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="min-h-screen bg-[#0B0F14] text-[#F5F7FA]">
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-[#F59E0B] px-4 py-2 text-xs font-bold text-[#0B0F14] shadow-md animate-pulse">
          <span>⚠️</span>
          <span>You are currently working offline. Changes will automatically sync once your internet connection is restored.</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#26313C] bg-[#111820]/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile Hamburger Button */}
            {user && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden flex items-center justify-center p-2 rounded-lg border border-[#26313C] bg-[#18212B] text-[#F5F7FA] hover:border-[#2AFEB7] transition-colors"
                aria-label="Toggle navigation menu"
              >
                <span className="text-xl leading-none">{isMobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Project Atlas Logo"
                className="h-9 w-auto object-contain"
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
                  className="w-full flex items-center justify-between rounded-xl border border-[#26313C] bg-[#18212B] px-3.5 py-1.5 text-xs text-[#9AA6B2] hover:border-[#2AFEB7]/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>🔎</span> Search Atlas...
                  </span>
                  <span className="rounded bg-[#111820] border border-[#26313C] px-1.5 py-0.5 text-[10px] font-mono">
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
                className="md:hidden text-lg p-1.5 hover:bg-[#18212B] rounded-lg border border-[#26313C]"
              >
                🔎
              </button>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#F5F7FA]">
                {user?.name}
              </p>
              <p className="text-xs text-[#9AA6B2]">
                {user?.email}
              </p>
            </div>

            {user && <NotificationBell />}

            {user && canAccessAi && (
              <button
                type="button"
                onClick={() => setIsAiOpen(true)}
                className="rounded-lg border border-[#26313C] bg-[#18212B]/85 hover:border-[#2AFEB7] hover:bg-[#18212B] px-3 py-2 text-sm font-semibold text-[#2AFEB7] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>🤖</span> <span className="hidden sm:inline">Ask AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="hidden sm:block rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] transition-all hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-64 border-r border-[#26313C] bg-[#111820] md:block">
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer Slide-Over */}
      {user && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0B0F14]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-[#111820] border-r border-[#26313C] h-full z-10 shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#26313C] pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Atlas Logo" className="h-7 w-auto" />
                <span className="rounded bg-[#2AFEB7]/15 border border-[#2AFEB7]/30 px-2 py-0.5 text-[10px] font-bold text-[#2AFEB7] uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-[#26313C] text-[#9AA6B2] hover:text-[#F5F7FA]"
              >
                ✕
              </button>
            </div>

            {/* Context Selectors on Mobile */}
            <div className="border-b border-[#26313C] pb-3">
              <ContextSelectors />
            </div>

            {/* Sidebar Navigation */}
            <div className="flex-1 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
              <Sidebar />
            </div>

            {/* Mobile Actions Footer */}
            <div className="pt-4 border-t border-[#26313C] space-y-3">
              <div className="text-xs text-[#9AA6B2]">
                Logged in as <span className="font-semibold text-[#F5F7FA]">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
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
