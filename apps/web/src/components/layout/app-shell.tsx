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
  const [isOffline, setIsOffline] = useState(false);
  const [canAccessAi, setCanAccessAi] = useState(false);

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
    <div className="min-h-screen bg-[#0B0F14] text-[#F5F7FA] pb-16 md:pb-0">
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
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-wider text-[#2AFEB7] hover:opacity-80 transition-opacity"
            >
              PROJECT ATLAS
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

          <div className="flex items-center gap-4">
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
              className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] transition-all hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
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

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111820] border-t border-[#26313C] flex justify-around items-center z-40 px-4">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] ${
              pathname === '/dashboard' ? 'text-[#2AFEB7] font-bold' : 'text-[#9AA6B2]'
            }`}
          >
            <span className="text-base">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/orders"
            className={`flex flex-col items-center gap-1 text-[10px] ${
              pathname === '/orders' ? 'text-[#2AFEB7] font-bold' : 'text-[#9AA6B2]'
            }`}
          >
            <span className="text-base">🧾</span>
            <span>Orders</span>
          </Link>
          <Link
            href="/tables"
            className={`flex flex-col items-center gap-1 text-[10px] ${
              pathname === '/tables' ? 'text-[#2AFEB7] font-bold' : 'text-[#9AA6B2]'
            }`}
          >
            <span className="text-base">🪑</span>
            <span>Tables</span>
          </Link>
          <Link
            href="/menus"
            className={`flex flex-col items-center gap-1 text-[10px] ${
              pathname === '/menus' ? 'text-[#2AFEB7] font-bold' : 'text-[#9AA6B2]'
            }`}
          >
            <span className="text-base">🍽️</span>
            <span>Menus</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 text-[10px] ${
              pathname === '/profile' ? 'text-[#2AFEB7] font-bold' : 'text-[#9AA6B2]'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>Profile</span>
          </Link>
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
