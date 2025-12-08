/**
 * Change Data Capture (CDC) Service
 * Tracks data modifications and syncs only delta changes
 * Improves sync efficiency by reducing data transfer
 */

import { FHIRResource } from '../types';

interface ChangeRecord {
  id: string;
  resourceType: string;
  resourceId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: Date;
  previousValue?: FHIRResource;
  newValue?: FHIRResource;
  changeHash: string;
  synced: boolean;
  syncedAt?: Date;
}

interface DeltaChange {
  field: string;
  previousValue: any;
  newValue: any;
  type: 'value' | 'array' | 'object';
}

export class ChangeDataCaptureService {
  private changeLog: ChangeRecord[] = [];
  private changeSnapshots: Map<string, FHIRResource> = new Map(); // For change detection
  private maxChangeLogSize: number = 10000;
  private enablePersistence: boolean = true;

  constructor(enablePersistence: boolean = true) {
    this.enablePersistence = enablePersistence;
    if (enablePersistence) {
      this.loadChangeLog();
    }
  }

  /**
   * Record a create operation
   */
  recordCreate(resource: FHIRResource): ChangeRecord {
    const changeRecord: ChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceType: resource.resourceType,
      resourceId: resource.id || 'unknown',
      operation: 'create',
      timestamp: new Date(),
      newValue: this.deepClone(resource),
      changeHash: this.generateHash(resource),
      synced: false,
    };

    this.changeLog.push(changeRecord);
    this.changeSnapshots.set(`${resource.resourceType}:${resource.id}`, this.deepClone(resource));

    this.maintainChangeLog();
    this.saveChangeLog();

