import React from 'react';
import { useAnalytics, useHealthScore } from '../../hooks/useAnalyticsHooks';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalyticsOverviewProps {
  configId: string;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ configId }) => {
  const { performance, quality, health, isLoading, error } = useAnalytics(configId);
  const healthScore = useHealthScore(configId);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">System Health</h3>
            <p className="text-sm text-gray-600 mb-4">Overall integration health status</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-600">Sync Health</span>
                <div className="text-2xl font-bold text-blue-600">{healthScore.syncHealth}%</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Data Quality</span>
                <div className="text-2xl font-bold text-blue-600">{healthScore.dataQuality}%</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Stability</span>
                <div className="text-2xl font-bold text-blue-600">{healthScore.systemStability}%</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Trend</span>
                <div className="text-lg font-bold text-blue-600 capitalize">{healthScore.performanceTrend}</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-white bg-blue-600 rounded-full w-32 h-32 flex items-center justify-center">
              {healthScore.overall}
            </div>
            <p className="text-sm text-gray-600 mt-2">Out of 100</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">Success Rate</span>
            <CheckCircle size={16} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{performance?.successRate}%</div>
          <p className="text-xs text-gray-500 mt-1">Of all sync operations</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">Avg Duration</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{performance?.averageDuration}ms</div>
          <p className="text-xs text-gray-500 mt-1">Per sync operation</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">Total Syncs</span>
            <CheckCircle size={16} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{performance?.totalSyncs}</div>
          <p className="text-xs text-gray-500 mt-1">Completed operations</p>
        </div>
      </div>

      {/* Data Quality Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Quality</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Valid Records</div>
            <div className="text-2xl font-bold text-green-600">{quality?.validRecords}</div>
            <div className="text-xs text-gray-500 mt-1">of {quality?.totalRecords}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Invalid Records</div>
            <div className="text-2xl font-bold text-red-600">{quality?.invalidRecords}</div>
            <div className="text-xs text-gray-500 mt-1">{quality?.validationErrorRate}% error rate</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Data Integrity</div>
            <div className="text-2xl font-bold text-blue-600">{quality?.dataIntegrity}%</div>
            <div className="text-xs text-gray-500 mt-1">Complete & accurate</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Metrics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Records Synced</span>
            <span className="font-semibold text-gray-900">{performance?.totalRecordsSynced}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Conflicts Detected</span>
            <span className="font-semibold text-gray-900">{performance?.conflictCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Duplicate Records</span>
            <span className="font-semibold text-gray-900">{quality?.duplicateCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Failures</span>
            <span className="font-semibold text-gray-900">{performance?.failedSyncs}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
