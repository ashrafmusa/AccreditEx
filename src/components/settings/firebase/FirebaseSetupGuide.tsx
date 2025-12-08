import React from 'react';
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';

const FirebaseSetupGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Connection Issues */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          {t('connectionIssues')}
        </h3>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t('problem')}: {t('firebaseConnectionFailed')}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm">
              <li>{t('checkInternetConnection')}</li>
              <li>{t('verifyFirebaseProjectID')}</li>
              <li>{t('checkEnvironmentVariables')}</li>
              <li>{t('checkFirebaseConsoleRules')}</li>
            </ol>
          </div>
        </div>
      </div>

      {/* AppSettings Not Found */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          {t('appSettingsNotFound')}
        </h3>
        <div className="space-y-3 text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm">
          <p>{t('appSettingsNotFoundDescription')}</p>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded font-mono text-xs">
            <p className="mb-2"># {t('firebaseConsoleMethod')}</p>
            <p>1. {t('goToFirebaseConsole')}</p>
            <p>2. {t('selectFirestoreDatabase')}</p>
            <p>3. {t('startCollection')}: appSettings</p>
            <p>4. {t('documentId')}: default</p>
            <p>5. {t('addRequiredFields')}</p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {t('bestPractices')}
        </h3>
        <ul className="space-y-2 text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm">
          <li className="flex gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span>{t('regularlyBackupSettings')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span>{t('testConnectionRegularly')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span>{t('monitorCollectionSizes')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span>{t('keepSecurityRulesUpdated')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span>{t('useEnvironmentVariables')}</span>
          </li>
        </ul>
      </div>

      {/* Documentation Links */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {t('resources')}
        </h3>
        <div className="space-y-2">
          <a
            href="https://firebase.google.com/docs/firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            → {t('firebaseDocumentation')}
          </a>
          <a
            href="https://firebase.google.com/docs/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            → {t('securityRulesGuide')}
          </a>
          <a
            href="https://firebase.google.com/docs/firestore/security"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            → {t('firebaseSecurityGuide')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetupGuide;
