import React, { FC, ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: FC<{ className: string }>;
  gridCols?: 1 | 2 | 3 | 4;
  badge?: string;
  action?: ReactNode;
  noBorder?: boolean;
}

const SettingsSection: FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  icon: Icon,
  gridCols = 1,
  badge,
  action,
  noBorder = false,
}) => {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`space-y-4 py-4 ${
        !noBorder
          ? "border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Icon className="w-4 h-4 text-brand-primary" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {title}
              </h4>
              {badge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={`grid ${gridClasses[gridCols]} gap-4 mt-3`}>
        {children}
      </div>
    </div>
  );
};

export { SettingsSection };
export default SettingsSection;
