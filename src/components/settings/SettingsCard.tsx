import React, { FC, ReactNode, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  icon?: FC<{ className: string }>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  headerAction?: ReactNode;
}

const SettingsCard: FC<SettingsCardProps> = ({
  title,
  description,
  children,
  footer,
  icon: Icon,
  collapsible = false,
  defaultExpanded = true,
  badge,
  headerAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface shadow-sm rounded-xl border border-brand-border dark:border-dark-brand-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-brand-primary/20 dark:hover:border-brand-primary/30">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {title}
                </h3>
                {badge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={isExpanded ? "Collapse section" : "Expand section"}
              >
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
        <div
          className={`space-y-6 mt-6 transition-all duration-300 ${
            collapsible && !isExpanded ? "hidden opacity-0" : "opacity-100"
          }`}
        >
          {children}
        </div>
      </div>
      {footer && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-900/20 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-brand-border dark:border-dark-brand-border">
          {footer}
        </div>
      )}
    </div>
  );
};

export { SettingsCard };
export default SettingsCard;