    return changeRecord;
  }

  /**
   * Record an update operation
   * Automatically detects the delta by comparing with previous snapshot
   */
  recordUpdate(resource: FHIRResource): ChangeRecord {
    const snapshotKey = `${resource.resourceType}:${resource.id}`;
    const previousValue = this.changeSnapshots.get(snapshotKey);

    const changeRecord: ChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceType: resource.resourceType,
      resourceId: resource.id || 'unknown',
      operation: 'update',
      timestamp: new Date(),
      previousValue: previousValue ? this.deepClone(previousValue) : undefined,
      newValue: this.deepClone(resource),
      changeHash: this.generateHash(resource),
      synced: false,
    };

    this.changeLog.push(changeRecord);
    this.changeSnapshots.set(snapshotKey, this.deepClone(resource));

    this.maintainChangeLog();
    this.saveChangeLog();

    return changeRecord;
  }

  /**
   * Record a delete operation
   */
  recordDelete(resource: FHIRResource): ChangeRecord {
    const snapshotKey = `${resource.resourceType}:${resource.id}`;
    const previousValue = this.changeSnapshots.get(snapshotKey);

    const changeRecord: ChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceType: resource.resourceType,
      resourceId: resource.id || 'unknown',
      operation: 'delete',
      timestamp: new Date(),
      previousValue: previousValue ? this.deepClone(previousValue) : this.deepClone(resource),
      changeHash: this.generateHash(resource),
      synced: false,
    };

    this.changeLog.push(changeRecord);
    this.changeSnapshots.delete(snapshotKey);

    this.maintainChangeLog();
    this.saveChangeLog();

    return changeRecord;
  }

  /**
   * Get unsynchronized changes
   */
  getUnsyncedChanges(resourceType?: string, limit?: number): ChangeRecord[] {
    let changes = this.changeLog.filter((c) => !c.synced);

    if (resourceType) {
      changes = changes.filter((c) => c.resourceType === resourceType);
    }

    if (limit) {
      changes = changes.slice(0, limit);
    }

    return changes;
  }

  /**
   * Mark changes as synced
   */
  markAsSynced(changeIds: string[], syncedAt: Date = new Date()): number {
    let markedCount = 0;

    for (const id of changeIds) {
      const change = this.changeLog.find((c) => c.id === id);
      if (change) {
        change.synced = true;
        change.syncedAt = syncedAt;
        markedCount++;
      }
    }

    if (markedCount > 0) {
      this.saveChangeLog();
    }

    return markedCount;
  }

  /**
   * Get delta changes between two versions
   */
  getDeltaChanges(previousResource: FHIRResource, newResource: FHIRResource): DeltaChange[] {
    const deltas: DeltaChange[] = [];
    const allKeys = new Set([
      ...Object.keys(previousResource),
      ...Object.keys(newResource),
    ]);

    for (const key of allKeys) {
      if (key === 'meta' || key === 'id' || key === 'resourceType') {
        // Skip metadata and identifiers
        continue;
      }

      const prevValue = (previousResource as any)[key];
      const newValue = (newResource as any)[key];

      if (this.isDifferent(prevValue, newValue)) {
        deltas.push({
          field: key,
          previousValue: prevValue,
          newValue: newValue,
          type: Array.isArray(newValue) ? 'array' : typeof newValue === 'object' ? 'object' : 'value',
        });
      }
    }

    return deltas;
  }

  /**
   * Apply delta changes to a resource
   */
  applyDeltaChanges(resource: FHIRResource, deltas: DeltaChange[]): FHIRResource {
    const result = this.deepClone(resource);

    for (const delta of deltas) {
      (result as any)[delta.field] = delta.newValue;
    }

    // Update metadata
    if (!result.meta) {
      result.meta = {};
    }
    result.meta.lastUpdated = new Date().toISOString();
    result.meta.versionId = `v${Date.now()}`;

    return result;
  }

  /**
   * Compact change log by consolidating multiple changes to same resource
   */
  compactChangeLog(): number {
    const resourceMap = new Map<string, ChangeRecord>();
    const newLog: ChangeRecord[] = [];

    // Group changes by resource
    for (const change of this.changeLog) {
      const key = `${change.resourceType}:${change.resourceId}`;

      if (change.operation === 'delete') {
        // Delete removes all previous changes for this resource
        resourceMap.delete(key);
        newLog.push(change);
      } else {
        const existing = resourceMap.get(key);

        if (existing) {
          // Merge with existing change
          if (change.operation === 'create' && existing.operation === 'create') {
            // Two creates - keep first
            continue;
          } else if (change.operation === 'update') {
            if (existing.operation === 'create') {
              // create then update - keep as single create with latest value
              existing.newValue = change.newValue;
              existing.changeHash = change.changeHash;
            } else {
              // update then update - merge the deltas
              existing.newValue = change.newValue;
              existing.changeHash = change.changeHash;
            }
          }
        } else {
          // New resource
          resourceMap.set(key, this.deepClone(change));
          newLog.push(change);
        }
      }
    }

    const originalSize = this.changeLog.length;
    this.changeLog = newLog;
    this.saveChangeLog();

    return originalSize - this.changeLog.length;
  }

  /**
   * Get change statistics
   */
  getStatistics() {
    const all = this.changeLog;
    const synced = all.filter((c) => c.synced);
    const unsynced = all.filter((c) => !c.synced);

    return {
      totalChanges: all.length,
      syncedChanges: synced.length,
      unsyncedChanges: unsynced.length,
      creates: all.filter((c) => c.operation === 'create').length,
      updates: all.filter((c) => c.operation === 'update').length,
      deletes: all.filter((c) => c.operation === 'delete').length,
      byResourceType: this.groupBy(all, 'resourceType').map(([type, changes]) => ({
        type,
        count: changes.length,
        synced: changes.filter((c) => c.synced).length,
      })),
    };
  }

  /**
   * Clear change log (use with caution!)
   */
  clearChangeLog(beforeDate?: Date): number {
    const originalSize = this.changeLog.length;

    if (beforeDate) {
      this.changeLog = this.changeLog.filter((c) => c.timestamp >= beforeDate);
    } else {
      this.changeLog = [];
      this.changeSnapshots.clear();
    }

    this.saveChangeLog();
    return originalSize - this.changeLog.length;
  }

  /**
   * Export change log for audit/compliance
   */
  exportChangeLog(filter?: { resourceType?: string; from?: Date; to?: Date }): ChangeRecord[] {
    let changes = this.changeLog;

    if (filter?.resourceType) {
      changes = changes.filter((c) => c.resourceType === filter.resourceType);
    }

    if (filter?.from) {
      changes = changes.filter((c) => c.timestamp >= filter.from!);
    }

    if (filter?.to) {
      changes = changes.filter((c) => c.timestamp <= filter.to!);
    }

    return changes;
  }

  /**
   * Generate hash for change detection
   */
  private generateHash(data: any): string {
    // Simple hash function - in production use crypto
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Check if two values are different
   */
  private isDifferent(val1: any, val2: any): boolean {
    if (val1 === val2) return false;

    if (typeof val1 !== typeof val2) return true;

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return true;
      return !val1.every((item, idx) => !this.isDifferent(item, val2[idx]));
    }

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) !== JSON.stringify(val2);
    }

    return val1 !== val2;
  }

  /**
   * Deep clone object
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }

    const cloned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Group array by property
   */
  private groupBy<T>(arr: T[], key: keyof T): Array<[string, T[]]> {
    const groups = new Map<string, T[]>();

    for (const item of arr) {
      const groupKey = String(item[key]);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }

    return Array.from(groups.entries());
  }

  /**
   * Maintain change log size
   */
  private maintainChangeLog(): void {
    if (this.changeLog.length > this.maxChangeLogSize) {
      // Remove oldest synced changes first
      const synced = this.changeLog.filter((c) => c.synced);
      if (synced.length > 0) {
        const toRemove = this.changeLog.length - this.maxChangeLogSize;
        this.changeLog = this.changeLog.slice(toRemove);
      }
    }
  }

  /**
   * Load change log from storage
   */
  private loadChangeLog(): void {
    try {
      const stored = localStorage.getItem('his_change_log');
      if (stored) {
        const parsed = JSON.parse(stored) as ChangeRecord[];
        this.changeLog = parsed.map((c) => ({
          ...c,
          timestamp: new Date(c.timestamp),
          syncedAt: c.syncedAt ? new Date(c.syncedAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('[CDC] Failed to load change log:', error);
    }
  }

  /**
   * Save change log to storage
   */
  private saveChangeLog(): void {
    if (!this.enablePersistence) return;

    try {
      // Keep only last 1000 changes to avoid storage limits
      const toStore = this.changeLog.slice(-1000);
      localStorage.setItem('his_change_log', JSON.stringify(toStore));
    } catch (error) {
      console.error('[CDC] Failed to save change log:', error);
    }
  }
}

// Singleton instance
export const changeDataCaptureService = new ChangeDataCaptureService();
