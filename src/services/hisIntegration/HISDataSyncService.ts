/**
 * HIS Data Sync Service
 * Manages bidirectional data synchronization between AccreditEx and HIS systems
 * Implements retry logic, conflict detection, and progress tracking
 */

import { HISConfig, FHIRResource, SyncResult, SyncStatus } from './types';
import { ConnectorFactory } from './integrations/ConnectorFactory';
import { useHISIntegrationStore } from '../../stores/useHISIntegrationStore';
import { HISErrorHandler } from './integrations/ErrorHandler';

interface SyncTask {
  id: string;
  configId: string;
  resourceType: string;
  direction: 'pull' | 'push' | 'bidirectional';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  status: SyncStatus;
  errors: Array<{ message: string; resource?: string }>;
}

interface SyncBatch {
  resources: FHIRResource[];
  cursor?: string; // For pagination
  hasMore: boolean;
}

interface DataMapping {
  resourceType: string;
  localField: string;
  remoteField: string;
  transformFn?: (value: any) => any;
  reverseTransformFn?: (value: any) => any;
}

export class HISDataSyncService {
  private activeSyncs: Map<string, SyncTask> = new Map();
  private syncHistory: SyncTask[] = [];
  private batchSize: number = 100;
  private maxRetries: number = 3;
  private retryBaseDelay: number = 1000; // milliseconds

  constructor() {
    this.loadSyncHistory();
  }

  /**
   * Start a sync operation for a specific HIS configuration
   */
  async startSync(
    configId: string,
    resourceType: string,
    direction: 'pull' | 'push' | 'bidirectional' = 'bidirectional',
    filters?: Record<string, string>
  ): Promise<SyncResult> {
    const store = useHISIntegrationStore();
    const config = store.configurations.find((c) => c.id === configId);

    if (!config) {
      return {
        hisId: configId,
        resourceType,
        startTime: new Date(),
        endTime: new Date(),
        recordCount: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
        status: SyncStatus.ERROR,
      };
    }

    if (!config.enabled) {
      return {
        hisId: configId,
        resourceType,
        startTime: new Date(),
        endTime: new Date(),
        recordCount: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
        status: SyncStatus.ERROR,
      };
    }

    const syncTask: SyncTask = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configId,
      resourceType,
      direction,
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      status: SyncStatus.SYNCING,
      errors: [],
    };

    this.activeSyncs.set(syncTask.id, syncTask);

    try {
      store.startSync(configId);

      let recordCount = 0;
      let errorCount = 0;
      const syncErrors: Array<{ timestamp: Date; resource: string; error: string; recoverable: boolean }> = [];

      if (direction === 'pull' || direction === 'bidirectional') {
        const pullResult = await this.pullData(config, resourceType, filters, syncTask);
        recordCount += pullResult.recordCount;
        errorCount += pullResult.errorCount;
        syncErrors.push(...pullResult.errors);
      }

      if (direction === 'push' || direction === 'bidirectional') {
        const pushResult = await this.pushData(config, resourceType, syncTask);
        recordCount += pushResult.recordCount;
        errorCount += pushResult.errorCount;
        syncErrors.push(...pushResult.errors);
      }

      syncTask.status = errorCount === 0 ? SyncStatus.SUCCESS : SyncStatus.ERROR;
      syncTask.endTime = new Date();
      syncTask.recordsProcessed = recordCount;
      syncTask.recordsSuccessful = recordCount - errorCount;
      syncTask.recordsFailed = errorCount;

      // Log sync completion
      store.addLog({
        hisId: configId,
        hisName: config.name,
        action: 'sync_complete',
        status: syncTask.status === SyncStatus.SUCCESS ? 'success' : 'error',
        resourceType,
        recordCount: recordCount,
        message: `Sync completed for ${resourceType}`,
      });

      this.syncHistory.push(syncTask);
      return {
        hisId: configId,
        resourceType,
        startTime: syncTask.startTime,
        endTime: syncTask.endTime,
        recordCount,
        successCount: recordCount - errorCount,
        errorCount,
        errors: syncErrors,
        status: syncTask.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      syncTask.status = SyncStatus.ERROR;
      syncTask.endTime = new Date();
      syncTask.errors.push({ message: errorMessage });

      store.addLog({
        hisId: configId,
        hisName: config.name,
        action: 'sync_error',
        status: 'error',
        resourceType,
        message: `Sync failed: ${errorMessage}`,
      });

      this.syncHistory.push(syncTask);
      return {
        hisId: configId,
        resourceType,
        startTime: syncTask.startTime,
        endTime: new Date(),
        recordCount: syncTask.recordsProcessed,
        successCount: syncTask.recordsSuccessful,
        errorCount: syncTask.recordsFailed,
        errors: syncTask.errors.map(e => ({
          timestamp: new Date(),
          resource: '',
          error: e.message,
          recoverable: false,
        })),
        status: SyncStatus.ERROR,
      };
    } finally {
      store.stopSync(configId);
      this.activeSyncs.delete(syncTask.id);
    }
  }

