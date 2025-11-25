import React, { FC, ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

const SettingsCard: FC<SettingsCardProps> = ({ title, description, children, footer }) => {
  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface shadow-sm rounded-lg border border-brand-border dark:border-dark-brand-border">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{description}</p>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
      {footer && (
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 rounded-b-lg flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;
