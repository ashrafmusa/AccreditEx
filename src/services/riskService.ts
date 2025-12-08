import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Risk } from '../types';

const risksCollection = collection(db, 'risks');

export const getRisks = async (): Promise<Risk[]> => {
    const riskSnapshot = await getDocs(risksCollection);
    return riskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk));
};

export const addRisk = async (risk: Omit<Risk, 'id'>): Promise<Risk> => {
    const docRef = await addDoc(risksCollection, risk);
    return { id: docRef.id, ...risk } as Risk;
};

export const updateRisk = async (risk: Risk): Promise<void> => {
    const docRef = doc(db, 'risks', risk.id);
    const { id, ...riskData } = risk;
    await updateDoc(docRef, riskData);
};

export const deleteRisk = async (riskId: string): Promise<void> => {
    const docRef = doc(db, 'risks', riskId);
    await deleteDoc(docRef);
};