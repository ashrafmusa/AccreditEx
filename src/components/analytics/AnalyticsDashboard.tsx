import React, { useState } from 'react';
import { AnalyticsOverview } from './AnalyticsOverview';
import { TrendChart } from './TrendChart';
import { HealthScoreGauge } from './HealthScoreGauge';
import { InsightsPanel } from './InsightsPanel';
import { DataQualityPanel } from './DataQualityPanel';
import { useReport } from '../../hooks/useAnalyticsHooks';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
  configId?: string;
  title?: string;
}

type TabType = 'overview' | 'trends' | 'health' | 'quality' | 'insights' | 'reports';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  configId = 'default',
  title = 'HIS Integration Analytics',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const { reports, isLoading: reportsLoading } = useReport();

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'trends', label: 'Trends', icon: <BarChart3 size={18} /> },
    { id: 'health', label: 'Health', icon: <BarChart3 size={18} /> },
    { id: 'quality', label: 'Data Quality', icon: <BarChart3 size={18} /> },
    { id: 'insights', label: 'Insights', icon: <BarChart3 size={18} /> },
    { id: 'reports', label: 'Reports', icon: <Download size={18} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 text-sm mt-1">Configuration: {configId}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div key={refreshKey}>
        {activeTab === 'overview' && (
          <AnalyticsOverview configId={configId} />
        )}

        {activeTab === 'trends' && (
          <TrendChart configId={configId} />
        )}

        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <HealthScoreGauge configId={configId} showDetails={true} />
            </div>
            <div className="md:col-span-2">
              <TrendChart configId={configId} />
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <DataQualityPanel configId={configId} />
        )}

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InsightsPanel configId={configId} />
            </div>
            <div>
              <HealthScoreGauge configId={configId} showDetails={false} />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsTab configId={configId} reports={reports} isLoading={reportsLoading} />
        )}
      </div>
    </div>
  );
};

/**
 * Reports Tab Component
 */
interface ReportsTabProps {
  configId: string;
  reports: any[];
  isLoading: boolean;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ configId, reports, isLoading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading reports...</div>
      </div>
    );
  }

  const getReportsByPeriod = (period: string) => {
    const now = new Date();
    const cutoff = new Date();

    switch (period) {
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(cutoff.getDate() - 90);
        break;
      default:
        return reports;
    }

    return reports.filter((r) => new Date(r.generatedAt) >= cutoff);
  };

  const filteredReports = getReportsByPeriod(selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Daily Summary', type: 'daily' },
            { name: 'Weekly Report', type: 'weekly' },
            { name: 'Monthly Report', type: 'monthly' },
            { name: 'Custom Report', type: 'custom' },
          ].map((report) => (
            <button
              key={report.type}
              className="px-4 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-blue-200"
            >
              {report.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No reports generated in this period. Create one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{report.name}</h4>
                    <div className="flex gap-4 mt-1 text-xs text-gray-600">
                      <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                      <span>Format: {report.format.toUpperCase()}</span>
                      <span>Size: {(report.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                      View
                    </button>
                    <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
