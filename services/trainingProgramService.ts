import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { TrainingProgram } from '../types';

const trainingProgramsCollection = collection(db, 'trainingPrograms');

export const getTrainingPrograms = async (): Promise<TrainingProgram[]> => {
    const programSnapshot = await getDocs(trainingProgramsCollection);
    return programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram));
};

export const addTrainingProgram = async (program: Omit<TrainingProgram, 'id'>): Promise<TrainingProgram> => {
    const docRef = await addDoc(trainingProgramsCollection, program);
    return { id: docRef.id, ...program } as TrainingProgram;
};

export const updateTrainingProgram = async (program: TrainingProgram): Promise<void> => {
    const docRef = doc(db, 'trainingPrograms', program.id);
    const { id, ...programData } = program;
    await updateDoc(docRef, programData);
};

export const deleteTrainingProgram = async (programId: string): Promise<void> => {
    const docRef = doc(db, 'trainingPrograms', programId);
    await deleteDoc(docRef);
};