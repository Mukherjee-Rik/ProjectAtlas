'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { apiClient } from '@/services/api-client';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlatItem {
  type: string;
  label: string;
  href: string;
  detail?: string;
}

const EMPTY_RESULTS = {
  pages: [],
  restaurants: [],
  orders: [],
  menuItems: [],
  staff: [],
  tables: [],
};

const LISTBOX_ID = 'search-results-listbox';
const optionId = (idx: number) => `search-opt-${idx}`;

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(EMPTY_RESULTS);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced API search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await apiClient.get<any>(`/search?q=${encodeURIComponent(query)}`);
        const payload = (res as any)?.data ?? res;
        setResults(payload || EMPTY_RESULTS);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms Debounce

    return () => clearTimeout(handler);
  }, [query]);

  // Flatten results for easy keyboard index traversal. Memoised because the
  // array's identity is what the keydown effect below watches: rebuilt on every
  // render it tore down and re-registered a window listener on each keystroke.
  const flatItems = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];
    if (Array.isArray(results?.pages)) {
      results.pages.forEach((p: any) => p?.label && p?.href && list.push({ type: 'Page', label: p.label, href: p.href }));
    }
    if (Array.isArray(results?.restaurants)) {
      results.restaurants.forEach((r: any) => r?.name && list.push({ type: 'Restaurant', label: r.name, href: `/platform-admin`, detail: r.slug }));
    }
    if (Array.isArray(results?.menuItems)) {
      results.menuItems.forEach((m: any) => m?.name && list.push({ type: 'Menu Item', label: m.name, href: `/menus`, detail: `₹${m.price}` }));
    }
    if (Array.isArray(results?.orders)) {
      results.orders.forEach((o: any) => o?.orderNumber && list.push({ type: 'Order', label: `Order ${o.orderNumber}`, href: `/orders`, detail: `${o.status} • ₹${o.totalAmount}` }));
    }
    if (Array.isArray(results?.tables)) {
      results.tables.forEach((t: any) => t?.name && list.push({ type: 'Table', label: `Table ${t.name}`, href: `/tables`, detail: `Code: ${t.code ?? ''}` }));
    }
    if (Array.isArray(results?.staff)) {
      results.staff.forEach((s: any) => s?.name && list.push({ type: 'Staff', label: s.name, href: `/users`, detail: `${s.email ?? ''} (${s.role ?? ''})` }));
    }
    return list;
  }, [results]);

  // The listener only needs the latest values, not a fresh registration when
  // they change, so it reads them through refs and is bound once per open.
  const itemsRef = useRef(flatItems);
  const selectedIndexRef = useRef(selectedIndex);

  useEffect(() => {
    itemsRef.current = flatItems;
    selectedIndexRef.current = selectedIndex;
  }, [flatItems, selectedIndex]);

  // Keyboard navigation listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = itemsRef.current;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[selectedIndexRef.current];
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
  }, [isOpen, router, onClose]);

  // Arrow keys walk past the bottom of a scrolling list otherwise, leaving the
  // highlight — the only indication of what Enter will open — off-screen.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, selectedIndex, flatItems]);

  if (!isOpen) return null;

  const hasResults = flatItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm p-4 pt-[15vh]">
      {/* Backdrop closer click target */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Kafei"
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card"
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-secondary">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search Kafei"
            aria-expanded={hasResults}
            aria-controls={hasResults ? LISTBOX_ID : undefined}
            aria-autocomplete="list"
            aria-activedescendant={hasResults ? optionId(selectedIndex) : undefined}
            placeholder="Search menus, orders, tables, staff, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
          {isLoading && (
            <div
              role="status"
              aria-label="Searching"
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 rounded bg-card border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-atlas-error hover:text-atlas-error"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div ref={listRef} className="max-h-[60dvh] overflow-y-auto p-4 space-y-4">
          {hasResults ? (
            <div>
              {/* Outside the listbox: a listbox may only contain its options. */}
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Matching Results ({flatItems.length})
              </p>
              <div
                id={LISTBOX_ID}
                role="listbox"
                aria-label="Search results"
                className="space-y-1"
              >
                {flatItems.map((item, idx) => {
                  const isCurrent = idx === selectedIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="option"
                      id={optionId(idx)}
                      aria-selected={isCurrent}
                      data-selected={isCurrent}
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className={[
                        'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors',
                        isCurrent
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-transparent border-transparent hover:bg-secondary/40 text-foreground',
                      ].join(' ')}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{item.label}</span>
                        {item.detail && (
                          <span className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.detail}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching pages or database records found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search across the platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
