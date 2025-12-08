import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, DownloadIcon, UploadIcon, SpinnerIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { exportAppSettings, importAppSettings, getAppSettings } from '@/services/firebaseSetupService';

const BackupRecoveryPanel: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  useEffect(() => {
    // Check if there's a saved backup timestamp
    const savedBackup = localStorage.getItem('lastBackupTime');
    if (savedBackup) {
      setLastBackup(new Date(savedBackup));
    }
  }, []);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const jsonData = await exportAppSettings();
      
      // Create download link
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonData));
      element.setAttribute('download', `appSettings-backup-${new Date().toISOString().split('T')[0]}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Save backup timestamp
      const now = new Date();
      setLastBackup(now);
      localStorage.setItem('lastBackupTime', now.toISOString());

      toast.success(t('backupExportedSuccessfully'));
    } catch (error) {
      toast.error(`${t('error')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const content = await file.text();
        
        // Validate JSON
        JSON.parse(content);
        
        // Confirm import
        if (window.confirm(t('confirmImportSettings'))) {
          await importAppSettings(content);
          toast.success(t('settingsImportedSuccessfully'));
          
          // Refresh page after import
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        toast.error(`${t('error')}: ${error instanceof Error ? error.message : 'Invalid JSON file'}`);
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
        {t('backupRecovery')}
      </h3>

      <div className="space-y-4">
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t('backupRecoveryDescription')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <SpinnerIcon className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadIcon className="w-4 h-4" />
            )}
            {t('exportBackup')}
          </button>

          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <SpinnerIcon className="w-4 h-4 animate-spin" />
            ) : (
              <UploadIcon className="w-4 h-4" />
            )}
            {t('importBackup')}
          </button>
        </div>

        {lastBackup && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              {t('lastBackup')}: {lastBackup.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRecoveryPanel;
