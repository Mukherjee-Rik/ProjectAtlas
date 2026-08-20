'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { navigationItems, NavigationItem } from './navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavItems = navigationItems.filter((item) => {
    if (user?.role === 'PLATFORM_ADMIN') {
      // Platform Admin navigation
      return ['/platform-admin', '/restaurants', '/subscriptions', '/support', '/profile', '/settings'].includes(item.href);
    }
    if (user?.role === 'CASHIER') {
      return ['/cashier', '/kitchen', '/profile'].includes(item.href);
    }
    if (user?.role === 'WAITER') {
      return ['/waiter', '/kitchen', '/profile'].includes(item.href);
    }
    if (user?.role === 'STAFF') {
      return ['/waiter', '/cashier', '/kitchen', '/profile'].includes(item.href);
    }
    if (user?.role === 'KITCHEN') {
      return ['/kitchen', '/profile'].includes(item.href);
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
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-[#2AFEB7]/15 text-[#2AFEB7] font-bold border border-[#2AFEB7]/40 shadow-[0_0_12px_rgba(42,254,183,0.15)]'
            : 'text-[#9AA6B2] hover:bg-[#18212B] hover:text-[#F5F7FA] hover:border-l-2 hover:border-[#2AFEB7]/40',
        ].join(' ')}
      >
        <span className="truncate">{item.label}</span>
        {isActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#2AFEB7] shadow-[0_0_6px_#2AFEB7]" />
        )}
      </Link>
    );
  };

  return (
    <nav className="space-y-5 p-4 text-left font-sans">
      {/* Root Items (e.g. Dashboard) */}
      {rootItems.length > 0 && (
        <div className="space-y-1.5">
          {rootItems.map(renderLink)}
        </div>
      )}

      {/* Grouped Submenu Sections */}
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} className="space-y-1.5">
          <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {groupName}
          </p>
          <div className="space-y-1 pl-1 border-l-2 border-[#26313C] ml-3.5">
            {items.map(renderLink)}
          </div>
        </div>
      ))}
    </nav>
  );
}
