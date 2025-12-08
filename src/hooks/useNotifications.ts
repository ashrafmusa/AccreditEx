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

    updateNotifications();
    setLoading(false);

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe(() => {
      updateNotifications();
    });

    return unsubscribe;
  }, [userId, updateNotifications]);

  // Auto cleanup expired notifications
  useEffect(() => {
    if (!options.autoCleanup) return;

    const interval = setInterval(() => {
      notificationService.cleanupExpiredNotifications();
    }, options.cleanupIntervalMs || 5 * 60 * 1000); // Default 5 minutes

    return () => clearInterval(interval);
  }, [options.autoCleanup, options.cleanupIntervalMs]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
    updateNotifications();
  }, [updateNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (!userId) return 0;
    const count = notificationService.markAllAsRead(userId);
    updateNotifications();
    return count;
  }, [userId, updateNotifications]);

  // Mark bulk as read
  const markBulkAsRead = useCallback((ids: string[]) => {
    notificationService.markBulkAsRead(ids);
    updateNotifications();
  }, [updateNotifications]);

  // Archive notification
  const archive = useCallback((notificationId: string) => {
    notificationService.archiveNotification(notificationId);
    updateNotifications();
  }, [updateNotifications]);

  // Delete notification
  const remove = useCallback((notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    updateNotifications();
  }, [updateNotifications]);

  // Clear all
  const clearAll = useCallback(() => {
    if (!userId) return 0;
    const count = notificationService.clearAll(userId);
    updateNotifications();
    return count;
  }, [userId, updateNotifications]);

  // Clear archived
  const clearArchived = useCallback(() => {
    if (!userId) return 0;
    const count = notificationService.clearArchived(userId);
    updateNotifications();
    return count;
  }, [userId, updateNotifications]);

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
      return notificationService.createNotification(userId, title, message, notificationOptions);
    },
    [userId]
  );

  return {
    // State
    notifications,
    unreadCount,
    loading,

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
