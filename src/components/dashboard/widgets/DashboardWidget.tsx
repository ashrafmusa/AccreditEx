import React from "react";
import { XMarkIcon } from "@/components/icons";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
  isDismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  description,
  icon: Icon,
  children,
  isDismissible = false,
  onDismiss,
  className = "",
}) => {
  return (
    <div
      className={`bg-brand-surface dark:bg-dark-brand-surface rounded-2xl shadow-lg border border-brand-border dark:border-dark-brand-border p-6 transition-all duration-300 hover:shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div className="p-2 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-brand-text">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-brand-muted dark:text-dark-brand-muted mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {isDismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-brand-hover dark:hover:bg-dark-brand-hover transition-colors"
            aria-label="Dismiss widget"
          >
            <XMarkIcon className="w-5 h-5 text-brand-muted dark:text-dark-brand-muted" />
          </button>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};
