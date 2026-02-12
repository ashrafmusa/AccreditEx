import React, { FC } from 'react';

interface EmptyStatePlaceholderProps {
  icon?: React.ElementType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: boolean;
  compact?: boolean;
}

const EmptyStatePlaceholder: FC<EmptyStatePlaceholderProps> = ({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondary = false,
  compact = false
}) => {
  const containerClass = compact
    ? 'py-6 px-4'
    : 'py-12 px-6';

  const iconSize = compact ? 'w-12 h-12' : 'w-16 h-16';
  const titleSize = compact ? 'text-lg' : 'text-2xl';
  const messageSize = compact ? 'text-sm' : 'text-base';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${containerClass} rounded-lg ${
        secondary
          ? 'bg-slate-50 dark:bg-slate-800/30 border border-dashed border-brand-border dark:border-dark-brand-border'
          : 'bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border'
      }`}
    >
      {Icon && (
        <div className={`${iconSize} rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4`}>
          <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-brand-text-secondary dark:text-dark-brand-text-secondary`} />
        </div>
      )}

      <h3 className={`${titleSize} font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2`}>
        {title}
      </h3>

      <p className={`${messageSize} text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-sm mb-4`}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyStatePlaceholder;
