import { openDB, type IDBPDatabase } from 'idb';
import type { CacheEntry } from '@/types';

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface OpenAICacheDB {
  responses: {
    key: string;
    value: CacheEntry;
  };
}

export class OpenAICache {
  // Level 1: Memory cache (fast)
  private memoryCache = new Map<string, CacheEntry>();

  // Level 2: IndexedDB (persistent)
  private dbPromise: Promise<IDBPDatabase<OpenAICacheDB>>;

  constructor() {
    this.dbPromise = openDB<OpenAICacheDB>('openai-cache', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('responses')) {
          db.createObjectStore('responses', { keyPath: 'key' });
        }
      },
    });
  }

  async get(key: string): Promise<string | null> {
    // Check memory first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      console.log(`Cache HIT (memory): ${key}`);
      return memEntry.response;
    }

    // Check IndexedDB
    try {
      const db = await this.dbPromise;
      const dbEntry = await db.get('responses', key);

      if (dbEntry && !this.isExpired(dbEntry)) {
        console.log(`Cache HIT (IndexedDB): ${key}`);
        // Promote to memory cache
        this.memoryCache.set(key, dbEntry);
        return dbEntry.response;
      }
    } catch (error) {
      console.error('Error reading from IndexedDB cache:', error);
    }

    console.log(`Cache MISS: ${key}`);
    return null;
  }

  async set(key: string, response: string): Promise<void> {
    const entry: CacheEntry = {
      key,
      response,
      timestamp: Date.now(),
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);

    // Set in IndexedDB
    try {
      const db = await this.dbPromise;
      await db.put('responses', entry);
      console.log(`Cache SET: ${key}`);
    } catch (error) {
      console.error('Error writing to IndexedDB cache:', error);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > CACHE_DURATION;
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      const db = await this.dbPromise;
      await db.clear('responses');
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Remove expired entries
  async cleanExpired(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('responses', 'readwrite');
      const store = tx.objectStore('responses');
      const allEntries = await store.getAll();

      for (const entry of allEntries) {
        if (this.isExpired(entry)) {
          await store.delete(entry.key);
        }
      }

      await tx.done;
      console.log('Expired cache entries cleaned');
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    memoryCacheSize: number;
    indexedDBCacheSize: number;
  }> {
    const memoryCacheSize = this.memoryCache.size;

    let indexedDBCacheSize = 0;
    try {
      const db = await this.dbPromise;
      indexedDBCacheSize = await db.count('responses');
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return {
      memoryCacheSize,
      indexedDBCacheSize,
    };
  }
}
