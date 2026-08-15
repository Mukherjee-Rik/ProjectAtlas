'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';
import { getCurrentRestaurantId } from '@/lib/restaurant-storage';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    pages: [],
    restaurants: [],
    orders: [],
    menuItems: [],
    staff: [],
    tables: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({
        pages: [],
        restaurants: [],
        orders: [],
        menuItems: [],
        staff: [],
        tables: [],
      });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced API search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({
        pages: [],
        restaurants: [],
        orders: [],
        menuItems: [],
        staff: [],
        tables: [],
      });
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await apiClient.get<any>(`/search?q=${encodeURIComponent(query)}`);
        setResults(res || {
          pages: [],
          restaurants: [],
          orders: [],
          menuItems: [],
          staff: [],
          tables: [],
        });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms Debounce

    return () => clearTimeout(handler);
  }, [query]);

  // Flatten results for easy keyboard index traversal
  const getFlatItems = () => {
    const list: { type: string; label: string; href: string; detail?: string }[] = [];
    results.pages.forEach((p: any) => list.push({ type: 'Page', label: p.label, href: p.href }));
    results.restaurants.forEach((r: any) => list.push({ type: 'Restaurant', label: r.name, href: `/platform-admin`, detail: r.slug }));
    results.menuItems.forEach((m: any) => list.push({ type: 'Menu Item', label: m.name, href: `/menus`, detail: `₹${m.price}` }));
    results.orders.forEach((o: any) => list.push({ type: 'Order', label: `Order ${o.orderNumber}`, href: `/orders`, detail: `${o.status} • ₹${o.totalAmount}` }));
    results.tables.forEach((t: any) => list.push({ type: 'Table', label: `Table ${t.name}`, href: `/tables`, detail: `Code: ${t.code}` }));
    if (results.staff) {
      results.staff.forEach((s: any) => list.push({ type: 'Staff', label: s.name, href: `/users`, detail: `${s.email} (${s.role})` }));
    }
    return list;
  };

  const flatItems = getFlatItems();

  // Keyboard navigation listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#070B0E]/80 backdrop-blur-sm p-4 pt-[15vh]">
      {/* Backdrop closer click target */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#26313C] bg-[#111820] shadow-2xl flex flex-col">
        {/* Search Input Box */}
        <div className="flex items-center gap-3 border-b border-[#26313C] px-4 py-3 bg-[#18212B]">
          <span className="text-lg">🔎</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search menus, orders, tables, staff, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#F5F7FA] outline-none placeholder-[#64748B]"
          />
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2AFEB7] border-t-transparent" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-[#111820] border border-[#26313C] px-2 py-1 text-[10px] text-[#9AA6B2] hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {flatItems.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2 px-2">
                Matching Results ({flatItems.length})
              </p>
              {flatItems.map((item, idx) => {
                const isCurrent = idx === selectedIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    className={[
                      'flex items-center justify-between rounded-xl px-4 py-2.5 cursor-pointer transition-all border text-left',
                      isCurrent
                        ? 'bg-[#2AFEB7]/10 border-[#2AFEB7]/30 text-[#2AFEB7] shadow-[0_0_8px_rgba(42,254,183,0.05)]'
                        : 'bg-transparent border-transparent hover:bg-[#18212B]/40 text-[#F5F7FA]',
                    ].join(' ')}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{item.label}</span>
                      {item.detail && (
                        <span className="text-[10px] text-[#9AA6B2] mt-0.5">{item.detail}</span>
                      )}
                    </div>
                    <span className="rounded-full bg-[#18212B] border border-[#26313C] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9AA6B2]">
                      {item.type}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="py-8 text-center text-xs text-[#9AA6B2]">
              No matching pages or database records found for "{query}".
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#9AA6B2]">
              Type at least 2 characters to search across the platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
