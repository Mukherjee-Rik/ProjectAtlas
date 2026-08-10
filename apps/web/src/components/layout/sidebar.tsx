'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from './navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-4">
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'block rounded-lg px-3 py-2 text-sm transition-all',
              isActive
                ? 'bg-[#2AFEB7]/15 text-[#2AFEB7] font-semibold border border-[#2AFEB7]/30'
                : 'text-[#9AA6B2] hover:bg-[#18212B] hover:text-[#F5F7FA]',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
