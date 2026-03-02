/**
 * Offline Storage Service using IndexedDB
 * Provides persistent offline data storage for AccreditEx PWA
 * 
 * Features:
 * - Persists critical app data to IndexedDB for offline access
 * - Queues offline mutations for background sync on reconnection
 * - Manages offline/online state transitions
 * - Compatible with existing firestoreCache.ts (complementary layer)
 * 
 * Architecture:
 * - firestoreCache.ts = in-memory cache (5-min TTL, fast, volatile)
 * - offlineStorage.ts = IndexedDB persistence (survives refresh/offline)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ─── Database Schema ─────────────────────────────────────────────
interface AccreditExDB extends DBSchema {
    /** Cached Firestore collection data for offline reading */
    cachedData: {
        key: string; // collectionName or composite key
        value: {
            id: string;
            collection: string;
            data: Record<string, unknown>;
            cachedAt: number;
        };
        indexes: {
            'by-collection': string;
            'by-cachedAt': number;
        };
    };
    /** Queued mutations made while offline — synced on reconnect */
    pendingSync: {
        key: number; // auto-increment
        value: {
            id?: number;
            collection: string;
            docId?: string;
            operation: 'create' | 'update' | 'delete';
            data: Record<string, unknown>;
            timestamp: number;
            retries: number;
        };
    };
    /** App metadata (last sync time, user preferences, etc.) */
    meta: {
        key: string;
        value: unknown;
    };
}

const DB_NAME = 'accreditex-offline';
const DB_VERSION = 1;

// ─── Database Initialization ─────────────────────────────────────
let dbInstance: IDBPDatabase<AccreditExDB> | null = null;

async function getDB(): Promise<IDBPDatabase<AccreditExDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<AccreditExDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Cached collection data store
            if (!db.objectStoreNames.contains('cachedData')) {
                const cachedStore = db.createObjectStore('cachedData', { keyPath: 'id' });
                cachedStore.createIndex('by-collection', 'collection');
                cachedStore.createIndex('by-cachedAt', 'cachedAt');
            }

            // Pending sync queue
            if (!db.objectStoreNames.contains('pendingSync')) {
                db.createObjectStore('pendingSync', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
            }

            // Metadata store
            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta');
            }
        },
    });

    return dbInstance;
}

// ─── Cached Data Operations ──────────────────────────────────────

/**
 * Store collection documents in IndexedDB for offline access.
 * Called after successful Firestore reads to persist data locally.
 */
export async function cacheCollectionData<T extends Record<string, unknown>>(
    collection: string,
    documents: T[],
): Promise<void> {
    try {
        const db = await getDB();
        const tx = db.transaction('cachedData', 'readwrite');
        const store = tx.objectStore('cachedData');
        const now = Date.now();

        for (const doc of documents) {
            const docId = (doc as { id?: string }).id;
            if (!docId) continue;

            await store.put({
                id: `${collection}/${docId}`,
                collection,
                data: doc,
                cachedAt: now,
            });
        }

        await tx.done;
    } catch (error) {
        // Silently fail — offline storage is enhancement, not critical
        console.warn('[OfflineStorage] Failed to cache data:', error);
    }
}

/**
 * Retrieve cached collection data from IndexedDB.
 * Used when the app is offline or as a fast initial load fallback.
 */
export async function getCachedCollectionData<T>(
    collection: string,
): Promise<T[]> {
    try {
        const db = await getDB();
        const index = db.transaction('cachedData', 'readonly')
            .objectStore('cachedData')
            .index('by-collection');

        const entries = await index.getAll(collection);
        return entries.map((entry) => entry.data as T);
    } catch (error) {
        console.warn('[OfflineStorage] Failed to read cached data:', error);
        return [];
    }
}

/**
 * Clear cached data for a specific collection (after invalidation).
 */
