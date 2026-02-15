import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { UserTrainingStatus } from '../types';

const userTrainingStatusesCollection = collection(db, 'userTrainingStatuses');

export const getUserTrainingStatuses = async (): Promise<(UserTrainingStatus & { id: string })[]> => {
    const userTrainingStatusSnapshot = await getDocs(userTrainingStatusesCollection);
    return userTrainingStatusSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserTrainingStatus & { id: string }));
};