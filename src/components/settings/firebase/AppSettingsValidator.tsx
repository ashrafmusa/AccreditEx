import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { validateAppSettings, AppSettingsValidation } from '@/services/firebaseSetupService';

const AppSettingsValidator: React.FC = () => {
  const { t } = useTranslation();
  const [validation, setValidation] = useState<AppSettingsValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validate = async () => {
      setIsLoading(true);
      try {
        const result = await validateAppSettings();
        setValidation(result);
      } catch (error) {
        setValidation({
          isValid: false,
          errors: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('validating')}...</p>
      </div>
    );
  }

  if (!validation) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center gap-3 mb-4">
          {validation.isValid ? (
            <>
              <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {t('appSettingsValid')}
              </h3>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                {t('appSettingsInvalid')}
              </h3>
            </>
          )}
        </div>

        {validation.errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">{t('errors')}</h4>
            <ul className="space-y-2">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                  <span className="text-red-700 dark:text-red-200 text-sm">{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div>
            <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">{t('warnings')}</h4>
            <ul className="space-y-2">
              {validation.warnings.map((warning, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span className="text-amber-700 dark:text-amber-200 text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.lastUpdated && (
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-4">
            {t('lastValidated')}: {validation.lastUpdated.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppSettingsValidator;
