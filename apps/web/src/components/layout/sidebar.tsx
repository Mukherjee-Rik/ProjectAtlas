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
    if (user?.role === 'WAITER' || user?.role === 'STAFF') {
      return ['/waiter', '/profile'].includes(item.href);
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
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'block rounded-lg px-3 py-1.5 text-xs transition-all',
          isActive
            ? 'bg-[#2AFEB7]/15 text-[#2AFEB7] font-semibold border border-[#2AFEB7]/30 shadow-[0_0_8px_rgba(42,254,183,0.1)]'
            : 'text-[#9AA6B2] hover:bg-[#18212B] hover:text-[#F5F7FA]',
        ].join(' ')}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="space-y-4 p-4 text-left">
      {/* Root Items (e.g. Dashboard) */}
      {rootItems.length > 0 && (
        <div className="space-y-1">
          {rootItems.map(renderLink)}
        </div>
      )}

      {/* Grouped Submenu Sections */}
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            {groupName}
          </p>
          <div className="space-y-0.5 pl-1 border-l border-[#26313C] ml-3">
            {items.map(renderLink)}
          </div>
        </div>
      ))}
    </nav>
  );
}
