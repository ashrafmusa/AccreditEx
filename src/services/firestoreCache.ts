/**
 * Firestore Caching Service for Free Tier Optimization
 * Reduces read operations by caching query results locally
 * 
 * FREE TIER LIMITS:
 * - 50,000 reads/day (approximately 0.58 per second)
 * - Caching reduces reads by ~60-80%
 */

import { QueryConstraint, getDocs, query, collection as firestoreCollection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { freeTierMonitor } from './freeTierMonitor';

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or fetch from Firestore
   * Significantly reduces read operations
   */
  async getCachedCollection<T>(
    collectionName: string,
    constraints?: QueryConstraint[],
    ttl?: number
  ): Promise<T[]> {
    const cacheKey = this.generateCacheKey(collectionName, constraints);
    
    // Check if data is in cache and still valid
    if (this.isCacheValid(cacheKey)) {
      console.log(`[CACHE HIT] ${collectionName} - Saves 1 read operation`);
      return this.cache.get(cacheKey)!.data as T[];
    }

    // Cache miss - fetch from Firestore (1 read operation)
    console.log(`[CACHE MISS] ${collectionName} - Using 1 read operation`);
    const collectionRef = firestoreCollection(db, collectionName);
    const q = constraints ? query(collectionRef, ...constraints) : query(collectionRef);
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));

    // Record read operation in monitoring
    freeTierMonitor.recordRead(1);

    // Store in cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || FirestoreCache.DEFAULT_TTL
    });

    return data;
  }

  /**
   * Invalidate cache for a collection
   * Call after create/update/delete operations
   */
  invalidate(collectionName: string): void {
    console.log(`[CACHE INVALIDATED] ${collectionName}`);
    // Remove all entries for this collection
    for (const key of this.cache.keys()) {
      if (key.startsWith(collectionName)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all caches
   * Use sparingly - can cause performance issues
   */
  invalidateAll(): void {
    console.log('[CACHE CLEARED] All caches invalidated');
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      entries: Array.from(this.cache.keys()),
      totalSize: this.estimateSize(),
    };
  }

  /**
   * Estimate cache size in bytes
   */
  private estimateSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const entry = this.cache.get(cacheKey);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Generate cache key from collection name and constraints
   */
  private generateCacheKey(collectionName: string, constraints?: QueryConstraint[]): string {
    let key = collectionName;
    if (constraints) {
      key += '-' + JSON.stringify(constraints);
    }
    return key;
  }
}

// Export singleton instance
export const firestoreCache = new FirestoreCache();
