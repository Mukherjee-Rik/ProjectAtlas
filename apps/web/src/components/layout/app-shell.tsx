'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from './sidebar';
import { ContextSelectors } from './context-selectors';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#F5F7FA]">
      {/* Persistent App Header */}
      <header className="border-b border-[#26313C] bg-[#111820]">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[#2AFEB7] shadow-[0_0_12px_#2AFEB7]" />
              <div className="text-xl font-bold tracking-tight text-[#F5F7FA]">
                Atlas
              </div>
            </div>

            <div className="h-4 w-px bg-[#26313C]" />

            <ContextSelectors />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#F5F7FA]">
                {user?.name}
              </p>

              <p className="text-xs text-[#9AA6B2]">
                {user?.email}
              </p>
            </div>

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

        <main className="min-w-0 flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
