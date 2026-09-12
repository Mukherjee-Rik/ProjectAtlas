'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { navigationItems, NavigationItem } from './navigation';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isOwnerOrPlatformAdmin = user?.role === 'OWNER' || user?.role === 'PLATFORM_ADMIN';
  const isManagerOrHigher = user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.role === 'PLATFORM_ADMIN';

  const filteredNavItems = navigationItems.filter((item) => {
    if (user?.role === 'PLATFORM_ADMIN') {
      return [
        '/platform-admin',
        '/analytics',
        '/reports',
        '/forecasts',
        '/restaurants',
        '/subscriptions',
        '/support',
        '/profile',
        '/settings',
      ].includes(item.href);
    }
    if (user?.role === 'CASHIER') {
      return ['/cashier', '/kitchen', '/support', '/profile'].includes(item.href);
    }
    if (user?.role === 'WAITER') {
      return ['/waiter', '/kitchen', '/support', '/profile'].includes(item.href);
    }
    if (user?.role === 'STAFF') {
      return ['/waiter', '/cashier', '/kitchen', '/support', '/profile'].includes(item.href);
    }
    if (user?.role === 'KITCHEN') {
      return ['/kitchen', '/support', '/profile'].includes(item.href);
    }
    if (user?.role === 'USER') {
      return ['/support', '/profile'].includes(item.href);
    }

    // Owner-only routes (Multi-branch administration, restaurant management, billing)
    if (!isOwnerOrPlatformAdmin && ['/branches', '/restaurants', '/subscriptions'].includes(item.href)) {
      return false;
    }

    // Manager & Owner only routes (Analytics, Reports, Forecasts, Inventory, Staff Management)
    if (!isManagerOrHigher && ['/analytics', '/reports', '/forecasts', '/inventory', '/users'].includes(item.href)) {
      return false;
    }

    if (!item.permission) {
      return true;
    }
    return hasPermission(user?.role, item.permission);
  });

  // Group items by their group property
  const groups: Record<string, NavigationItem[]> = {};
  const rootItems: NavigationItem[] = [];

  filteredNavItems.forEach((item) => {
    if (item.group) {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }
      groups[item.group].push(item);
    } else {
      rootItems.push(item);
    }
  });

  const renderLink = (item: NavigationItem) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          aria-current={isActive ? 'page' : undefined}
          className={[
            // 44px, not 40: the coarse-pointer floor in globals.css only
            // covers button/[role=button], and these are plain links — on a
            // floor tablet they are the app's most-tapped targets.
            'group relative flex h-11 w-11 mx-auto items-center justify-center rounded-xl transition-all duration-150',
            isActive
              ? 'bg-primary/20 text-primary font-bold border border-primary/50'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:border border-border/60',
          ].join(' ')}
        >
          <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          {isActive && (
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary" />
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={[
          'group relative flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-primary/15 text-primary font-bold border border-primary/40'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-l-2 hover:border-primary/40',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors" />
          <span className="truncate">{item.label}</span>
        </div>
        {isActive && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <nav className={`space-y-5 text-left font-sans ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {/* Root Items (e.g. Dashboard) */}
        {rootItems.length > 0 && (
          <div className="space-y-1.5">
            {rootItems.map(renderLink)}
          </div>
        )}

        {/* Grouped Submenu Sections */}
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="space-y-1.5">
            {!isCollapsed ? (
              <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {groupName}
              </p>
            ) : (
              <div className="my-2 border-t border-border/60 mx-1" />
            )}
            <div className={!isCollapsed ? 'space-y-1 pl-1 border-l-2 border-border ml-3.5' : 'space-y-1.5'}>
              {items.map(renderLink)}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse/Expand Toggle Button in Desktop Footer */}
      {onToggle && (
        <div className={`p-3 border-t border-border/60 hidden md:block ${isCollapsed ? 'text-center' : ''}`}>
          <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/60 hover:bg-secondary hover:border-primary/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar (Ctrl + B)' : 'Collapse sidebar (Ctrl + B)'}
            // Collapsed, the label is the only accessible name this button has.
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Collapse Sidebar</span>
                <kbd className="ml-auto rounded bg-card border border-border px-1.5 py-0.5 text-[10px] font-mono">
                  Ctrl B
                </kbd>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
