import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, SpinnerIcon, ArrowPathIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';
import { testFirebaseConnection, FirebaseStatus } from '@/services/firebaseSetupService';

const FirebaseConnectionTest: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [status, setStatus] = useState<FirebaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const result = await testFirebaseConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        isConnected: false,
        lastChecked: new Date(),
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleTest();
  }, []);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('firebaseConnection')}
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t('testFirebaseConnection')}
          </p>
        </div>
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('test')}
        </button>
      </div>

      {status && (
        <div
          className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
            status.isConnected
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}
        >
          {status.isConnected ? (
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={`font-semibold ${
                status.isConnected
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : 'text-red-900 dark:text-red-100'
              }`}
            >
              {status.isConnected ? t('connected') : t('disconnected')}
            </p>
            <p
              className={`text-sm mt-1 ${
                status.isConnected
                  ? 'text-emerald-700 dark:text-emerald-200'
                  : 'text-red-700 dark:text-red-200'
              }`}
            >
              {status.message}
            </p>
            <p className="text-xs mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('lastChecked')}: {status.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 flex items-center gap-3">
          <SpinnerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-sm text-blue-700 dark:text-blue-200">{t('testing')}...</p>
        </div>
      )}
    </div>
  );
};

export default FirebaseConnectionTest;
