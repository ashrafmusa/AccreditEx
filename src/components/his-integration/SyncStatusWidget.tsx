/**
 * Sync Status Widget
 * Displays real-time sync status and health indicators for HIS integrations
 */

import React, { useEffect, useState } from 'react';
import { useHISIntegrationStore } from '@/stores/useHISIntegrationStore';
import { HISConfig, SyncStatus } from '@/services/hisIntegration/types';
import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon, SparklesIcon } from '@/components/icons';

interface SyncStatusWidgetProps {
  configId?: string;
  compact?: boolean;
}

const SyncStatusWidget: React.FC<SyncStatusWidgetProps> = ({ configId, compact = false }) => {
  const store = useHISIntegrationStore();
  const [statusInfo, setStatusInfo] = useState<Record<string, any>>({});

  const configurations = configId
    ? store.configurations.filter((c) => c.id === configId)
    : store.configurations;

  useEffect(() => {
    // Update status info periodically
    const interval = setInterval(() => {
      const newStatusInfo: Record<string, any> = {};

      configurations.forEach((config) => {
        const isSyncing = store.isSyncing(config.id);
        const logs = store.getLogs(config.id).slice(0, 10);
        const lastLog = logs[0];
        const stats = store.getConfigurationStats();

        newStatusInfo[config.id] = {
          isSyncing,
          lastLog,
          stats,
          logs,
        };
      });

      setStatusInfo(newStatusInfo);
    }, 2000);

    return () => clearInterval(interval);
  }, [configurations, store]);

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'syncing':
        return 'text-blue-600 dark:text-blue-400';
      case 'paused':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBgColor = (status: SyncStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900';
      case 'error':
        return 'bg-red-100 dark:bg-red-900';
      case 'syncing':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5" />;
      case 'syncing':
        return <SparklesIcon className="h-5 w-5 animate-spin" />;
      case 'paused':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((d.getTime() - Date.now()) / 1000),
      'second'
    );
  };

  if (configurations.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 text-center">
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
          No HIS configurations available
        </p>
      </div>
    );
  }

  if (compact) {
    // Compact view - status overview
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configurations.map((config) => {
          const info = statusInfo[config.id];
          const status = info?.lastLog?.status || 'idle';

          return (
            <div
              key={config.id}
              className={`rounded-lg border ${getStatusBgColor(status as SyncStatus)} p-4`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {config.name}
                  </h3>
                  <p className={`text-sm font-medium flex items-center space-x-1 mt-2 ${getStatusColor(status as SyncStatus)}`}>
                    {getStatusIcon(status as SyncStatus)}
                    <span className="capitalize">{status}</span>
                  </p>
                </div>
              </div>

              {info?.stats && (
                <div className="mt-3 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary space-y-1">
                  <p>Syncs: {info.stats.totalSyncs}</p>
                  <p>Errors: {info.stats.totalErrors}</p>
                  {info.lastLog?.timestamp && (
                    <p>Last: {formatDate(info.lastLog.timestamp)}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full view - detailed status
  return (
    <div className="space-y-4">
      {configurations.map((config) => {
        const info = statusInfo[config.id];
        const status = info?.lastLog?.status || 'idle';
        const logs = info?.logs || [];

        return (
          <div
            key={config.id}
            className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {config.name}
                </h3>
                <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                  {config.baseUrl}
                </p>
              </div>

              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusBgColor(status as SyncStatus)}`}>
                {getStatusIcon(status as SyncStatus)}
                <span className={`text-sm font-medium capitalize ${getStatusColor(status as SyncStatus)}`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Stats */}
            {info?.stats && (
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">Total Syncs</p>
                  <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {info.stats.totalSyncs}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">Success</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {info.stats.successfulSyncs}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">Errors</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {info.stats.totalErrors}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {logs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  Recent Activity
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {logs.map((log: any) => (
                    <div
                      key={log.id}
                      className={`text-xs p-2 rounded ${
                        log.status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : log.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          : 'bg-gray-50 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="text-xs opacity-70">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      {log.message && <p className="mt-1">{log.message}</p>}
                      {log.recordCount !== undefined && (
                        <p className="mt-1">Records: {log.recordCount}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {logs.length === 0 && (
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary text-center py-4">
                No activity yet
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SyncStatusWidget;
