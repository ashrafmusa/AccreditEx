import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { IncidentReport } from '../types';

const incidentReportsCollection = collection(db, 'incidentReports');

export const getIncidentReports = async (): Promise<IncidentReport[]> => {
    const reportSnapshot = await getDocs(incidentReportsCollection);
    return reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentReport));
};

export const addIncidentReport = async (report: Omit<IncidentReport, 'id'>): Promise<IncidentReport> => {
    const docRef = await addDoc(incidentReportsCollection, report);
    return { id: docRef.id, ...report } as IncidentReport;
};

export const updateIncidentReport = async (report: IncidentReport): Promise<void> => {
    const docRef = doc(db, 'incidentReports', report.id);
    const { id, ...reportData } = report;
    await updateDoc(docRef, reportData);
};

export const deleteIncidentReport = async (reportId: string): Promise<void> => {
    const docRef = doc(db, 'incidentReports', reportId);
    await deleteDoc(docRef);
};