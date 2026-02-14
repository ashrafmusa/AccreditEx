import React, { FC } from "react";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 animate-[fadeIn_0.5s_ease-in-out] ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      />
      <h3 className="mt-4 text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-md mx-auto">
        {message}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-dark-brand-600 dark:hover:bg-dark-brand-700"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-md text-brand-text-primary dark:text-dark-brand-text-primary bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
