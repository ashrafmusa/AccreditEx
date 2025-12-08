import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { freeTierMonitor } from './freeTierMonitor';
import { User } from '../types';

const usersCollection = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
    const userSnapshot = await getDocs(usersCollection);
    freeTierMonitor.recordRead(1);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};