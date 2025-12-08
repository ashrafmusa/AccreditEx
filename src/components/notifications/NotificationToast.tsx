import React, { useEffect, useState } from 'react';
import { EnhancedNotification } from '@/services/notificationService';
import { CheckIcon, XCircleIcon, InfoIcon, AlertIcon } from '@/components/icons';

interface NotificationToastProps {
  notification: EnhancedNotification;
  duration?: number;
  onClose?: () => void;
  actionText?: string;
  onAction?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  duration = 5000,
  onClose,
  actionText,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration || duration <= 0) return;

    let timeLeft = duration;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckIcon className="w-5 h-5" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5" />;
      case 'warning':
        return <AlertIcon className="w-5 h-5" />;
      default:
        return <InfoIcon className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600',
          text: 'text-green-800 dark:text-green-200',
          progress: 'bg-green-500',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600',
          text: 'text-red-800 dark:text-red-200',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600',
          text: 'text-yellow-800 dark:text-yellow-200',
          progress: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600',
          text: 'text-blue-800 dark:text-blue-200',
          progress: 'bg-blue-500',
        };
    }
  };

  if (!isVisible) return null;

  const colors = getColors();

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg shadow-lg overflow-hidden transition-all duration-300 animate-slideIn`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${colors.text}`}>
            {notification.title}
          </h4>
          <p className={`text-sm mt-1 ${colors.text} opacity-90`}>
            {notification.message}
          </p>
          {(actionText || notification.actionUrl) && (
            <button
              onClick={() => {
                onAction?.();
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl;
                }
              }}
              className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${colors.text} hover:underline`}
            >
              {actionText || 'View'}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${colors.text} hover:opacity-75 transition-opacity`}
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {duration && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