  /**
   * Pull data from HIS to local system
   */
  private async pullData(
    config: HISConfig,
    resourceType: string,
    filters: Record<string, string> | undefined,
    syncTask: SyncTask
  ): Promise<SyncResult> {
    const startTime = new Date();
    let recordCount = 0;
    let errorCount = 0;
    const syncErrors: Array<{ timestamp: Date; resource: string; error: string; recoverable: boolean }> = [];

    try {
      const connector = ConnectorFactory.createConnector(config);
      await connector.connect();

      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const batch = await this.fetchDataBatch(
          connector,
          resourceType,
          filters,
          cursor,
          this.batchSize
        );

        for (const resource of batch.resources) {
          try {
            // Store the resource locally (implement based on your persistence layer)
            await this.storeLocalResource(resource);
            syncTask.recordsProcessed++;
            recordCount++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            syncErrors.push({
              timestamp: new Date(),
              resource: resource.id || 'unknown',
              error: errorMsg,
              recoverable: true,
            });
            syncTask.recordsFailed++;
            errorCount++;
          }
        }

        cursor = batch.cursor;
        hasMore = batch.hasMore;
      }

      await connector.disconnect();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      syncErrors.push({
        timestamp: new Date(),
        resource: resourceType,
        error: errorMsg,
        recoverable: false,
      });
    }

