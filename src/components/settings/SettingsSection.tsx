import React, { FC, ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: FC<{ className: string }>;
  gridCols?: 1 | 2 | 3;
}

const SettingsSection: FC<SettingsSectionProps> = ({ 
  title, 
  description, 
  children, 
  icon: Icon,
  gridCols = 1
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3'
  };

  return (
    <div className="space-y-4 py-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-start gap-3">
        {Icon && <Icon className="w-5 h-5 text-brand-primary flex-shrink-0 mt-1" />}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className={`grid ${gridClasses[gridCols]} gap-6 mt-4`}>
        {children}
      </div>
    </div>
  );
};

export { SettingsSection };
export default SettingsSection;
