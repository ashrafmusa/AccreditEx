import React, { useState } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  DownloadIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';
import FirebaseConnectionTest from './FirebaseConnectionTest';
import AppSettingsValidator from './AppSettingsValidator';
import EnhancedCollectionsManager from './EnhancedCollectionsManager';
import DatabaseStatistics from './DatabaseStatistics';
import BackupRecoveryPanel from './BackupRecoveryPanel';
import FirebaseSetupGuide from './FirebaseSetupGuide';
import FirebaseConfigurationEntry from './FirebaseConfigurationEntry';
import BatchImportPanel from './BatchImportPanel';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType;
}

const FirebaseSetupPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedTabId, setSelectedTabId] = useState('config');

  const tabs: TabItem[] = [
    {
      id: 'config',
      label: t('firebaseConfig.title'),
      icon: CogIcon,
      component: () => <FirebaseConfigurationEntry />,
    },
    {
      id: 'batch-import',
      label: 'Batch Import',
      icon: ArrowPathIcon,
      component: () => (
        <div className="space-y-6">
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 p-4 rounded-lg">
            <p className="text-sm text-cyan-700 dark:text-cyan-200">
              Use batch import to upload pre-formatted JSON files with multiple documents at once. Much faster than manual entry!
            </p>
          </div>
          <BatchImportPanel />
        </div>
      ),
    },
    {
      id: 'status',
      label: t('statusHealth'),
      icon: SparklesIcon,
      component: () => (
        <div className="space-y-6">
          <FirebaseConnectionTest />
          <AppSettingsValidator />
          <DatabaseStatistics />
        </div>
      ),
    },
    {
      id: 'collections',
      label: t('collections'),
      icon: DocumentTextIcon,
      component: () => (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">{t('collectionsDescription')}</p>
          </div>
          <EnhancedCollectionsManager />
        </div>
      ),
    },
    {
      id: 'backup',
      label: t('backupRecovery'),
      icon: DownloadIcon,
      component: () => (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-200">{t('backupDescription')}</p>
          </div>
          <BackupRecoveryPanel />
        </div>
      ),
    },
    {
      id: 'help',
      label: t('helpGuide'),
      icon: InformationCircleIcon,
      component: () => <FirebaseSetupGuide />,
    },
  ];

  const selectedTab = tabs.find(tab => tab.id === selectedTabId);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-brand-border dark:border-dark-brand-border pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-brand-primary" />
                {t('firebaseSetup')}
              </h1>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                {t('firebaseSetupDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-brand-border dark:border-dark-brand-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTabId(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 focus:outline-none ${
                    isSelected
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {selectedTab && <selectedTab.component />}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">{t('adminOnlyFeature')}</p>
            <p className="text-amber-800 dark:text-amber-200 text-sm mt-1">
              {t('firebaseSetupWarning')}
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FirebaseSetupPage;
