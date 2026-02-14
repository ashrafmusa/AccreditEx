import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Standard } from '@/types';

const standardsCollection = collection(db, 'standards');

export const getStandards = async (): Promise<Standard[]> => {
    const standardSnapshot = await getDocs(standardsCollection);
    return standardSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Use either 'id' or 'standardId' field
        return {
            id: data.id || docSnap.id,
            standardId: data.standardId || docSnap.id,
            ...data
        } as Standard;
    });
};

export const addStandard = async (standard: Omit<Standard, 'id'>): Promise<Standard> => {
    const docRef = await addDoc(standardsCollection, standard);
    const { standardId: stdId, ...restStandard } = standard;
    return {
        id: stdId || docRef.id,
        standardId: stdId || docRef.id,
        ...restStandard
    } as Standard;
};

export const updateStandard = async (standard: Standard): Promise<void> => {
    // Use standardId or id for the document reference
    const docId = standard.standardId || standard.id || '';
    if (!docId) throw new Error('Standard must have an id or standardId');
    const docRef = doc(db, 'standards', docId);
    const { id, ...standardData } = standard;
    await updateDoc(docRef, { ...standardData } as Record<string, any>);
};

export const deleteStandard = async (standardId: string): Promise<void> => {
    const docRef = doc(db, 'standards', standardId);
    await deleteDoc(docRef);
};