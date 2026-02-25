import { getDocs } from 'firebase/firestore';
import { freeTierMonitor } from './freeTierMonitor';
import { User } from '../types';
import { getTenantQuery } from '@/utils/tenantQuery';

export const getUsers = async (): Promise<User[]> => {
    const userSnapshot = await getDocs(getTenantQuery('users'));
    freeTierMonitor.recordRead(1);
    return userSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
};