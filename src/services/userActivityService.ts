import { UserActivityLog } from '@/types';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'user_activity_logs';

export const logUserActivity = async (
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any,
    duration?: number,
    success: boolean = true,
    errorMessage?: string
): Promise<void> => {
    try {
        const activityLog: Omit<UserActivityLog, 'id'> = {
            userId,
            action,
            resource,
            resourceId,
            details,
            timestamp: new Date().toISOString(),
            duration,
            success,
            errorMessage,
        };

        await addDoc(collection(db, COLLECTION_NAME), {
            ...activityLog,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Failed to log user activity:', error);
        // Don't throw - logging should not break the main flow
    }
};

export const getUserActivityLogs = async (
    userId: string,
    limitCount: number = 100
): Promise<UserActivityLog[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as UserActivityLog[];
    } catch (error) {
        console.error('Failed to fetch user activity logs:', error);
        return [];
    }
};

export const getResourceActivityLogs = async (
    resource: string,
    resourceId?: string,
    limitCount: number = 100
): Promise<UserActivityLog[]> => {
    try {
        let q = query(
            collection(db, COLLECTION_NAME),
            where('resource', '==', resource),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        if (resourceId) {
            q = query(
                collection(db, COLLECTION_NAME),
                where('resource', '==', resource),
                where('resourceId', '==', resourceId),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as UserActivityLog[];
    } catch (error) {
        console.error('Failed to fetch resource activity logs:', error);
        return [];
    }
};

export const getRecentActivityLogs = async (limitCount: number = 100): Promise<UserActivityLog[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as UserActivityLog[];
    } catch (error) {
        console.error('Failed to fetch recent activity logs:', error);
        return [];
    }
};

export const getActivityStats = async (userId?: string): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    averageDuration: number;
    topActions: { action: string; count: number }[];
    topResources: { resource: string; count: number }[];
}> => {
    try {
        let logs: UserActivityLog[];

        if (userId) {
            logs = await getUserActivityLogs(userId, 1000);
        } else {
            logs = await getRecentActivityLogs(1000);
        }

        const totalActions = logs.length;
        const successfulActions = logs.filter(l => l.success).length;
        const failedActions = logs.filter(l => !l.success).length;

        const durations = logs.filter(l => l.duration).map(l => l.duration!);
        const averageDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        // Count actions
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topActions = Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Count resources
        const resourceCounts = logs.reduce((acc, log) => {
            acc[log.resource] = (acc[log.resource] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topResources = Object.entries(resourceCounts)
            .map(([resource, count]) => ({ resource, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalActions,
            successfulActions,
            failedActions,
            averageDuration,
            topActions,
            topResources,
        };
    } catch (error) {
        console.error('Failed to get activity stats:', error);
        return {
            totalActions: 0,
            successfulActions: 0,
            failedActions: 0,
            averageDuration: 0,
            topActions: [],
            topResources: [],
        };
    }
};
