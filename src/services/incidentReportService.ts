import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { IncidentReport } from '../types';

const incidentReportsCollection = collection(db, 'incidentReports');

/** Remove keys whose value is undefined so Firestore doesn't reject them. */
const stripUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

export const getIncidentReports = async (): Promise<IncidentReport[]> => {
    try {
        const reportSnapshot = await getDocs(incidentReportsCollection);
        return reportSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as IncidentReport));
    } catch (error) {
        console.error('Failed to fetch incident reports:', error);
        throw error;
    }
};

export const addIncidentReport = async (report: Omit<IncidentReport, 'id'>): Promise<IncidentReport> => {
    try {
        const payload = stripUndefined({ ...report, createdAt: new Date().toISOString() }) as Omit<IncidentReport, 'id'>;
        const docRef = await addDoc(incidentReportsCollection, payload);
        return { id: docRef.id, ...payload } as IncidentReport;
    } catch (error) {
        console.error('Failed to add incident report:', error);
        throw error;
    }
};

export const updateIncidentReport = async (report: IncidentReport): Promise<void> => {
    try {
        const docRef = doc(db, 'incidentReports', report.id);
        const { id, ...reportData } = report;
        const payload = stripUndefined({ ...reportData, updatedAt: new Date().toISOString() }) as Record<string, any>;
        await updateDoc(docRef, payload);
    } catch (error) {
        console.error('Failed to update incident report:', error);
        throw error;
    }
};

export const deleteIncidentReport = async (reportId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'incidentReports', reportId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to delete incident report:', error);
        throw error;
    }
};