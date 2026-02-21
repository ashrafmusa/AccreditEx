import { ActivityLogItem } from '@/types';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'activity_logs';

/**
 * Log an activity event to Firestore.
 * Fire-and-forget — errors are caught internally so logging never breaks the main flow.
 */
export const logActivity = async (
    userId: string,
    userName: string,
    action: { en: string; ar: string },
    options?: {
        details?: { en: string; ar: string };
        type?: string;
        resourceId?: string;
    }
): Promise<void> => {
    try {
        const entry: Omit<ActivityLogItem, 'id'> = {
            timestamp: new Date().toISOString(),
            user: userName,
            action,
            ...(options?.details ? { details: JSON.stringify(options.details) } : {}),
            ...(options?.type ? { type: options.type } : {}),
        };

        await addDoc(collection(db, COLLECTION_NAME), {
            ...entry,
            userId,
            resourceId: options?.resourceId || null,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging should not break the main flow
    }
};

/**
 * Fetch activity logs from Firestore with optional filtering.
 */
export const getActivityLogs = async (options?: {
    userId?: string;
    type?: string;
    limitCount?: number;
    startDate?: Date;
    endDate?: Date;
}): Promise<ActivityLogItem[]> => {
    try {
        let q = query(collection(db, COLLECTION_NAME));

        if (options?.userId) {
            q = query(q, where('userId', '==', options.userId));
        }

        if (options?.type) {
            q = query(q, where('type', '==', options.type));
        }

        if (options?.startDate) {
            q = query(q, where('timestamp', '>=', options.startDate.toISOString()));
        }

        if (options?.endDate) {
            q = query(q, where('timestamp', '<=', options.endDate.toISOString()));
        }

        q = query(q, orderBy('timestamp', 'desc'));

        if (options?.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                timestamp: data.timestamp,
                user: data.user,
                action: data.action,
                details: data.details,
                type: data.type,
            } as ActivityLogItem;
        });
    } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        return [];
    }
};

/**
 * Fetch the most recent activity logs.
 */
export const getRecentActivityLogs = async (limitCount: number = 100): Promise<ActivityLogItem[]> => {
    return getActivityLogs({ limitCount });
};

/**
 * Convenience: log common actions
 */
export const ActivityLogger = {
    projectCreated: (userId: string, userName: string, projectName: string) =>
        logActivity(userId, userName, {
            en: `Created project "${projectName}"`,
            ar: `أنشأ مشروع "${projectName}"`,
        }, { type: 'project' }),

    projectUpdated: (userId: string, userName: string, projectName: string) =>
        logActivity(userId, userName, {
            en: `Updated project "${projectName}"`,
            ar: `حدّث مشروع "${projectName}"`,
        }, { type: 'project' }),

    checklistUpdated: (userId: string, userName: string, standardName: string, status: string) =>
        logActivity(userId, userName, {
            en: `Updated checklist "${standardName}" to ${status}`,
            ar: `حدّث قائمة المراجعة "${standardName}" إلى ${status}`,
        }, { type: 'checklist' }),

    documentUploaded: (userId: string, userName: string, docName: string) =>
        logActivity(userId, userName, {
            en: `Uploaded document "${docName}"`,
            ar: `رفع مستند "${docName}"`,
        }, { type: 'document' }),

    documentApproved: (userId: string, userName: string, docName: string) =>
        logActivity(userId, userName, {
            en: `Approved document "${docName}"`,
            ar: `وافق على مستند "${docName}"`,
        }, { type: 'document' }),

    documentUpdated: (userId: string, userName: string, docName: string) =>
        logActivity(userId, userName, {
            en: `Updated document "${docName}"`,
            ar: `حدّث مستند "${docName}"`,
        }, { type: 'document' }),

    documentDeleted: (userId: string, userName: string, docName: string) =>
        logActivity(userId, userName, {
            en: `Deleted document "${docName}"`,
            ar: `حذف مستند "${docName}"`,
        }, { type: 'document' }),

    incidentReported: (userId: string, userName: string, incidentType: string) =>
        logActivity(userId, userName, {
            en: `Reported ${incidentType} incident`,
            ar: `أبلغ عن حادث ${incidentType}`,
        }, { type: 'incident' }),

    capaCreated: (userId: string, userName: string, capaTitle: string) =>
        logActivity(userId, userName, {
            en: `Created CAPA "${capaTitle}"`,
            ar: `أنشأ إجراء تصحيحي "${capaTitle}"`,
        }, { type: 'capa' }),

    riskAdded: (userId: string, userName: string, riskTitle: string) =>
        logActivity(userId, userName, {
            en: `Added risk "${riskTitle}"`,
            ar: `أضاف خطر "${riskTitle}"`,
        }, { type: 'risk' }),

    auditCompleted: (userId: string, userName: string, auditName: string) =>
        logActivity(userId, userName, {
            en: `Completed audit "${auditName}"`,
            ar: `أكمل تدقيق "${auditName}"`,
        }, { type: 'audit' }),

    settingsChanged: (userId: string, userName: string, setting: string) =>
        logActivity(userId, userName, {
            en: `Changed setting: ${setting}`,
            ar: `غيّر إعداد: ${setting}`,
        }, { type: 'settings' }),

    userLoggedIn: (userId: string, userName: string) =>
        logActivity(userId, userName, {
            en: 'Logged in',
            ar: 'سجل الدخول',
        }, { type: 'auth' }),
};
