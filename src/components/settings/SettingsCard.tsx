import React, { FC, ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  icon?: FC<{ className: string }>;
}

const SettingsCard: FC<SettingsCardProps> = ({
  title,
  description,
  children,
  footer,
  icon: Icon,
}) => {
  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface shadow-md rounded-xl border border-brand-border dark:border-dark-brand-border overflow-hidden transition-shadow duration-200 hover:shadow-lg">
      <div className="p-8">
        <div className="flex items-start gap-3 mb-6">
          {Icon && (
            <Icon className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
          )}
          <div>
            <h3 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {title}
            </h3>
            <p className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="space-y-6 mt-6">{children}</div>
      </div>
      {footer && (
        <div className="bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent px-8 py-4 flex justify-end gap-3 border-t border-brand-border dark:border-dark-brand-border">
          {footer}
        </div>
      )}
    </div>
  );
};

export { SettingsCard };
export default SettingsCard;