export async function clearCachedCollection(collection: string): Promise<void> {
    try {
        const db = await getDB();
        const tx = db.transaction('cachedData', 'readwrite');
        const store = tx.objectStore('cachedData');
        const index = store.index('by-collection');

        let cursor = await index.openCursor(collection);
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }

        await tx.done;
    } catch (error) {
        console.warn('[OfflineStorage] Failed to clear cached collection:', error);
    }
}

// ─── Pending Sync Queue ──────────────────────────────────────────

/**
 * Queue a mutation for later sync when the app is offline.
 * Returns the queued item's ID.
 */
export async function queueOfflineMutation(mutation: {
    collection: string;
    docId?: string;
    operation: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
}): Promise<number | undefined> {
    try {
        const db = await getDB();
        const id = await db.add('pendingSync', {
            ...mutation,
            timestamp: Date.now(),
            retries: 0,
        });
        console.log(`[OfflineStorage] Queued ${mutation.operation} for ${mutation.collection}/${mutation.docId || 'new'}`);
        return id as number;
    } catch (error) {
        console.warn('[OfflineStorage] Failed to queue mutation:', error);
        return undefined;
    }
}

/**
 * Get all pending sync operations, ordered by timestamp.
 */
export async function getPendingSyncQueue(): Promise<
    AccreditExDB['pendingSync']['value'][]
> {
    try {
        const db = await getDB();
        const items = await db.getAll('pendingSync');
        return items.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.warn('[OfflineStorage] Failed to read sync queue:', error);
        return [];
    }
}

/**
 * Remove a successfully synced item from the queue.
 */
export async function removeSyncedItem(id: number): Promise<void> {
    try {
        const db = await getDB();
        await db.delete('pendingSync', id);
    } catch (error) {
        console.warn('[OfflineStorage] Failed to remove synced item:', error);
    }
}

/**
 * Increment retry count for a failed sync item.
 */
export async function incrementSyncRetry(id: number): Promise<void> {
    try {
        const db = await getDB();
        const item = await db.get('pendingSync', id);
        if (item) {
            item.retries += 1;
            await db.put('pendingSync', item);
        }
    } catch (error) {
        console.warn('[OfflineStorage] Failed to increment retry:', error);
    }
}

/**
 * Clear the entire sync queue (e.g., after successful full sync).
 */
export async function clearSyncQueue(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear('pendingSync');
    } catch (error) {
        console.warn('[OfflineStorage] Failed to clear sync queue:', error);
    }
}

/**
 * Get the count of pending sync operations.
 */
export async function getPendingSyncCount(): Promise<number> {
    try {
        const db = await getDB();
        return await db.count('pendingSync');
    } catch (error) {
        return 0;
    }
}

// ─── Metadata Operations ─────────────────────────────────────────

export async function setMeta(key: string, value: unknown): Promise<void> {
    try {
        const db = await getDB();
        await db.put('meta', value, key);
    } catch (error) {
        console.warn('[OfflineStorage] Failed to set meta:', error);
    }
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
    try {
        const db = await getDB();
        return (await db.get('meta', key)) as T | undefined;
    } catch (error) {
        console.warn('[OfflineStorage] Failed to get meta:', error);
        return undefined;
    }
}

// ─── Cleanup ─────────────────────────────────────────────────────

/**
 * Remove cached data older than the specified age (in milliseconds).
 * Default: 7 days. Prevents IndexedDB from growing unbounded.
 */
export async function pruneOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
        const db = await getDB();
        const tx = db.transaction('cachedData', 'readwrite');
        const store = tx.objectStore('cachedData');
        const index = store.index('by-cachedAt');
        const cutoff = Date.now() - maxAgeMs;

        let deleted = 0;
        let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
        while (cursor) {
            await cursor.delete();
            deleted++;
            cursor = await cursor.continue();
        }

        await tx.done;
        if (deleted > 0) {
            console.log(`[OfflineStorage] Pruned ${deleted} old cache entries`);
        }
        return deleted;
    } catch (error) {
        console.warn('[OfflineStorage] Failed to prune cache:', error);
        return 0;
    }
}
