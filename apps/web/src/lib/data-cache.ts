/**
 * In-Memory Stale-While-Revalidate (SWR) Data Cache
 * Enables instant (0ms) page renders using cached data while revalidating in the background.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const DataCache = {
  get<T>(key: string, maxAgeMs = 120000): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    // Serve cached data if within maxAgeMs
    if (Date.now() - entry.timestamp > maxAgeMs) {
      return entry.data; // Stale data for background revalidation
    }
    return entry.data;
  },

  set<T>(key: string, data: T): void {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  },

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
  },
};
