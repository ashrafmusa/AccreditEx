import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Competency } from '../types';

const competenciesCollection = collection(db, 'competencies');

export const getCompetencies = async (): Promise<Competency[]> => {
    const competencySnapshot = await getDocs(competenciesCollection);
    return competencySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competency));
};

export const addCompetency = async (competency: Omit<Competency, 'id'>): Promise<Competency> => {
    const docRef = await addDoc(competenciesCollection, competency);
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