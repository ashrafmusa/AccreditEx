import React, { FC } from 'react';
import { Notification, NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  setNavigation: (state: NavigationState) => void;
  onMarkAsRead: (notificationId: string | 'all') => void;
}

const NotificationCenter: FC<NotificationCenterProps> = ({ isOpen, onClose, notifications, setNavigation, onMarkAsRead }) => {
  const { t, lang } = useTranslation();

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    setNavigation(notification.link);
    onClose();
  };
  
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div
      className="absolute top-full ltr:right-0 rtl:left-0 mt-2 w-80 bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-2xl border border-brand-border dark:border-dark-brand-border z-50 animate-[fadeInUp_0.2s_ease-out]"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-3 border-b border-brand-border dark:border-dark-brand-border flex justify-between items-center">
        <h3 className="font-semibold">{t('notifications')}</h3>
        {unreadNotifications.length > 0 && (
          <button onClick={() => onMarkAsRead('all')} className="text-xs text-brand-primary hover:underline">{t('markAllAsRead')}</button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-brand-border dark:border-dark-brand-border last:border-b-0 ${!notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>{notification.message[lang]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-gray-500 p-8">{t('noNewNotifications')}</p>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;