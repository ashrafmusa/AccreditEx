import React, { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { safeNavigate } from "@/utils/urlValidation";
import {
  EnhancedNotification,
  NotificationCategory,
} from "@/services/notificationService";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  XCircleIcon,
  InfoIcon,
  AlertIcon,
} from "@/components/icons";

interface NotificationCenterProps {
  maxVisible?: number;
  autoClose?: boolean;
  categoryFilter?: NotificationCategory;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxVisible = 5,
  autoClose = true,
  categoryFilter,
}) => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    archive,
    remove,
    clearArchived,
  } = useNotifications({
    limit: maxVisible,
    category: categoryFilter,
    autoCleanup: true,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <InfoIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600";
      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-600";
      case "normal":
        return "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-l-4 border-gray-600";
    }
  };

  const handleNotificationClick = (notification: EnhancedNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      safeNavigate(notification.actionUrl);
    }
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t("noNotifications") || "No notifications"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {unreadCount}{" "}
            {unreadCount === 1 ? "unread notification" : "unread notifications"}
          </span>
          <button
            onClick={() =>
              notifications.forEach((n) => !n.read && markAsRead(n.id))
            }
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getPriorityColor(
              notification.priority
            )} rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              !notification.read ? "font-medium" : "opacity-75"
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getTypeIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
              )}
            </div>

            {/* Message and expanded content */}
            <div className="mt-2 ml-8">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {notification.message}
              </p>

              {expandedId === notification.id && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {notification.message}
                  </p>
                  {notification.data && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-black/10 dark:bg-white/10 p-2 rounded">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-2 ml-8 flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  title="Mark as read"
                >
                  <CheckIcon className="w-3 h-3" />
                  Read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  archive(notification.id);
                }}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="Archive"
              >
                📦 Archive
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(notification.id);
                }}
                className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clear archived button */}
      <button
        onClick={() => clearArchived()}
        className="w-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Clear archived notifications
      </button>
    </div>
  );
};

export default NotificationCenter;