    return {
      hisId: config.id,
      resourceType,
      startTime,
      endTime: new Date(),
      recordCount,
      successCount: recordCount - errorCount,
      errorCount,
      errors: syncErrors,
      status: errorCount === 0 ? SyncStatus.SUCCESS : SyncStatus.ERROR,
    };
  }

  /**
   * Push data from local system to HIS
   */
  private async pushData(
    config: HISConfig,
    resourceType: string,
    syncTask: SyncTask
  ): Promise<SyncResult> {
    const startTime = new Date();
    let recordCount = 0;
    let errorCount = 0;
    const syncErrors: Array<{ timestamp: Date; resource: string; error: string; recoverable: boolean }> = [];

    try {
      const connector = ConnectorFactory.createConnector(config);
      await connector.connect();

      // Get local resources to push (implement based on your data model)
      const localResources = await this.getLocalResourcesToPush(resourceType);

      for (const resource of localResources) {
        try {
          const retryResult = await this.sendWithRetry(connector, resource, this.maxRetries);

          if (retryResult.success) {
            syncTask.recordsProcessed++;
            recordCount++;
          } else {
            syncErrors.push({
              timestamp: new Date(),
              resource: resource.id || 'unknown',
              error: retryResult.message,
              recoverable: true,
            });
            syncTask.recordsFailed++;
            errorCount++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          syncErrors.push({
            timestamp: new Date(),
            resource: resource.id || 'unknown',
            error: errorMsg,
            recoverable: true,
          });
          syncTask.recordsFailed++;
          errorCount++;
        }
      }

      await connector.disconnect();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      syncErrors.push({
        timestamp: new Date(),
        resource: resourceType,
        error: errorMsg,
        recoverable: false,
      });
    }

    return {
      hisId: config.id,
      resourceType,
      startTime,
      endTime: new Date(),
      recordCount,
      successCount: recordCount - errorCount,
      errorCount,
      errors: syncErrors,
      status: errorCount === 0 ? SyncStatus.SUCCESS : SyncStatus.ERROR,
    };
  }

  /**
   * Fetch data in batches with retry logic
   */
  private async fetchDataBatch(
    connector: any,
    resourceType: string,
    filters: Record<string, string> | undefined,
    cursor: string | undefined,
    batchSize: number
  ): Promise<SyncBatch> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const resources = await connector.fetchData(resourceType, {
          ...filters,
          _count: batchSize.toString(),
          ...(cursor ? { _cursor: cursor } : {}),
        });

        return {
          resources: Array.isArray(resources) ? resources : [resources],
          hasMore: resources.length === batchSize,
          cursor: resources.length > 0 ? resources[resources.length - 1].id : undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = HISErrorHandler.getRetryDelay(attempt, this.retryBaseDelay);
        attempt++;

        if (attempt < this.maxRetries) {
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Failed to fetch data after retries');
  }

  /**
   * Send resource with exponential backoff retry
   */
  private async sendWithRetry(
    connector: any,
    resource: FHIRResource,
    maxRetries: number
  ): Promise<{ success: boolean; message: string; resourceId?: string }> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const resourceId = await connector.sendData(resource);
        return {
          success: true,
          message: `Resource sent successfully`,
          resourceId,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is recoverable
        if (HISErrorHandler.isRecoverable(lastError) && attempt < maxRetries - 1) {
          const delay = HISErrorHandler.getRetryDelay(attempt, this.retryBaseDelay);
          attempt++;
          await this.delay(delay);
        } else {
          break;
        }
      }
    }

    return {
      success: false,
      message: lastError?.message || 'Failed to send resource after retries',
    };
  }

  /**
   * Detect conflicts between local and remote resources
   */
  async detectConflicts(
    configId: string,
    resourceType: string
  ): Promise<Array<{ localResource: FHIRResource; remoteResource: FHIRResource }>> {
    const config = useHISIntegrationStore().configurations.find((c) => c.id === configId);
    if (!config) return [];

    const conflicts: Array<{ localResource: FHIRResource; remoteResource: FHIRResource }> = [];

    try {
      const connector = ConnectorFactory.createConnector(config);
      await connector.connect();

      const localResources = await this.getLocalResources(resourceType);
      const remoteResources = await connector.fetchData(resourceType);

      for (const localRes of localResources) {
        const remoteRes = remoteResources.find((r) => r.id === localRes.id);

        if (remoteRes) {
          // Compare last updated timestamps
          const localUpdated = new Date(localRes.meta?.lastUpdated || 0);
          const remoteUpdated = new Date(remoteRes.meta?.lastUpdated || 0);

          if (localUpdated !== remoteUpdated && this.hasSignificantDifferences(localRes, remoteRes)) {
            conflicts.push({ localResource: localRes, remoteResource: remoteRes });
          }
        }
      }

      await connector.disconnect();
    } catch (error) {
      // Log error but don't throw - conflict detection is non-critical
      console.error('Conflict detection failed:', error);
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using a resolution strategy
   */
  async resolveConflict(
    localResource: FHIRResource,
    remoteResource: FHIRResource,
    strategy: 'local' | 'remote' | 'merge' = 'merge'
  ): Promise<FHIRResource> {
    switch (strategy) {
      case 'local':
        return localResource;

      case 'remote':
        return remoteResource;

      case 'merge':
        return this.mergeResources(localResource, remoteResource);

      default:
        return localResource;
    }
  }

  /**
   * Merge two conflicting resources
   */
  private mergeResources(local: FHIRResource, remote: FHIRResource): FHIRResource {
    const merged: FHIRResource = {
      ...local,
      ...remote,
      id: local.id,
      meta: {
        ...local.meta,
        lastUpdated: new Date().toISOString(),
        versionId: `merged-${Date.now()}`,
      },
    };

    // Merge arrays (extensions, identifiers, etc.) taking unique values
    const mergeArrays = (localArr: any[] | undefined, remoteArr: any[] | undefined) => {
      if (!localArr) return remoteArr;
      if (!remoteArr) return localArr;

      const merged = [...localArr];
      for (const item of remoteArr) {
        if (!merged.some((m) => JSON.stringify(m) === JSON.stringify(item))) {
          merged.push(item);
        }
      }
      return merged;
    };

    // Merge complex fields
    if (local.extension || remote.extension) {
      merged.extension = mergeArrays(local.extension, remote.extension);
    }

    return merged;
  }

  /**
   * Check if resources have significant differences
   */
  private hasSignificantDifferences(res1: FHIRResource, res2: FHIRResource): boolean {
    // Ignore metadata-only changes
    const { meta: _, ...res1Copy } = res1;
    const { meta: __, ...res2Copy } = res2;

    return JSON.stringify(res1Copy) !== JSON.stringify(res2Copy);
  }

  /**
   * Get local resources (implement based on your persistence layer)
   */
  private async getLocalResources(resourceType: string): Promise<FHIRResource[]> {
    // TODO: Implement based on your local data storage
    // This should query your database/store for resources of a specific type
    return [];
  }

  /**
   * Get local resources that need to be pushed (with pending/modified flag)
   */
  private async getLocalResourcesToPush(resourceType: string): Promise<FHIRResource[]> {
    // TODO: Implement based on your persistence layer
    // Filter for resources with pending=true or modified=true
    return [];
  }

  /**
   * Store a resource locally (implement based on your persistence layer)
   */
  private async storeLocalResource(resource: FHIRResource): Promise<void> {
    // TODO: Implement based on your local storage
    // This should save the resource to your database/store
  }

  /**
   * Get sync status for a configuration
   */
  getSyncStatus(configId: string) {
    const activeSyncs = Array.from(this.activeSyncs.values()).filter(
      (s) => s.configId === configId
    );

    const recentSyncs = this.syncHistory
      .filter((s) => s.configId === configId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    return {
      activeSyncs,
      recentSyncs,
      totalSyncs: this.syncHistory.filter((s) => s.configId === configId).length,
    };
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics(configId?: string) {
    const syncs = configId
      ? this.syncHistory.filter((s) => s.configId === configId)
      : this.syncHistory;

    return {
      totalSyncs: syncs.length,
      successfulSyncs: syncs.filter((s) => s.status === 'success').length,
      failedSyncs: syncs.filter((s) => s.status === 'error').length,
      totalRecordsProcessed: syncs.reduce((sum, s) => sum + s.recordsProcessed, 0),
      totalRecordsSuccessful: syncs.reduce((sum, s) => sum + s.recordsSuccessful, 0),
      totalRecordsFailed: syncs.reduce((sum, s) => sum + s.recordsFailed, 0),
      avgSyncDuration: syncs.length
        ? syncs.reduce((sum, s) => sum + (s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0), 0) / syncs.length
        : 0,
    };
  }

  /**
   * Pause active sync
   */
  pauseSync(syncId: string): boolean {
    const syncTask = this.activeSyncs.get(syncId);
    if (syncTask) {
      syncTask.status = SyncStatus.PAUSED;
      return true;
    }
    return false;
  }

  /**
   * Cancel active sync
   */
  cancelSync(syncId: string): boolean {
    const syncTask = this.activeSyncs.get(syncId);
    if (syncTask) {
      syncTask.status = SyncStatus.ERROR;
      syncTask.endTime = new Date();
      this.activeSyncs.delete(syncId);
      this.syncHistory.push(syncTask);
      return true;
    }
    return false;
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Load sync history from storage
   */
  private loadSyncHistory(): void {
    try {
      const stored = localStorage.getItem('his_sync_history');
      if (stored) {
        const parsed = JSON.parse(stored) as Array<SyncTask>;
        this.syncHistory = parsed.map((s) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  }

  /**
   * Save sync history to storage
   */
  private saveSyncHistory(): void {
    try {
      // Keep only last 100 syncs to avoid storage limits
      const toStore = this.syncHistory.slice(-100);
      localStorage.setItem('his_sync_history', JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }
}

// Singleton instance
export const hisDataSyncService = new HISDataSyncService();
