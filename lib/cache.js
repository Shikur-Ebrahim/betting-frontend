/**
 * Simple in-memory cache with TTL and Stale-While-Revalidate support.
 */
const cache = new Map();
const MAX_SIZE = 500; // Protect memory

export const Cache = {
  get(key) {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;
    
    // If it's critically old (e.g., more than 2x its TTL), we consider it expired
    // but for SWR, we can still return it while we fetch fresh data.
    return {
      data: entry.data,
      isStale,
      key
    };
  },

  set(key, data, ttlSeconds = 60) {
    // Size protection
    if (cache.size >= MAX_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    const now = Date.now();
    cache.set(key, {
      data,
      expiresAt: now + (ttlSeconds * 1000),
      createdAt: now
    });
    
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  },

  delete(key) {
    cache.delete(key);
  },

  clear() {
    cache.clear();
  }
};

// Periodic cleanup of very old entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let deletedCount = 0;
    for (const [key, entry] of cache.entries()) {
      // Delete if expired for more than 10 minutes
      if (now > entry.expiresAt + (10 * 60 * 1000)) {
        cache.delete(key);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`[Cache] Cleanup: Removed ${deletedCount} expired entries.`);
    }
  }, 5 * 60 * 1000);
}
