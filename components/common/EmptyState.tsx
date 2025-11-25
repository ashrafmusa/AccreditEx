import React, { FC } from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
}

const EmptyState: FC<EmptyStateProps> = ({ icon: Icon, title, message }) => {
  return (
    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 animate-[fadeIn_0.5s_ease-in-out]">
      <Icon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
      <h3 className="mt-4 text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{message}</p>
    </div>
  );
};

export default EmptyState;