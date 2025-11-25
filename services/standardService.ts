import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Standard } from '@/types';

const standardsCollection = collection(db, 'standards');

export const getStandards = async (): Promise<Standard[]> => {
    const standardSnapshot = await getDocs(standardsCollection);
    return standardSnapshot.docs.map(doc => ({ ...doc.data() } as Standard));
};

export const addStandard = async (standard: Omit<Standard, 'id'>): Promise<Standard> => {
    const docRef = await addDoc(standardsCollection, standard);
    return { id: docRef.id, ...standard } as Standard;
};

export const updateStandard = async (standard: Standard): Promise<void> => {
    const docRef = doc(db, 'standards', standard.id);
    const { id, ...standardData } = standard;
    await updateDoc(docRef, standardData);
};

export const deleteStandard = async (standardId: string): Promise<void> => {
    const docRef = doc(db, 'standards', standardId);
    await deleteDoc(docRef);
};