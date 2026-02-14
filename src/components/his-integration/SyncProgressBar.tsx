/**
 * Sync Progress Bar Component
 * Shows real-time progress of HIS data synchronization
 */

import React, { useEffect, useState } from "react";
import { useSync } from "../../hooks/useHISIntegration";

interface SyncProgressBarProps {
  configId: string;
  autoStart?: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  showDetails?: boolean;
}

export function SyncProgressBar({
  configId,
  autoStart = false,
  onComplete,
  onError,
  showDetails = true,
}: SyncProgressBarProps) {
  const {
    isSyncing,
    syncProgress,
    lastSyncTime,
    syncError,
    startSync,
    stopSync,
  } = useSync(configId);
  const [isAutoStarting, setIsAutoStarting] = useState(autoStart);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
    number | null
  >(null);
  const [syncStartTime, setSyncStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isAutoStarting && !isSyncing) {
      handleStartSync();
      setIsAutoStarting(false);
    }
  }, [isAutoStarting]);

  useEffect(() => {
    if (isSyncing) {
      setSyncStartTime(new Date());
    } else if (syncStartTime && syncProgress === 100) {
      const duration = new Date().getTime() - syncStartTime.getTime();
      if (duration > 0) {
        setEstimatedTimeRemaining(0);
      }
    }
  }, [isSyncing, syncProgress, syncStartTime]);

  useEffect(() => {
    if (syncError && onError) {
      onError(syncError as unknown as Error);
    }
  }, [syncError, onError]);

  useEffect(() => {
    if (syncProgress === 100 && !isSyncing && onComplete) {
      onComplete();
    }
  }, [syncProgress, isSyncing, onComplete]);

  const handleStartSync = async () => {
    await startSync();
  };

  const handleStopSync = async () => {
    await stopSync();
  };

  const getStatusColor = () => {
    if (syncError) return "bg-red-500";
    if (isSyncing) return "bg-blue-500";
    if (syncProgress === 100) return "bg-green-500";
    return "bg-gray-300";
  };

  const getStatusText = () => {
    if (syncError)
      return `Error: ${(syncError as any).message || "Sync failed"}`;
    if (isSyncing) return `Syncing... ${syncProgress}%`;
    if (lastSyncTime) return `Last sync: ${lastSyncTime.toLocaleTimeString()}`;
    return "Ready to sync";
  };

  const getProgressWidth = () => {
    return `${Math.max(syncProgress, 3)}%`; // Minimum width for visibility
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Sync Progress
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {syncProgress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-300`}
            style={{ width: getProgressWidth() }}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            syncError
              ? "text-red-600"
              : isSyncing
                ? "text-blue-600"
                : "text-green-600"
          }`}
        >
          {getStatusText()}
        </span>

        {estimatedTimeRemaining !== null && isSyncing && (
          <span className="text-xs text-gray-500">
            ~{Math.round(estimatedTimeRemaining / 1000)}s remaining
          </span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleStartSync}
          disabled={isSyncing}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            isSyncing
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
          }`}
        >
          {isSyncing ? "Syncing..." : "Start Sync"}
        </button>

        {isSyncing && (
          <button
            onClick={handleStopSync}
            className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-2 text-xs">
          {lastSyncTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last Sync Time:</span>
              <span className="text-gray-900 font-medium">
                {lastSyncTime.toLocaleString()}
              </span>
            </div>
          )}

          {syncError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-red-700 font-medium">Sync Error Details:</p>
              <p className="text-red-600 mt-1">{(syncError as any).message}</p>
              {(syncError as any).code && (
                <p className="text-red-500 text-xs mt-1">
                  Code: {(syncError as any).code}
                </p>
              )}
            </div>
          )}

          {isSyncing && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-blue-700">
                {syncProgress < 50
                  ? "Fetching data..."
                  : "Processing changes..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SyncProgressBar;
