import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import { getTenantQuery } from '@/utils/tenantQuery';
import { doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types';
import { freeTierMonitor } from './freeTierMonitor';

export const getUsers = async (): Promise<User[]> => {
    const userSnapshot = await getDocs(getTenantQuery('users'));
    freeTierMonitor.recordRead(1);
    return userSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
};

export interface ProgramSelection {
    program: string;
    organizationName: string;
    organizationType: string;
    country: string;
    city: string;
    region: string;
}

export const setProgramSelection = async (
    user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'organizationId' | 'isActive' | 'createdAt'>,
    selection: ProgramSelection
): Promise<void> => {
    try {
        const authUid = getAuthInstance().currentUser?.uid;
        const targetUserId = authUid || user.id;
        const userRef = doc(db, 'users', targetUserId);
        const now = new Date().toISOString();
        const existingUserSnap = await getDoc(userRef);

        if (!existingUserSnap.exists()) {
            await setDoc(userRef, {
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                isActive: user.isActive ?? true,
                createdAt: user.createdAt ?? now,
            });
        }

        // Update the user's profile with the program selection and organization details.
        // Use update for existing docs so owner writes cannot mutate protected account fields.
        await updateDoc(userRef, {
            'profile.accreditationProgram': selection.program,
            'profile.organizationName': selection.organizationName,
            'profile.organizationType': selection.organizationType,
            'profile.country': selection.country,
            'profile.city': selection.city,
            'profile.region': selection.region,
            'profile.programSelectedAt': now,
        });

        freeTierMonitor.recordWrite(1);
    } catch (error) {
        console.error('Error setting program selection:', error);
        throw error;
    }
};

export const getProgramSelection = async (userId: string): Promise<ProgramSelection | null> => {
    try {
        const authUid = getAuthInstance().currentUser?.uid;
        const targetUserId = authUid || userId;
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        const userData = userSnap.data() as User;
        if (!userData.profile?.accreditationProgram) {
            return null;
        }

        freeTierMonitor.recordRead(1);

        return {
            program: userData.profile.accreditationProgram,
            organizationName: userData.profile.organizationName || '',
            organizationType: userData.profile.organizationType || '',
            country: userData.profile.country || '',
            city: userData.profile.city || '',
            region: userData.profile.region || '',
        };
    } catch (error) {
        console.error('Error getting program selection:', error);
        throw error;
    }
};