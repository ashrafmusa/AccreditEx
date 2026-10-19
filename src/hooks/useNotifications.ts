import { useEffect, useState, useCallback } from 'react';
import {
  notificationService,
  EnhancedNotification,
  NotificationFilter,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@/services/notificationService';
import { useUserStore } from '@/stores/useUserStore';

export interface UseNotificationsOptions {
  autoCleanup?: boolean;
  cleanupIntervalMs?: number;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  limit?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { currentUser } = useUserStore();
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = currentUser?.id;

  // Update notifications list and unread count
  const updateNotifications = useCallback(() => {
    if (!userId) return;

    const filter: NotificationFilter = {};
    if (options.category) filter.category = options.category;
    if (options.priority) filter.priority = options.priority;

    const notifs = notificationService.getNotifications(userId, filter, options.limit);
    setNotifications(notifs);
    setUnreadCount(notificationService.getUnreadCount(userId));
  }, [userId, options.category, options.priority, options.limit]);

  // Setup subscription
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let active = true;
    const unsubscribe = notificationService.subscribe(() => {
      updateNotifications();
    });
    setLoading(true);
    setError(null);
    notificationService
      .hydrateNotifications(userId)
      .then(() => {
        if (active) updateNotifications();
      })
      .catch((loadError: unknown) => {
        console.error('[useNotifications] Failed to load notifications:', loadError);
        if (active) setError('notificationLoadFailed');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId, updateNotifications]);

  const reportMutationError = useCallback((operation: string, error: unknown) => {
    console.error(`[useNotifications] ${operation} failed:`, error);
    setError('notificationActionFailed');
  }, []);

  // Auto cleanup expired notifications
  useEffect(() => {
    if (!options.autoCleanup) return;

    const interval = setInterval(() => {
      notificationService.cleanupExpiredNotifications();
    }, options.cleanupIntervalMs || 5 * 60 * 1000); // Default 5 minutes

    return () => clearInterval(interval);
  }, [options.autoCleanup, options.cleanupIntervalMs]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      updateNotifications();
    } catch (error) {
      reportMutationError('Mark as read', error);
    }
  }, [reportMutationError, updateNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return 0;
    try {
      const count = await notificationService.markAllAsRead(userId);
      updateNotifications();
      return count;
    } catch (error) {
      reportMutationError('Mark all as read', error);
      return 0;
    }
  }, [userId, reportMutationError, updateNotifications]);

  // Mark bulk as read
  const markBulkAsRead = useCallback(async (ids: string[]) => {
    try {
      await notificationService.markBulkAsRead(ids);
      updateNotifications();
    } catch (error) {
      reportMutationError('Bulk mark as read', error);
    }
  }, [reportMutationError, updateNotifications]);

  // Archive notification
  const archive = useCallback(async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
      updateNotifications();
    } catch (error) {
      reportMutationError('Archive', error);
    }
  }, [reportMutationError, updateNotifications]);

  // Delete notification
  const remove = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      updateNotifications();
    } catch (error) {
      reportMutationError('Delete', error);
    }
  }, [reportMutationError, updateNotifications]);

  // Clear all
  const clearAll = useCallback(async () => {
    if (!userId) return 0;
    try {
      const count = await notificationService.clearAll(userId);
      updateNotifications();
      return count;
    } catch (error) {
      reportMutationError('Clear all', error);
      return 0;
    }
  }, [userId, reportMutationError, updateNotifications]);

  // Clear archived
  const clearArchived = useCallback(async () => {
    if (!userId) return 0;
    try {
      const count = await notificationService.clearArchived(userId);
      updateNotifications();
      return count;
    } catch (error) {
      reportMutationError('Clear archived', error);
      return 0;
    }
  }, [userId, reportMutationError, updateNotifications]);

  // Get filtered notifications
  const getFiltered = useCallback((filter: NotificationFilter, limit?: number) => {
    if (!userId) return [];
    return notificationService.getNotifications(userId, filter, limit);
  }, [userId]);

  // Get notifications by category
  const getByCategory = useCallback((category: NotificationCategory) => {
    if (!userId) return [];
    return notificationService.getNotificationsByCategory(userId, category);
  }, [userId]);

  // Get critical notifications
  const getCritical = useCallback(() => {
    if (!userId) return [];
    return notificationService.getCriticalNotifications(userId);
  }, [userId]);

  // Get recent notifications
  const getRecent = useCallback((hours?: number) => {
    if (!userId) return [];
    return notificationService.getRecentNotifications(userId, hours);
  }, [userId]);

  // Get statistics
  const getStats = useCallback(() => {
    if (!userId) return null;
    return notificationService.getStatistics(userId);
  }, [userId]);

  // Check for critical
  const hasCritical = useCallback(() => {
    if (!userId) return false;
    return notificationService.hasCriticalNotifications(userId);
  }, [userId]);

  // Create notification
  const create = useCallback(
    (title: string, message: string, notificationOptions: any = {}) => {
      if (!userId) return null;
      return notificationService
        .createNotification(userId, title, message, notificationOptions)
        .catch((error: unknown) => {
          reportMutationError('Create', error);
          return null;
        });
    },
    [userId, reportMutationError]
  );

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    markBulkAsRead,
    archive,
    remove,
    clearAll,
    clearArchived,
    create,

    // Queries
    getFiltered,
    getByCategory,
    getCritical,
    getRecent,
    getStats,
    hasCritical,
  };
};
