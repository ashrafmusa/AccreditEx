import React from 'react';
import { LockClosedIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';

interface RestrictedFeatureIndicatorProps {
  featureName: string;
  className?: string;
  compact?: boolean;
}

/**
 * Component to indicate when a feature is restricted to specific roles
 * Displays a friendly message with a lock icon
 */
const RestrictedFeatureIndicator: React.FC<RestrictedFeatureIndicatorProps> = ({ 
  featureName, 
  className = '',
  compact = false 
}) => {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <LockClosedIcon className="h-3 w-3" />
        <span>{t('restrictedToAdministrators') || 'Restricted to administrators'}</span>
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 pt-0.5">
        <LockClosedIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
          {t('adminOnlyFeature') || 'Admin Only Feature'}
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {t('featureRestrictedToAdmins') || `${featureName} is restricted to administrators only. Contact your administrator if you need access.`}
        </p>
      </div>
    </div>
  );
};

export default RestrictedFeatureIndicator;
