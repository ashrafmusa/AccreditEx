/**
 * Native Push Notification Service
 * 
 * Manages push notifications with platform-aware behavior:
 * - Native (Android/iOS): Uses @capacitor/push-notifications with FCM
 * - Web: Falls back to the existing notificationService (browser Notification API)
 * 
 * Integrates with Firebase Cloud Messaging for free unlimited push notifications.
 * 
 * @module nativePushService
 */

import { PushNotifications, type PushNotificationSchema, type ActionPerformed, type Token } from '@capacitor/push-notifications';
import { isNativePlatform, isPluginAvailable } from '@/utils/capacitorPlatform';

export interface PushNotificationHandler {
    onRegistration?: (token: string) => void;
    onNotificationReceived?: (notification: PushNotificationSchema) => void;
    onNotificationActionPerformed?: (action: ActionPerformed) => void;
    onRegistrationError?: (error: any) => void;
}

/** Notification channel IDs for Android */
export const NOTIFICATION_CHANNELS = {
    TASK_DEADLINES: 'task-deadlines',
    AUDIT_REMINDERS: 'audit-reminders',
    DOCUMENT_APPROVALS: 'document-approvals',
    SYSTEM_ALERTS: 'system-alerts',
} as const;

/** Notification topic names for FCM */
export const NOTIFICATION_TOPICS = {
    ALL_USERS: 'all-users',
    QUALITY_MANAGERS: 'quality-managers',
    AUDITORS: 'auditors',
    ADMINS: 'admins',
} as const;

/**
 * Check if native push notifications are available
 */
export const isPushAvailable = (): boolean => {
    return isNativePlatform() && isPluginAvailable('PushNotifications');
};

/**
 * Request permission for push notifications
 * Returns true if permission was granted
 */
export const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushAvailable()) {
        // Web fallback: use browser Notification API
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            return result === 'granted';
        }
        return false;
    }

    try {
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
    } catch (error) {
        console.error('[Push] Permission request failed:', error);
        return false;
    }
};

/**
 * Register for push notifications and set up listeners
 * Returns cleanup function to remove listeners
 */
export const registerPushNotifications = async (
    handlers: PushNotificationHandler,
): Promise<() => void> => {
    if (!isPushAvailable()) {
        console.log('[Push] Native push not available, using web notifications');
        return () => { };
    }

    const listeners: (() => void)[] = [];

    // Listen for registration success (FCM token)
    const regListener = await PushNotifications.addListener('registration', (token: Token) => {
        console.log('[Push] FCM Token received:', token.value.substring(0, 20) + '...');
        handlers.onRegistration?.(token.value);
        // Store token for server-side targeting
        storeFCMToken(token.value);
    });
    listeners.push(() => regListener.remove());

    // Listen for registration errors
    const errListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
        handlers.onRegistrationError?.(error);
    });
    listeners.push(() => errListener.remove());

    // Listen for push notifications received while app is in foreground
    const recvListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
            console.log('[Push] Notification received:', notification.title);
            handlers.onNotificationReceived?.(notification);
        },
    );
    listeners.push(() => recvListener.remove());

    // Listen for notification tap (app opened from notification)
    const actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
            console.log('[Push] Notification action:', action.notification.title);
            handlers.onNotificationActionPerformed?.(action);
        },
    );
    listeners.push(() => actionListener.remove());

    // Register with FCM
    try {
        await PushNotifications.register();
        console.log('[Push] Registration initiated');
    } catch (error) {
        console.error('[Push] Registration failed:', error);
    }

    // Return cleanup function
    return () => {
        listeners.forEach((cleanup) => cleanup());
    };
};

/**
 * Create Android notification channels for categorized notifications.
 * Must be called once during app initialization on Android.
 */
export const createNotificationChannels = async (): Promise<void> => {
    if (!isPushAvailable()) return;

    try {
        await PushNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.TASK_DEADLINES,
            name: 'Task Deadlines',
            description: 'Notifications for upcoming task deadlines',
            importance: 5, // MAX
            visibility: 1, // PUBLIC
            sound: 'default',
            vibration: true,
        });

        await PushNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.AUDIT_REMINDERS,
            name: 'Audit Reminders',
            description: 'Reminders for scheduled audits and surveys',
            importance: 4, // HIGH
            visibility: 1,
            sound: 'default',
            vibration: true,
        });

        await PushNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.DOCUMENT_APPROVALS,
            name: 'Document Approvals',
            description: 'Notifications when documents need your approval',
            importance: 3, // DEFAULT
            visibility: 1,
            sound: 'default',
            vibration: false,
        });

        await PushNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.SYSTEM_ALERTS,
            name: 'System Alerts',
            description: 'General system notifications',
            importance: 2, // LOW
            visibility: 0, // PRIVATE
            sound: 'default',
            vibration: false,
        });

        console.log('[Push] Notification channels created');
    } catch (error) {
        console.error('[Push] Failed to create channels:', error);
    }
};

/**
 * Get the list of delivered notifications still in the notification tray
 */
export const getDeliveredNotifications = async () => {
    if (!isPushAvailable()) return [];
    try {
        const result = await PushNotifications.getDeliveredNotifications();
        return result.notifications;
    } catch {
        return [];
    }
};

/**
 * Remove all delivered notifications from the tray
 */
export const removeAllDeliveredNotifications = async (): Promise<void> => {
    if (!isPushAvailable()) return;
    try {
        await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
        console.warn('[Push] Failed to clear notifications:', error);
    }
};

// ─── Internal Helpers ───────────────────────────────────────────────

const FCM_TOKEN_KEY = 'accreditex_fcm_token';

function storeFCMToken(token: string): void {
    try {
        localStorage.setItem(FCM_TOKEN_KEY, token);
    } catch {
        /* localStorage unavailable */
    }
}

/**
 * Get the stored FCM token (useful for server-side API calls)
 */
export function getStoredFCMToken(): string | null {
    try {
        return localStorage.getItem(FCM_TOKEN_KEY);
    } catch {
        return null;
    }
}
