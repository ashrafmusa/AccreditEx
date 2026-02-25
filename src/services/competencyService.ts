import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Competency } from '../types';
import { getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';

const competenciesCollection = collection(db, 'competencies');

export const getCompetencies = async (): Promise<Competency[]> => {
    const competencySnapshot = await getDocs(getTenantQuery('competencies'));
    return competencySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Competency));
};

export const addCompetency = async (competency: Omit<Competency, 'id'>): Promise<Competency> => {
    const docRef = await addDoc(competenciesCollection, { ...competency, ...getTenantStamp() });
    return { id: docRef.id, ...competency } as Competency;
};

export const updateCompetency = async (competency: Competency): Promise<void> => {
    const docRef = doc(db, 'competencies', competency.id);
    const { id, ...competencyData } = competency;
    await updateDoc(docRef, competencyData);
};

export const deleteCompetency = async (competencyId: string): Promise<void> => {
    const docRef = doc(db, 'competencies', competencyId);
    await deleteDoc(docRef);
};