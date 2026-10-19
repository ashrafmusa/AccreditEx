import { createContext, useCallback, useContext, useMemo } from 'react';
import { notificationService, NotificationCategory, NotificationPriority } from '@/services/notificationService';
import { useUserStore } from '@/stores/useUserStore';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  custom: (type: ToastType, message: string, options?: ToastOptions) => void;
  /** @deprecated Use success/error/info/warning directly */
  showToast: (message: string, type?: ToastType) => void;
  /** Self-reference for destructured usage: const { toast } = useToast() */
  toast: ToastContextType;
}

export interface ToastOptions {
  title?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  duration?: number;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Hook for programmatic toast notifications with notification service integration
 */
export const useToastNotifications = () => {
  const { currentUser } = useUserStore();
  const persistNotification = useCallback((
    title: string,
    message: string,
    options: Parameters<typeof notificationService.createNotification>[3],
  ) => {
    if (!currentUser?.id) return;
    void notificationService
      .createNotification(currentUser.id, title, message, options)
      .catch((error: unknown) => {
        console.error('[useToastNotifications] Failed to persist notification:', error);
      });
  }, [currentUser?.id]);

  const showToast = useMemo(() => ({
    success: (message: string, options?: ToastOptions) => {
      if (currentUser?.id) {
        persistNotification(
          options?.title || 'Success',
          message,
          {
            type: 'success',
            category: options?.category || 'system',
            priority: options?.priority || 'normal',
            relatedId: options?.relatedId,
            relatedType: options?.relatedType,
            actionUrl: options?.actionUrl,
            data: options?.data,
          }
        );
      }
    },
    error: (message: string, options?: ToastOptions) => {
      if (currentUser?.id) {
        persistNotification(
          options?.title || 'Error',
          message,
          {
            type: 'error',
            category: options?.category || 'system',
            priority: options?.priority || 'high',
            relatedId: options?.relatedId,
            relatedType: options?.relatedType,
            actionUrl: options?.actionUrl,
            data: options?.data,
          }
        );
      }
    },
    info: (message: string, options?: ToastOptions) => {
      if (currentUser?.id) {
        persistNotification(
          options?.title || 'Information',
          message,
          {
            type: 'info',
            category: options?.category || 'system',
            priority: options?.priority || 'normal',
            relatedId: options?.relatedId,
            relatedType: options?.relatedType,
            actionUrl: options?.actionUrl,
            data: options?.data,
          }
        );
      }
    },
    warning: (message: string, options?: ToastOptions) => {
      if (currentUser?.id) {
        persistNotification(
          options?.title || 'Warning',
          message,
          {
            type: 'warning',
            category: options?.category || 'system',
            priority: options?.priority || 'high',
            relatedId: options?.relatedId,
            relatedType: options?.relatedType,
            actionUrl: options?.actionUrl,
            data: options?.data,
          }
        );
      }
    },
    custom: (type: ToastType, message: string, options?: ToastOptions) => {
      if (currentUser?.id) {
        persistNotification(
          options?.title || type,
          message,
          {
            type,
            category: options?.category || 'system',
            priority: options?.priority || 'normal',
            relatedId: options?.relatedId,
            relatedType: options?.relatedType,
            actionUrl: options?.actionUrl,
            data: options?.data,
          }
        );
      }
    },
  }), [currentUser?.id, persistNotification]);

  return showToast;
};