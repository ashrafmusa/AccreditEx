/**
 * HIS Integration React Hooks
 * Provides React hooks for easy integration with HIS sync services
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HISDataSyncService } from '../services/hisIntegration/HISDataSyncService';
import { HISSyncScheduler } from '../services/hisIntegration/HISSyncScheduler';
import { useHISIntegrationStore } from '../stores/useHISIntegrationStore';
import { SyncStatusInfo, SyncError } from '../services/hisIntegration/types';

/**
 * Hook for syncing HIS data
 */
export function useSync(configId: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const syncServiceRef = useRef<HISDataSyncService | null>(null);

  useEffect(() => {
    if (!syncServiceRef.current) {
      syncServiceRef.current = new HISDataSyncService();
    }
  }, []);

  const startSync = useCallback(async () => {
    if (!syncServiceRef.current || !configId) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncProgress(0);

    try {
      const result = await syncServiceRef.current.startSync(configId);
      setLastSyncTime(new Date());
      setSyncProgress(100);

      return result;
    } catch (error) {
      const syncErr = error as SyncError;
      setSyncError(syncErr);
      console.error('[useSync] Sync failed:', syncErr);
    } finally {
      setIsSyncing(false);
    }
  }, [configId]);

  const stopSync = useCallback(async () => {
    if (!syncServiceRef.current || !configId) return;

    try {
      await syncServiceRef.current.stopSync(configId);
      setIsSyncing(false);
    } catch (error) {
      console.error('[useSync] Failed to stop sync:', error);
    }
  }, [configId]);

  return {
    isSyncing,
    syncProgress,
    lastSyncTime,
    syncError,
    startSync,
    stopSync,
  };
}

/**
 * Hook for managing sync schedules
 */
