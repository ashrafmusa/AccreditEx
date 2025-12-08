import { Notification } from '@/types';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'project' | 'audit' | 'training' | 'compliance' | 'task' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface EnhancedNotification extends Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  timestamp: Date;
  expiresAt?: Date;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationFilter {
  category?: NotificationCategory;
  priority?: NotificationPriority;
  type?: NotificationType;
  read?: boolean;
  archived?: boolean;
  startDate?: Date;
  endDate?: Date;
}

class NotificationService {
  private notificationQueue: EnhancedNotification[] = [];
  private listeners: ((notifications: EnhancedNotification[]) => void)[] = [];
  private unreadCount: number = 0;
  private readonly NOTIFICATION_EXPIRY_DAYS = 30;
  private readonly MAX_NOTIFICATIONS = 100;

  /**
   * Create and queue a notification
   */
  public async createNotification(
    userId: string,
    title: string,
    message: string,
    options: {
      type?: NotificationType;
      category?: NotificationCategory;
      priority?: NotificationPriority;
      relatedId?: string;
      relatedType?: string;
      actionUrl?: string;
      data?: Record<string, any>;
      expiresInDays?: number;
    } = {}
  ): Promise<EnhancedNotification> {
    const notification: EnhancedNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      message,
      type: options.type || 'info',
      category: options.category || 'system',
      priority: options.priority || 'normal',
      read: false,
      archived: false,
      timestamp: new Date(),
      expiresAt: options.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + this.NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      relatedId: options.relatedId,
      relatedType: options.relatedType,
      actionUrl: options.actionUrl,
      data: options.data,
    };

    // Add to queue
    this.notificationQueue.unshift(notification);

