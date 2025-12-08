import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { BellIcon } from '@/components/icons';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  showCount?: boolean;
  popoverPosition?: 'left' | 'right';
  maxNotifications?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  showCount = true,
  popoverPosition = 'right',
  maxNotifications = 5,
}) => {
  const { unreadCount, hasCritical } = useNotifications({ limit: maxNotifications });
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses =
    popoverPosition === 'left'
      ? 'right-0 origin-top-right'
      : 'left-0 origin-top-left';

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-100 dark:bg-gray-800'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon
          className={`w-6 h-6 transition-colors ${
            unreadCount > 0
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          } ${hasCritical() ? 'animate-pulse' : ''}`}
        />

        {/* Unread badge */}
        {showCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Critical indicator */}
        {hasCritical() && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={`absolute top-full ${positionClasses} mt-2 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <NotificationCenter maxVisible={maxNotifications} />
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
