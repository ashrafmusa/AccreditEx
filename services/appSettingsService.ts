import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AppSettings } from '../types';

const settingsCollection = collection(db, 'settings');

export const getAppSettings = async (): Promise<AppSettings | null> => {
    const settingsSnapshot = await getDocs(settingsCollection);
    if (settingsSnapshot.empty) {
        return null;
    }
    const settingsDoc = settingsSnapshot.docs[0];
    return { ...settingsDoc.data() } as AppSettings;
};