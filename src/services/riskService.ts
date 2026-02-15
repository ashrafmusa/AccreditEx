import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Risk } from '../types';

const risksCollection = collection(db, 'risks');

/** Strip undefined values from an object (Firestore rejects undefined) */
const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;

export const getRisks = async (): Promise<Risk[]> => {
    try {
        const riskSnapshot = await getDocs(risksCollection);
        return riskSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Risk));
    } catch (error) {
        console.error('[riskService] getRisks failed:', error);
        throw error;
    }
};

export const addRisk = async (risk: Omit<Risk, 'id'>): Promise<Risk> => {
    try {
        const riskWithTimestamp = { ...risk, createdAt: risk.createdAt || new Date().toISOString() };
        const cleanData = stripUndefined(riskWithTimestamp);
        const docRef = await addDoc(risksCollection, cleanData);
        return { id: docRef.id, ...riskWithTimestamp } as Risk;
    } catch (error) {
        console.error('[riskService] addRisk failed:', error);
        throw error;
    }
};

export const updateRisk = async (risk: Risk): Promise<void> => {
    try {
        const docRef = doc(db, 'risks', risk.id);
        const { id, ...riskData } = risk;
        const cleanData = stripUndefined({ ...riskData, updatedAt: new Date().toISOString() });
        await updateDoc(docRef, cleanData);
    } catch (error) {
        console.error('[riskService] updateRisk failed:', error);
        throw error;
    }
};

export const deleteRisk = async (riskId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'risks', riskId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('[riskService] deleteRisk failed:', error);
        throw error;
    }
};