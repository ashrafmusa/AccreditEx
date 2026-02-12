import React, { useEffect, useState } from 'react';
import { freeTierMonitor } from '@/services/freeTierMonitor';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import SettingsButton from './SettingsButton';
import SettingsAlert from './SettingsAlert';
import SettingsSection from './SettingsSection';
import { DownloadIcon } from '@/components/icons';

interface UsageStats {
  monthly: { reads: number; writes: number; deletes: number };
  daily: { reads: number; writes: number; deletes: number };
  freeTierRemaining: { reads: number; writes: number; deletes: number };
  percentageUsed: { reads: string; writes: string; deletes: string };
  estimatedCost: number;
}

interface HourlyRate {
  readsPerDay: string;
  projectedMonthlyReads: string;
  projectedMonthlyCost: string;
  willExceedFreeTier: { reads: boolean; writes: boolean; deletes: boolean };
}

const UsageMonitorPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [hourly, setHourly] = useState<HourlyRate | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats(freeTierMonitor.getStats() as UsageStats);
      setHourly(freeTierMonitor.getHourlyRate() as HourlyRate);
      setWarnings(freeTierMonitor.getWarnings());
    };

    updateStats();
    const interval = setInterval(updateStats, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!stats || !hourly) {
    return <div className="text-center py-8">Loading usage data...</div>;
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const parsePercentage = (pct: string): number => {
    return parseFloat(pct.replace('%', ''));
  };

  const readsPercentage = parsePercentage(stats.percentageUsed.reads);
  const writesPercentage = parsePercentage(stats.percentageUsed.writes);
  const deletesPercentage = parsePercentage(stats.percentageUsed.deletes);

  const handleExportStats = () => {
    const data = freeTierMonitor.exportStats();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-usage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <SettingsAlert
          type="error"
          icon
          title={t("usageWarnings") || "Usage Warnings"}
          dismissible
        >
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-sm">
                {warning}
              </li>
            ))}
          </ul>
        </SettingsAlert>
      )}

      <SettingsCard
        title={t('firebaseFreeTierUsage') || 'Firebase Free Tier Usage'}
        description={t('monitorFirestoreUsage') || 'Monitor your daily and monthly Firestore usage'}
      >
        <div className="space-y-8">
          <SettingsSection
            title={t('todaysActivity') || 'Today\'s Activity'}
            description={t('realtimeOperationCounts') || 'Real-time operation counts'}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase mb-2">
                  Reads
                </h4>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {stats.daily.reads}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Daily limit: 50,000
                </p>
              </div>
              <div className="bg-rose-50 dark:bg-pink-900/20 rounded-lg p-4 border border-rose-200 dark:border-pink-700">
                <h4 className="text-xs font-semibold text-pink-900 dark:text-rose-300 uppercase mb-2">
                  Writes
                </h4>
                <p className="text-2xl font-bold text-pink-900 dark:text-rose-200">
                  {stats.daily.writes}
                </p>
                <p className="text-xs text-pink-600 dark:text-rose-400 mt-1">
                  Daily limit: 20,000
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="text-xs font-semibold text-green-900 dark:text-green-300 uppercase mb-2">
                  Deletes
                </h4>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {stats.daily.deletes}
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  Daily limit: 20,000
                </p>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title={t('monthlyUsage') || 'Monthly Usage'}
            description={t('progressTowardsLimits') || 'Progress towards monthly limits'}
          >
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Reads: {stats.monthly.reads} / 50,000
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {stats.percentageUsed.reads}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                      readsPercentage
                    )}`}
                    style={{ width: `${Math.min(readsPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Writes: {stats.monthly.writes} / 20,000
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {stats.percentageUsed.writes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                      writesPercentage
                    )}`}
                    style={{ width: `${Math.min(writesPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Deletes: {stats.monthly.deletes} / 20,000
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {stats.percentageUsed.deletes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                      deletesPercentage
                    )}`}
                    style={{ width: `${Math.min(deletesPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title={t('monthlyProjections') || 'Monthly Projections'}
            description={t('basedOnCurrentUsage') || 'Based on current usage patterns'}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Projected Monthly Reads
                </p>
                <p className="font-semibold text-xl">
                  {hourly.projectedMonthlyReads}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Estimated Monthly Cost
                </p>
                <p className="font-semibold text-xl">
                  ${hourly.projectedMonthlyCost}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Daily Average
                </p>
                <p className="font-semibold text-xl">
                  {hourly.readsPerDay} reads/day
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Free Tier Status
                </p>
                <p
                  className={`font-semibold text-xl ${
                    hourly.willExceedFreeTier.reads
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {hourly.willExceedFreeTier.reads ? "Exceeds" : "Within Limit"}
                </p>
              </div>
            </div>
          </SettingsSection>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <SettingsButton
          variant="secondary"
          onClick={handleExportStats}
          icon={DownloadIcon}
          size="md"
        >
          Export Statistics
        </SettingsButton>
      </div>
    </div>
  );
};

export default UsageMonitorPage;
