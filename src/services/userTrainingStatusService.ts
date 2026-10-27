import { doc, getDoc, getDocs, limit, where } from 'firebase/firestore';
import { db, getAuthInstance } from '../firebase/firebaseConfig';
import { UserTrainingStatus } from '../types';
import { getTenantQuery } from '@/utils/tenantQuery';

export interface UserTrainingStatusRecord {
    userId: string;
    statuses: UserTrainingStatus;
}

const mapTrainingStatusDoc = (userId: string, data: Record<string, unknown>): UserTrainingStatusRecord => {
    const statuses = Object.fromEntries(
        Object.entries(data).filter(
            ([key]) => !['userId', 'organizationId', 'updatedAt'].includes(key),
        ),
    ) as UserTrainingStatus;
    return { userId, statuses };
};

export const getUserTrainingStatuses = async (): Promise<UserTrainingStatusRecord[]> => {
    const user = getAuthInstance().currentUser;
    if (!user) return [];

    const token = await user.getIdTokenResult();
    const isAdmin = token.claims.role === 'Admin';

    if (isAdmin) {
        try {
            const snapshot = await getDocs(getTenantQuery('userTrainingStatuses'));
            return snapshot.docs.map((statusDoc) =>
                mapTrainingStatusDoc(statusDoc.id, statusDoc.data()),
            );
        } catch {
            // Fall back to direct owner document lookup below
        }
    }

    try {
        const ownDoc = await getDoc(doc(db, 'userTrainingStatuses', user.uid));
        if (ownDoc.exists()) {
            return [mapTrainingStatusDoc(ownDoc.id, ownDoc.data())];
        }
        return [];
    } catch {
        const snapshot = await getDocs(
            getTenantQuery('userTrainingStatuses', where('userId', '==', user.uid), limit(1)),
        );
        return snapshot.docs.map((statusDoc) =>
            mapTrainingStatusDoc(statusDoc.id, statusDoc.data()),
        );
    }
};