import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AccreditationProgram } from '../types';

const accreditationProgramsCollection = collection(db, 'accreditationPrograms');

export const getAccreditationPrograms = async (): Promise<AccreditationProgram[]> => {
    const programSnapshot = await getDocs(accreditationProgramsCollection);
    return programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccreditationProgram));
};

export const addAccreditationProgram = async (program: Omit<AccreditationProgram, 'id'>): Promise<AccreditationProgram> => {
    const docRef = await addDoc(accreditationProgramsCollection, program);
    return { id: docRef.id, ...program } as AccreditationProgram;
};

export const updateAccreditationProgram = async (program: AccreditationProgram): Promise<void> => {
    const docRef = doc(db, 'accreditationPrograms', program.id);
    const { id, ...programData } = program;
    await updateDoc(docRef, programData);
};

export const deleteAccreditationProgram = async (programId: string): Promise<void> => {
    const docRef = doc(db, 'accreditationPrograms', programId);
    await deleteDoc(docRef);
};