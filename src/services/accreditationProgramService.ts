import { collection, getDocs, addDoc, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AccreditationProgram } from '../types';

const accreditationProgramsCollection = collection(db, 'accreditationPrograms');

export const getAccreditationPrograms = async (): Promise<AccreditationProgram[]> => {
    const programSnapshot = await getDocs(accreditationProgramsCollection);
    return programSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AccreditationProgram));
};

export const addAccreditationProgram = async (program: Omit<AccreditationProgram, 'id'>): Promise<AccreditationProgram> => {
    const docRef = await addDoc(accreditationProgramsCollection, program);
    return { id: docRef.id, ...program } as AccreditationProgram;
};

export const updateAccreditationProgram = async (program: AccreditationProgram): Promise<void> => {
    const docRef = doc(db, 'accreditationPrograms', program.id);
    const { id, ...programData } = program;
    
    // Check if document exists first
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
        // Document exists, use updateDoc to update only the provided fields
        await updateDoc(docRef, programData);
    } else {
        // Document doesn't exist, create it with setDoc
        await setDoc(docRef, programData);
    }
};

export const deleteAccreditationProgram = async (programId: string): Promise<void> => {
    const docRef = doc(db, 'accreditationPrograms', programId);
    await deleteDoc(docRef);
};