import React, { useState, useEffect } from 'react';
import { ChartBarIcon, DocumentTextIcon, SpinnerIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { getDatabaseStatistics } from '@/services/firebaseSetupService';

interface DatabaseStats {
  totalCollections: number;
  totalDocuments: number;
  collectionBreakdown: Record<string, number>;
}

const DatabaseStatistics: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const result = await getDatabaseStatistics();
        setStats(result);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center gap-3 py-8">
          <SpinnerIcon className="w-5 h-5 text-brand-primary animate-spin" />
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Collections Card */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('totalCollections')}
            </p>
            <p className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
              {stats.totalCollections}
            </p>
          </div>
          <ChartBarIcon className="w-12 h-12 text-blue-500 opacity-20" />
        </div>
      </div>

      {/* Total Documents Card */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('totalDocuments')}
            </p>
            <p className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
              {stats.totalDocuments}
            </p>
          </div>
          <DocumentTextIcon className="w-12 h-12 text-green-500 opacity-20" />
        </div>
      </div>

      {/* Database Size Indicator */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('databaseHealth')}</p>
        <div className="mt-4">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: '35%' }}
            />
          </div>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {t('normalUsage')}
          </p>
        </div>
      </div>

      {/* Collection Breakdown */}
      <div className="md:col-span-3 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
          {t('collectionBreakdown')}
        </h4>
        <div className="space-y-3">
          {Object.entries(stats.collectionBreakdown).map(([collection, count]) => (
            <div key={collection} className="flex items-center justify-between pb-3 border-b border-brand-border dark:border-dark-brand-border last:border-b-0">
              <span className="text-brand-text-primary dark:text-dark-brand-text-primary">{collection}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min((count / Math.max(...Object.values(stats.collectionBreakdown)) || 1) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary w-12 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatistics;
