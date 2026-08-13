export type CacheSurface = "SEARCH" | "ARTIST" | "ALBUM" | "POPULAR" | "FRESH";

interface CacheEntry<T> {
  timestamp: number;
  ttlMs: number;
  data: T;
}

const CATALOG_CACHE = new Map<string, CacheEntry<any>>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<any>>();

const SURFACE_TTLS: Record<CacheSurface, number> = {
  SEARCH: 10 * 60 * 1000,   // 10 minutes
  ARTIST: 30 * 60 * 1000,   // 30 minutes
  ALBUM: 30 * 60 * 1000,    // 30 minutes
  POPULAR: 5 * 60 * 1000,   // 5 minutes
  FRESH: 5 * 60 * 1000,     // 5 minutes
};

/**
 * Retrieves data from in-memory cache if fresh.
 */
export function getFromCatalogCache<T>(key: string): T | null {
  const entry = CATALOG_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttlMs) {
    CATALOG_CACHE.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Stores data in in-memory cache with surface-specific TTL.
 */
export function setInCatalogCache<T>(key: string, data: T, surface: CacheSurface): void {
  const ttlMs = SURFACE_TTLS[surface] || 10 * 60 * 1000;
  CATALOG_CACHE.set(key, { timestamp: Date.now(), ttlMs, data });
}

/**
 * Deduplicates in-flight network requests by sharing the active Promise for identical cache keys.
 */
export async function getOrFetchInFlight<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (IN_FLIGHT_PROMISES.has(key)) {
    return IN_FLIGHT_PROMISES.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    IN_FLIGHT_PROMISES.delete(key);
  });

  IN_FLIGHT_PROMISES.set(key, promise);
  return promise;
}