    // Maintain max size
    if (this.notificationQueue.length > this.MAX_NOTIFICATIONS) {
      this.notificationQueue.pop();
    }

    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
    }

    // Notify listeners
    this.notifyListeners();

    return notification;
  }

  /**
   * Batch create notifications
   */
  public async createBulkNotifications(
    userId: string,
    notifications: Array<{
      title: string;
      message: string;
      type?: NotificationType;
      category?: NotificationCategory;
      priority?: NotificationPriority;
    }>
  ): Promise<EnhancedNotification[]> {
    const created = await Promise.all(
      notifications.map(n =>
        this.createNotification(userId, n.title, n.message, {
          type: n.type,
          category: n.category,
          priority: n.priority,
        })
      )
    );
    return created;
  }

  /**
   * Get notifications with filtering and sorting
   */
  public getNotifications(
    userId: string,
    filter?: NotificationFilter,
    limit?: number
  ): EnhancedNotification[] {
    let filtered = this.notificationQueue.filter(n => n.userId === userId);

    // Apply filters
    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(n => n.category === filter.category);
      }
      if (filter.priority) {
        filtered = filtered.filter(n => n.priority === filter.priority);
      }
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.read !== undefined) {
        filtered = filtered.filter(n => n.read === filter.read);
      }
      if (filter.archived !== undefined) {
        filtered = filtered.filter(n => n.archived === filter.archived);
      }
      if (filter.startDate) {
        filtered = filtered.filter(n => new Date(n.timestamp) >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(n => new Date(n.timestamp) <= filter.endDate!);
      }
    }

    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Apply limit
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Get unread notifications count
   */
  public getUnreadCount(userId: string): number {
    return this.notificationQueue.filter(
      n => n.userId === userId && !n.read
    ).length;
  }

  /**
   * Get notifications by category
   */
  public getNotificationsByCategory(
    userId: string,
    category: NotificationCategory
  ): EnhancedNotification[] {
    return this.getNotifications(userId, { category });
  }

  /**
   * Get critical notifications
   */
  public getCriticalNotifications(userId: string): EnhancedNotification[] {
    return this.getNotifications(userId, { priority: 'critical' });
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notificationQueue.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount--;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Mark multiple notifications as read
   */
  public markBulkAsRead(notificationIds: string[]): number {
    let count = 0;
    notificationIds.forEach(id => {
      if (this.markAsRead(id)) count++;
    });
    return count;
  }

  /**
   * Mark all unread notifications as read
   */
  public markAllAsRead(userId: string): number {
    const unread = this.notificationQueue.filter(
      n => n.userId === userId && !n.read
    );
    let count = 0;
    unread.forEach(n => {
      if (this.markAsRead(n.id)) count++;
    });
    return count;
  }

  /**
   * Archive notification
   */
  public archiveNotification(notificationId: string): boolean {
    const notification = this.notificationQueue.find(n => n.id === notificationId);
    if (notification && !notification.archived) {
      notification.archived = true;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Delete notification permanently
   */
  public deleteNotification(notificationId: string): boolean {
    const index = this.notificationQueue.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notificationQueue[index];
      if (!notification.read) {
        this.unreadCount--;
      }
      this.notificationQueue.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Clear all notifications for user
   */
  public clearAll(userId: string): number {
    const before = this.notificationQueue.length;
    this.notificationQueue = this.notificationQueue.filter(n => n.userId !== userId);
    const cleared = before - this.notificationQueue.length;
    
    // Recalculate unread count
    this.unreadCount = this.notificationQueue.filter(n => !n.read).length;
    this.notifyListeners();
    
    return cleared;
  }

  /**
   * Clear archived notifications
   */
  public clearArchived(userId: string): number {
    const before = this.notificationQueue.length;
    this.notificationQueue = this.notificationQueue.filter(
      n => !(n.userId === userId && n.archived)
    );
    const cleared = before - this.notificationQueue.length;
    this.notifyListeners();
    return cleared;
  }

  /**
   * Auto-delete expired notifications
   */
  public cleanupExpiredNotifications(): number {
    const now = new Date();
    const before = this.notificationQueue.length;
    this.notificationQueue = this.notificationQueue.filter(n => !n.expiresAt || n.expiresAt > now);
    const cleaned = before - this.notificationQueue.length;
    
    // Recalculate unread count
    this.unreadCount = this.notificationQueue.filter(n => !n.read).length;
    if (cleaned > 0) this.notifyListeners();
    
    return cleaned;
  }

  /**
   * Get notification statistics
   */
  public getStatistics(userId: string) {
    const userNotifications = this.notificationQueue.filter(n => n.userId === userId);
    const stats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      archived: userNotifications.filter(n => n.archived).length,
      byCategory: {} as Record<NotificationCategory, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byType: {} as Record<NotificationType, number>,
    };

    userNotifications.forEach(n => {
      stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Subscribe to notifications
   */
  public subscribe(listener: (notifications: EnhancedNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notificationQueue]));
  }

  /**
   * Export notifications as JSON
   */
  public exportNotifications(userId: string): string {
    const userNotifications = this.notificationQueue.filter(n => n.userId === userId);
    return JSON.stringify(userNotifications, null, 2);
  }

  /**
   * Get notifications by related entity
   */
  public getNotificationsByRelated(
    userId: string,
    relatedId: string,
    relatedType?: string
  ): EnhancedNotification[] {
    return this.notificationQueue.filter(
      n =>
        n.userId === userId &&
        n.relatedId === relatedId &&
        (!relatedType || n.relatedType === relatedType)
    );
  }

  /**
   * Check if critical notifications exist
   */
  public hasCriticalNotifications(userId: string): boolean {
    return this.notificationQueue.some(
      n => n.userId === userId && n.priority === 'critical' && !n.read
    );
  }

  /**
   * Get recent notifications
   */
  public getRecentNotifications(userId: string, hours: number = 24): EnhancedNotification[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getNotifications(userId).filter(n => new Date(n.timestamp) >= cutoff);
  }

  /**
   * Batch delete notifications by filter
   */
  public deleteByFilter(userId: string, filter: NotificationFilter): number {
    const toDelete = this.getNotifications(userId, filter);
    let count = 0;
    toDelete.forEach(n => {
      if (this.deleteNotification(n.id)) count++;
    });
    return count;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Cleanup expired notifications every hour
setInterval(() => {
  const cleaned = notificationService.cleanupExpiredNotifications();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired notifications`);
  }
}, 60 * 60 * 1000);
