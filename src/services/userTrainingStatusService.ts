import { getDocs, limit, where } from 'firebase/firestore';
import { getAuthInstance } from '../firebase/firebaseConfig';
import { UserTrainingStatus } from '../types';
import { getTenantQuery } from '@/utils/tenantQuery';

export interface UserTrainingStatusRecord {
    userId: string;
    statuses: UserTrainingStatus;
}

export const getUserTrainingStatuses = async (): Promise<UserTrainingStatusRecord[]> => {
    const user = getAuthInstance().currentUser;
    if (!user) return [];

    const token = await user.getIdTokenResult();
    const isAdmin = token.claims.role === 'Admin';
    const constraints = isAdmin
        ? []
        : [where('userId', '==', user.uid), limit(1)];
    const snapshot = await getDocs(getTenantQuery('userTrainingStatuses', ...constraints));
    return snapshot.docs.map((statusDoc) => {
        const data = statusDoc.data();
        const statuses = Object.fromEntries(
            Object.entries(data).filter(
                ([key]) => !['userId', 'organizationId', 'updatedAt'].includes(key),
            ),
        ) as UserTrainingStatus;
        return { userId: statusDoc.id, statuses };
    });
};