export function useSyncSchedule() {
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, any>>({});
  const schedulerRef = useRef<HISSyncScheduler | null>(null);

  useEffect(() => {
    if (!schedulerRef.current) {
      schedulerRef.current = new HISSyncScheduler();
    }
  }, []);

  const scheduleSync = useCallback(
    (configId: string, pattern: string) => {
      if (!schedulerRef.current) return null;

      const job = {
        configId,
        pattern,
      };

      const jobId = schedulerRef.current.schedule(job, pattern);
      updateScheduledJobs();

      return jobId;
    },
    []
  );

  const unscheduleSync = useCallback((jobId: string) => {
    if (!schedulerRef.current) return false;

    const result = schedulerRef.current.unschedule(jobId);
    updateScheduledJobs();

    return result;
  }, []);

  const pauseJob = useCallback((jobId: string) => {
    if (!schedulerRef.current) return false;

    const result = schedulerRef.current.pauseJob(jobId);
    updateJobStatuses();

    return result;
  }, []);

  const resumeJob = useCallback((jobId: string) => {
    if (!schedulerRef.current) return false;

    const result = schedulerRef.current.resumeJob(jobId);
    updateJobStatuses();

    return result;
  }, []);

  const getUpcomingRuns = useCallback((count: number = 10) => {
    if (!schedulerRef.current) return [];

    return schedulerRef.current.getUpcomingRuns(count);
  }, []);

  const updateScheduledJobs = useCallback(() => {
    if (schedulerRef.current) {
      const jobs = schedulerRef.current.getScheduledJobs();
      setScheduledJobs(jobs);
    }
  }, []);

  const updateJobStatuses = useCallback(() => {
    if (schedulerRef.current) {
      const jobs = schedulerRef.current.getScheduledJobs();
      const statuses: Record<string, any> = {};

      for (const job of jobs) {
        statuses[job.id] = schedulerRef.current.getJobStatus(job.id);
      }

      setJobStatuses(statuses);
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    updateScheduledJobs();
    updateJobStatuses();

    const interval = setInterval(() => {
      updateJobStatuses();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateScheduledJobs, updateJobStatuses]);

  return {
    scheduledJobs,
    jobStatuses,
    scheduleSync,
    unscheduleSync,
    pauseJob,
    resumeJob,
    getUpcomingRuns,
  };
}

/**
 * Hook for accessing sync history and logs
 */
export function useSyncHistory(configId?: string) {
  const store = useHISIntegrationStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'status'>('timestamp');

  useEffect(() => {
    if (configId) {
      const config = store.configurations.find((c) => c.id === configId);
      if (config) {
        const configLogs = store.getLogs(configId);
        setLogs(configLogs);
      }
    } else {
      setLogs(store.integrationLogs);
    }
  }, [configId, store]);

  useEffect(() => {
    let filtered = logs;

    if (filterStatus) {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    if (sortBy === 'timestamp') {
      filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'status') {
      filtered = filtered.sort((a, b) => a.status.localeCompare(b.status));
    }

    setFilteredLogs(filtered);
  }, [logs, filterStatus, sortBy]);

  const clearLogs = useCallback(() => {
    if (configId) {
      store.clearLogs(configId);
    } else {
      // Clear all logs
      for (const config of store.configurations) {
        store.clearLogs(config.id);
      }
    }
    setLogs([]);
  }, [configId, store]);

  const getLogStats = useCallback(() => {
    if (configId) {
      return store.getLogStats(configId);
    }

    // Calculate aggregate stats
    let successCount = 0;
    let errorCount = 0;
    let totalDuration = 0;

    for (const log of logs) {
      if (log.status === 'success') successCount++;
      if (log.status === 'error') errorCount++;
      totalDuration += log.duration || 0;
    }

    return {
      totalLogs: logs.length,
      successCount,
      errorCount,
      averageDuration: logs.length > 0 ? Math.round(totalDuration / logs.length) : 0,
    };
  }, [configId, logs, store]);

  return {
    logs: filteredLogs,
    totalLogs: logs.length,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    clearLogs,
    getLogStats,
  };
}

/**
 * Hook for sync status monitoring
 */
export function useSyncStatus(configId: string) {
  const store = useHISIntegrationStore();
  const [status, setStatus] = useState<SyncStatusInfo | null>(null);

  useEffect(() => {
    const config = store.configurations.find((c) => c.id === configId);
    if (config) {
      setStatus(store.getSyncStatus(configId) as SyncStatusInfo);
    }

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      const config = store.configurations.find((c) => c.id === configId);
      if (config) {
        setStatus(store.getSyncStatus(configId) as SyncStatusInfo);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [configId, store]);

  return status;
}

/**
 * Hook for conflict detection and resolution
 */
export function useConflictResolution(configId: string) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const syncServiceRef = useRef<HISDataSyncService | null>(null);

  useEffect(() => {
    if (!syncServiceRef.current) {
      syncServiceRef.current = new HISDataSyncService();
    }
  }, []);

  const resolveConflict = useCallback(
    async (conflictId: string, strategy: 'last-write-wins' | 'merge' | 'manual', resolution?: any) => {
      if (!syncServiceRef.current) return false;

      setResolving(true);

      try {
        const result = await syncServiceRef.current.resolveConflict(conflictId, strategy);

        // Remove resolved conflict
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

        return result;
      } catch (error) {
        console.error('[useConflictResolution] Resolution failed:', error);
        return false;
      } finally {
        setResolving(false);
      }
    },
    []
  );

  return {
    conflicts,
    resolving,
    resolveConflict,
  };
}

/**
 * Hook for sync performance metrics
 */
export function useSyncMetrics(configId?: string) {
  const store = useHISIntegrationStore();
  const [metrics, setMetrics] = useState({
    successRate: 0,
    averageSyncTime: 0,
    totalSyncsCompleted: 0,
    recentErrors: 0,
  });

  useEffect(() => {
    if (configId) {
      const stats = store.getLogStats(configId);
      const logs = store.getLogs(configId);

      const successCount = logs.filter((l) => l.status === 'success').length;
      const errorCount = logs.filter((l) => l.status === 'error').length;
      const totalDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
      const recentErrors = logs.filter((l) => l.status === 'error' && new Date(l.timestamp).getTime() > Date.now() - 3600000).length;

      setMetrics({
        successRate: logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0,
        averageSyncTime: logs.length > 0 ? Math.round(totalDuration / logs.length) : 0,
        totalSyncsCompleted: successCount,
        recentErrors,
      });
    }
  }, [configId, store]);

  return metrics;
}

/**
 * Hook for bulk sync operations
 */
export function useBulkSync() {
  const store = useHISIntegrationStore();
  const [bulkSyncInProgress, setBulkSyncInProgress] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const syncServiceRef = useRef<HISDataSyncService | null>(null);

  useEffect(() => {
    if (!syncServiceRef.current) {
      syncServiceRef.current = new HISDataSyncService();
    }
  }, []);

  const syncAll = useCallback(async (parallel: boolean = false) => {
    if (!syncServiceRef.current) return;

    setBulkSyncInProgress(true);
    setBulkProgress(0);

    try {
      const configs = store.configurations.filter((c) => c.enabled !== false);
      let completed = 0;

      for (const config of configs) {
        await syncServiceRef.current.startSync(config.id);
        completed++;
        setBulkProgress(Math.round((completed / configs.length) * 100));
      }

      return { success: true, totalSynced: completed };
    } catch (error) {
      console.error('[useBulkSync] Bulk sync failed:', error);
      return { success: false, error };
    } finally {
      setBulkSyncInProgress(false);
      setBulkProgress(0);
    }
  }, [store]);

  return {
    bulkSyncInProgress,
    bulkProgress,
    syncAll,
  };
}
