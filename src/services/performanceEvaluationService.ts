import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { PerformanceEvaluation } from '../types';

const COLLECTION_NAME = 'performance_evaluations';
const evaluationsCollection = collection(db, COLLECTION_NAME);

const stripUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

export const getPerformanceEvaluations = async (): Promise<PerformanceEvaluation[]> => {
    try {
        const q = query(evaluationsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PerformanceEvaluation));
    } catch (error) {
        console.error('Failed to fetch performance evaluations:', error);
        return [];
    }
};

export const getEmployeeEvaluations = async (employeeId: string): Promise<PerformanceEvaluation[]> => {
    try {
        const q = query(evaluationsCollection, where('employeeId', '==', employeeId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PerformanceEvaluation));
    } catch (error) {
        console.error('Failed to fetch employee evaluations:', error);
        return [];
    }
};

export const addPerformanceEvaluation = async (evaluation: Omit<PerformanceEvaluation, 'id'>): Promise<PerformanceEvaluation> => {
    try {
        const payload = stripUndefined({ ...evaluation, createdAt: new Date().toISOString() }) as Omit<PerformanceEvaluation, 'id'>;
        const docRef = await addDoc(evaluationsCollection, payload);
        return { id: docRef.id, ...payload } as PerformanceEvaluation;
    } catch (error) {
        console.error('Failed to add performance evaluation:', error);
        throw error;
    }
};

export const updatePerformanceEvaluation = async (evaluation: PerformanceEvaluation): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, evaluation.id);
        const { id, ...data } = evaluation;
        const payload = stripUndefined({ ...data, updatedAt: new Date().toISOString() }) as Record<string, any>;
        await updateDoc(docRef, payload);
    } catch (error) {
        console.error('Failed to update performance evaluation:', error);
        throw error;
    }
};

export const deletePerformanceEvaluation = async (evaluationId: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, evaluationId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to delete performance evaluation:', error);
        throw error;
    }
};
