import React, { FC } from 'react';

interface SettingsAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  icon?: FC<{ className: string }>;
  onDismiss?: () => void;
  className?: string;
}

const SettingsAlert: FC<SettingsAlertProps> = ({ 
  type, 
  title, 
  message, 
  icon: Icon,
  onDismiss,
  className = ''
}) => {
  const typeStyles = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
      title: 'text-blue-900 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'text-blue-600 hover:text-blue-700'
    },
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
      title: 'text-green-900 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
      icon: 'text-green-600 dark:text-green-400',
      button: 'text-green-600 hover:text-green-700'
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
      title: 'text-amber-900 dark:text-amber-200',
      message: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
      button: 'text-amber-600 hover:text-amber-700'
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
      title: 'text-red-900 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
      icon: 'text-red-600 dark:text-red-400',
      button: 'text-red-600 hover:text-red-700'
    }
  };

  const style = typeStyles[type];

  return (
    <div className={`${style.container} rounded-lg p-4 flex items-start gap-3 animate-slideIn ${className}`}>
      {Icon && <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />}
      <div className="flex-1">
        {title && <h4 className={`font-semibold text-sm ${style.title} mb-1`}>{title}</h4>}
        <p className={`text-sm ${style.message}`}>{message}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className={`flex-shrink-0 ${style.button} transition-colors`}
          aria-label="Dismiss alert"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export { SettingsAlert };
export default SettingsAlert;
