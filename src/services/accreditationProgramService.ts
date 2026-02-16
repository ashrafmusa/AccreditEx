import { collection, getDocs, addDoc, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AccreditationProgram } from '../types';

const accreditationProgramsCollection = collection(db, 'accreditationPrograms');

export const getAccreditationPrograms = async (): Promise<AccreditationProgram[]> => {
    const programSnapshot = await getDocs(accreditationProgramsCollection);
    return programSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AccreditationProgram));
};

export const addAccreditationProgram = async (program: Omit<AccreditationProgram, 'id'>): Promise<AccreditationProgram> => {
    // Ensure no 'id' field leaks into document data
    const { id: _discardId, ...cleanData } = program as any;
    try {
        const docRef = await addDoc(accreditationProgramsCollection, cleanData);
        return { ...cleanData, id: docRef.id } as AccreditationProgram;
    } catch (error) {
        console.error('🔥 addAccreditationProgram failed:', { error, data: cleanData });
        throw error;
    }
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