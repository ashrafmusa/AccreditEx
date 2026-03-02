/**
 * Push Notification Hook
 * 
 * Manages push notification lifecycle in the React app:
 * - Requests permission on first login
 * - Registers for FCM tokens
 * - Routes notification taps to the correct page
 * - Creates Android notification channels
 * 
 * Used in App.tsx after user authentication.
 * 
 * @module usePushNotifications
 */

import { useEffect, useRef, useCallback } from 'react';
import {
    isPushAvailable,
    requestPushPermission,
    registerPushNotifications,
    createNotificationChannels,
    removeAllDeliveredNotifications,
    type PushNotificationHandler,
} from '@/services/nativePushService';
import { isNativePlatform } from '@/utils/capacitorPlatform';
import { useUserStore } from '@/stores/useUserStore';

const PUSH_PERMISSION_ASKED_KEY = 'accreditex_push_permission_asked';

export function usePushNotifications() {
    const currentUser = useUserStore((s) => s.currentUser);
    const cleanupRef = useRef<(() => void) | null>(null);

    const handleNotificationTap = useCallback((data: Record<string, string> | undefined) => {
        if (!data) return;

        // Route to the correct page based on notification data
        const { type, projectId, documentId, auditId } = data;

        switch (type) {
            case 'task_deadline':
                if (projectId) {
                    window.location.hash = `#/projects/${projectId}`;
                }
                break;
            case 'audit_reminder':
                if (auditId) {
                    window.location.hash = `#/audit-hub`;
                }
                break;
            case 'document_approval':
                if (documentId) {
                    window.location.hash = `#/document-control`;
                }
                break;
            default:
                // Open dashboard
                window.location.hash = '#/dashboard';
                break;
        }
    }, []);

    useEffect(() => {
        // Only initialize when user is authenticated and on native
        if (!currentUser || !isNativePlatform()) return;

        const initPush = async () => {
            // Create notification channels (Android only, no-op on iOS)
            await createNotificationChannels();

            // Check if we've already asked for permission
            const alreadyAsked = localStorage.getItem(PUSH_PERMISSION_ASKED_KEY);

            if (!alreadyAsked) {
                const granted = await requestPushPermission();
                localStorage.setItem(PUSH_PERMISSION_ASKED_KEY, 'true');
                if (!granted) {
                    console.log('[Push] Permission denied by user');
                    return;
                }
            }

            // Register and set up listeners
            const handlers: PushNotificationHandler = {
                onRegistration: (token) => {
                    console.log('[Push] Registered with FCM token');
                    // TODO: Send token to backend for targeting
                    // e.g., updateUserFCMToken(currentUser.id, token);
                },
                onNotificationReceived: (notification) => {
                    console.log('[Push] Foreground notification:', notification.title);
                    // Could show an in-app toast here
                },
                onNotificationActionPerformed: (action) => {
                    // User tapped the notification — navigate
                    handleNotificationTap(action.notification.data as Record<string, string>);
                    // Clear the notification tray
                    removeAllDeliveredNotifications();
                },
                onRegistrationError: (error) => {
                    console.error('[Push] Registration error:', error);
                },
            };

            const cleanup = await registerPushNotifications(handlers);
            cleanupRef.current = cleanup;
        };

        initPush();

        return () => {
            cleanupRef.current?.();
        };
    }, [currentUser, handleNotificationTap]);
}
