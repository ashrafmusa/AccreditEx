import { SettingsAuditLog } from '@/types';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'settings_audit_logs';

export const logSettingsChange = async (
    userId: string,
    userName: string,
    action: SettingsAuditLog['action'],
    category: string,
    field: string,
    oldValue: any,
    newValue: any
): Promise<void> => {
    try {
        const logEntry: Omit<SettingsAuditLog, 'id'> = {
            userId,
            userName,
            action,
            category,
            field,
            oldValue,
            newValue,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        await addDoc(collection(db, COLLECTION_NAME), {
            ...logEntry,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Failed to log settings change:', error);
        // Don't throw - logging should not break the main flow
    }
};

export const getAuditLogs = async (options?: {
    userId?: string;
    category?: string;
    limitCount?: number;
    startDate?: Date;
    endDate?: Date;
}): Promise<SettingsAuditLog[]> => {
    try {
        let q = query(collection(db, COLLECTION_NAME));

        if (options?.userId) {
            q = query(q, where('userId', '==', options.userId));
        }

        if (options?.category) {
            q = query(q, where('category', '==', options.category));
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
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as SettingsAuditLog[];
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
    }
};

export const getRecentAuditLogs = async (limitCount: number = 50): Promise<SettingsAuditLog[]> => {
    return getAuditLogs({ limitCount });
};

export const getUserAuditLogs = async (userId: string, limitCount: number = 100): Promise<SettingsAuditLog[]> => {
    return getAuditLogs({ userId, limitCount });
};

export const getCategoryAuditLogs = async (category: string, limitCount: number = 100): Promise<SettingsAuditLog[]> => {
    return getAuditLogs({ category, limitCount });
};
