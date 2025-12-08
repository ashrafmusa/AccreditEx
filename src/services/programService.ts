import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { AccreditationProgram as Program } from '@/types';

const programsCollection = collection(db, 'programs');

export const getPrograms = async (): Promise<Program[]> => {
    const programSnapshot = await getDocs(programsCollection);
    return programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (program: Omit<Program, 'id'>): Promise<Program> => {
    const docRef = await addDoc(programsCollection, program);
    return { id: docRef.id, ...program } as Program;
};

export const updateProgram = async (program: Program): Promise<void> => {
    const docRef = doc(db, 'programs', program.id);
    const { id, ...programData } = program;
    await updateDoc(docRef, programData);
};

export const deleteProgram = async (programId: string): Promise<void> => {
    const docRef = doc(db, 'programs', programId);
    await deleteDoc(docRef);
};