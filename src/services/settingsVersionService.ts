import { SettingsVersion, AppSettings } from '@/types';
import { collection, addDoc, getDocs, getDoc, doc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'settings_versions';

export const createSettingsVersion = async (
    settings: Partial<AppSettings>,
    createdBy: string,
    comment?: string,
    tags?: string[]
): Promise<string> => {
    // Get current version number
    const versions = await getAllVersions();
    const latestVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0;

    const versionData: Omit<SettingsVersion, 'id'> = {
        version: latestVersion + 1,
        settings,
        createdBy,
        createdAt: new Date().toISOString(),
        comment,
        tags,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...versionData,
        createdAtTimestamp: Timestamp.now(),
    });

    return docRef.id;
};

export const getAllVersions = async (): Promise<SettingsVersion[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('version', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsVersion[];
};

export const getVersionById = async (versionId: string): Promise<SettingsVersion | null> => {
    const docRef = doc(db, COLLECTION_NAME, versionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data(),
    } as SettingsVersion;
};

export const getVersionByNumber = async (versionNumber: number): Promise<SettingsVersion | null> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('version', '==', versionNumber),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
    } as SettingsVersion;
};

export const getRecentVersions = async (limitCount: number = 10): Promise<SettingsVersion[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('version', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsVersion[];
};

export const getUserVersions = async (userId: string): Promise<SettingsVersion[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('version', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsVersion[];
};

export const getVersionsByTag = async (tag: string): Promise<SettingsVersion[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('tags', 'array-contains', tag),
        orderBy('version', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsVersion[];
};

export const compareVersions = (version1: SettingsVersion, version2: SettingsVersion): {
    added: string[];
    removed: string[];
    modified: string[];
} => {
    const changes = {
        added: [] as string[],
        removed: [] as string[],
        modified: [] as string[],
    };

    const keys1 = Object.keys(version1.settings);
    const keys2 = Object.keys(version2.settings);

    // Find added keys
    keys2.forEach(key => {
        if (!keys1.includes(key)) {
            changes.added.push(key);
        }
    });

    // Find removed keys
    keys1.forEach(key => {
        if (!keys2.includes(key)) {
            changes.removed.push(key);
        }
    });

    // Find modified keys
    keys1.forEach(key => {
        if (keys2.includes(key) && JSON.stringify(version1.settings[key as keyof AppSettings]) !== JSON.stringify(version2.settings[key as keyof AppSettings])) {
            changes.modified.push(key);
        }
    });

    return changes;
};

export const restoreVersion = async (versionId: string): Promise<Partial<AppSettings>> => {
    const version = await getVersionById(versionId);

    if (!version) {
        throw new Error('Version not found');
    }

    return version.settings;
};
