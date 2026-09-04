import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Process-local TTL cache for the identity/context lookups that every
 * authenticated request repeats (user, session, tenant, membership,
 * restaurant, branch, subscription).
 *
 * Those rows are read on every request but change rarely, and the database
 * lives in another region — so each lookup costs a full network round trip.
 * Caching them removes that cost; entries are deliberately short-lived and
 * are invalidated explicitly wherever the underlying row is mutated.
 */
@Injectable()
export class TtlCacheService implements OnModuleDestroy {
  private readonly store = new Map<string, CacheEntry>();

  /** De-duplicates concurrent misses so a cold key issues one query, not N. */
  private readonly inflight = new Map<string, Promise<unknown>>();

  private readonly maxEntries = 10_000;

  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
    this.store.clear();
    this.inflight.clear();
  }

  /**
   * Returns the cached value for `key`, otherwise runs `loader` and caches
   * whatever it resolves to. `null`/`undefined` results are not cached, so a
   * row created moments later is picked up immediately rather than being
   * masked by a cached miss.
   */
  async wrap<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const hit = this.store.get(key);

    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }

    if (hit) {
      this.store.delete(key);
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const load = loader()
      .then((value) => {
        if (value !== null && value !== undefined) {
          this.set(key, value, ttlMs);
        }
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, load);

    return load;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    // Bounded FIFO eviction keeps a burst of unique keys from growing the heap.
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next();
      if (!oldest.done) {
        this.store.delete(oldest.value);
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    if (hit) {
      this.store.delete(key);
    }
    return undefined;
  }

  invalidate(key: string): void {
    this.store.delete(key);
    this.inflight.delete(key);
  }

  /** Drops every key beginning with `prefix` (e.g. all sessions for a user). */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    for (const key of this.inflight.keys()) {
      if (key.startsWith(prefix)) {
        this.inflight.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Cache key builders — centralised so producers and invalidators cannot drift.
 */
export const CacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  membership: (userId: string, tenantId: string) =>
    `membership:${userId}:${tenantId}`,
  membershipsForUser: (userId: string) => `membership:${userId}:`,
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  branch: (branchId: string) => `branch:${branchId}`,
  subscription: (restaurantId: string) => `subscription:${restaurantId}`,
  tableToken: (token: string) => `table_token:${token}`,
  tableSession: (tableId: string) => `table_session:${tableId}`,
  menuItem: (restaurantId: string, menuItemId: string) =>
    `menu_item:${restaurantId}:${menuItemId}`,
} as const;

/**
 * TTLs are short by design: they exist to collapse the burst of identical
 * lookups a single page load produces, not to hold state for long.
 * Session and user are shortest because they gate access.
 */
export const CacheTtl = {
  session: 10_000,
  user: 15_000,
  tenant: 60_000,
  membership: 30_000,
  restaurant: 60_000,
  branch: 60_000,
  subscription: 20_000,
  tableToken: 30_000,
  tableSession: 15_000,
  menuItem: 30_000,
} as const;
