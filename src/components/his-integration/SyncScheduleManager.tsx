/**
 * Sync Schedule Manager Component
 * Create, edit, and manage HIS sync schedules
 */

import React, { useState } from 'react';
import { useSyncSchedule } from '../../hooks/useHISIntegration';
import { useHISIntegrationStore } from '../../stores/useHISIntegrationStore';

interface ScheduleForm {
  configId: string;
  pattern: string;
  description?: string;
}

export function SyncScheduleManager() {
  const store = useHISIntegrationStore();
  const { scheduledJobs, jobStatuses, scheduleSync, unscheduleSync, pauseJob, resumeJob, getUpcomingRuns } =
    useSyncSchedule();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ScheduleForm>({
    configId: store.selectedConfigId || '',
    pattern: '*/15 * * * *', // Every 15 minutes by default
    description: '',
  });
  const [upcomingRuns, setUpcomingRuns] = useState<any[]>([]);

  const handleAddSchedule = () => {
    if (!formData.configId || !formData.pattern) {
      alert('Please select a configuration and enter a cron pattern');
      return;
    }

    const jobId = scheduleSync(formData.configId, formData.pattern);

    if (jobId) {
      // Show upcoming runs
      const runs = getUpcomingRuns(5);
      setUpcomingRuns(runs);

      // Reset form
      setFormData({
        configId: store.selectedConfigId || '',
        pattern: '*/15 * * * *',
        description: '',
      });
      setShowForm(false);
    }
  };

  const handleRemoveSchedule = (jobId: string) => {
    if (confirm('Are you sure you want to remove this schedule?')) {
      unscheduleSync(jobId);
    }
  };

  const handleTogglePause = (jobId: string) => {
    const status = jobStatuses[jobId];

    if (status?.status === 'paused') {
      resumeJob(jobId);
    } else {
      pauseJob(jobId);
    }
  };

  const getJobConfig = (configId: string) => {
    return store.configurations.find((c) => c.id === configId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Scheduled</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Running</span>;
      case 'paused':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Paused</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{status}</span>;
    }
  };

  const getCronDescription = (pattern: string): string => {
    // Simple cron description generator
    const parts = pattern.split(' ');
    if (parts.length !== 5) return pattern;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (pattern === '*/15 * * * *') return 'Every 15 minutes';
    if (pattern === '*/30 * * * *') return 'Every 30 minutes';
    if (pattern === '0 * * * *') return 'Every hour';
    if (pattern === '0 0 * * *') return 'Daily at midnight';
    if (pattern === '0 6 * * *') return 'Daily at 6:00 AM';
    if (pattern === '0 12 * * *') return 'Daily at noon';
    if (pattern === '0 0 * * 0') return 'Weekly on Sunday';
    if (pattern === '0 0 1 * *') return 'Monthly on the 1st';

    return pattern;
  };

  const getNextRunTime = (jobId: string) => {
    const job = scheduledJobs.find((j) => j.id === jobId);
    if (!job || !job.nextRun) return 'Unknown';

    const date = new Date(job.nextRun);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Due now';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    return `in ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <h3 className="text-lg font-semibold">Create Sync Schedule</h3>

          {/* Configuration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Configuration</label>
            <select
              value={formData.configId}
              onChange={(e) => setFormData({ ...formData, configId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a configuration</option>
              {store.configurations.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cron Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cron Pattern</label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              placeholder="e.g., */15 * * * * (every 15 minutes)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">{getCronDescription(formData.pattern)}</p>
            <p className="mt-1 text-xs text-gray-400">Format: minute hour day month weekday</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Regular patient data sync"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Every 15 min', pattern: '*/15 * * * *' },
                { label: 'Every 30 min', pattern: '*/30 * * * *' },
                { label: 'Hourly', pattern: '0 * * * *' },
                { label: 'Daily (6 AM)', pattern: '0 6 * * *' },
                { label: 'Weekly', pattern: '0 0 * * 0' },
              ].map((preset) => (
                <button
                  key={preset.pattern}
                  onClick={() => setFormData({ ...formData, pattern: preset.pattern })}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddSchedule}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Schedule
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          + New Schedule
        </button>
      )}

      {/* Scheduled Jobs List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Schedules ({scheduledJobs.length})</h3>

        {scheduledJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No schedules configured yet</div>
        ) : (
          scheduledJobs.map((job) => {
            const config = getJobConfig(job.configId);
            const status = jobStatuses[job.id] || {};

            return (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{config?.name || 'Unknown Config'}</h4>
                    <p className="text-sm text-gray-600">{getCronDescription(job.pattern)}</p>
                  </div>
                  {getStatusBadge(status.status || 'scheduled')}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pattern:</span>
                    <p className="font-mono text-gray-900">{job.pattern}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Run:</span>
                    <p className="text-gray-900">{getNextRunTime(job.id)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Run:</span>
                    <p className="text-gray-900">
                      {status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                {status.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-sm text-red-700">Error: {status.error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleTogglePause(job.id)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      status.status === 'paused'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {status.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={() => handleRemoveSchedule(job.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upcoming Runs Preview */}
      {upcomingRuns.length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-semibold text-gray-900 mb-3">Upcoming Syncs (Next 5)</h4>
          <div className="space-y-2">
            {upcomingRuns.map((run, idx) => (
              <div key={idx} className="text-sm text-gray-700">
                {new Date(run).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncScheduleManager;
