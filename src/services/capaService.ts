import { getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CAPAReport } from '../types';

const capaReportsCollection = collection(db, 'capaReports');

/** Strip undefined values from an object (Firestore rejects undefined) */
const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;

/**
 * Get all CAPA reports for the current tenant
 */
export const getCAPAReports = async (): Promise<CAPAReport[]> => {
    try {
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        return capaSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as CAPAReport));
    } catch (error) {
        console.error('[capaService] getCAPAReports failed:', error);
        throw error;
    }
};

/**
 * Get a single CAPA report by ID
 */
export const getCAPAReportById = async (id: string): Promise<CAPAReport | null> => {
    try {
        const docRef = doc(db, 'capaReports', id);
        const snap = await getDocs(getTenantQuery('capaReports', where('id', '==', id)));
        if (snap.empty) return null;
        const docData = snap.docs[0].data();
        return { ...docData, id: snap.docs[0].id } as CAPAReport;
    } catch (error) {
        console.error('[capaService] getCAPAReportById failed:', error);
        throw error;
    }
};

/**
 * Get CAPA reports by source incident
 */
export const getCAPAReportsByIncident = async (incidentId: string): Promise<CAPAReport[]> => {
    try {
        // Look for CAPAs that reference this incident in their data or linkedDocumentIds
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        return capaSnapshot.docs
            .map(d => ({ ...d.data(), id: d.id } as CAPAReport))
            .filter(capa =>
                capa.linkedDocumentIds?.includes(incidentId) ||
                capa.description?.includes(incidentId)
            );
    } catch (error) {
        console.error('[capaService] getCAPAReportsByIncident failed:', error);
        throw error;
    }
};

/**
 * Get CAPA reports by status
 */
export const getCAPAReportsByStatus = async (status: string): Promise<CAPAReport[]> => {
    try {
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        return capaSnapshot.docs
            .map(d => ({ ...d.data(), id: d.id } as CAPAReport))
            .filter(capa => capa.status === status);
    } catch (error) {
        console.error('[capaService] getCAPAReportsByStatus failed:', error);
        throw error;
    }
};

/**
 * Get CAPA reports assigned to a specific user
 */
export const getCAPAReportsByAssignee = async (userId: string): Promise<CAPAReport[]> => {
    try {
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        return capaSnapshot.docs
            .map(d => ({ ...d.data(), id: d.id } as CAPAReport))
            .filter(capa => capa.assignedTo === userId);
    } catch (error) {
        console.error('[capaService] getCAPAReportsByAssignee failed:', error);
        throw error;
    }
};

/**
 * Create a new CAPA report
 */
export const addCAPAReport = async (capa: Omit<CAPAReport, 'id'>): Promise<CAPAReport> => {
    try {
        const capaWithTimestamp = {
            ...capa,
            createdAt: capa.createdAt || new Date().toISOString(),
            type: capa.type || 'CAPA'
        };
        const cleanData = stripUndefined(capaWithTimestamp);
        const docRef = await addDoc(capaReportsCollection, { ...cleanData, ...getTenantStamp() });
        return { id: docRef.id, ...capaWithTimestamp } as CAPAReport;
    } catch (error) {
        console.error('[capaService] addCAPAReport failed:', error);
        throw error;
    }
};

/**
 * Update an existing CAPA report
 */
export const updateCAPAReport = async (capa: CAPAReport): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capa.id);
        const { id, ...capaData } = capa;
        const cleanData = stripUndefined({ ...capaData, updatedAt: new Date().toISOString() });
        await updateDoc(docRef, cleanData);
    } catch (error) {
        console.error('[capaService] updateCAPAReport failed:', error);
        throw error;
    }
};

/**
 * Update CAPA status (shorthand for common operation)
 */
export const updateCAPAStatus = async (capaId: string, status: string): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capaId);
        await updateDoc(docRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[capaService] updateCAPAStatus failed:', error);
        throw error;
    }
};

/**
 * Update CAPA PDCA stage and history
 */
export const updateCAPAPDCAStage = async (
    capaId: string,
    stage: string,
    notes?: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capaId);
        const timestamp = new Date().toISOString();

        // Fetch current CAPA to get existing history
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        const currentCapa = capaSnapshot.docs
            .map(d => ({ ...d.data(), id: d.id } as CAPAReport))
            .find(c => c.id === capaId);

        const updatedHistory = [
            ...(currentCapa?.pdcaHistory || []),
            {
                stage,
                completedAt: timestamp,
                notes,
                completedBy: undefined // Will be set by component if needed
            }
        ];

        await updateDoc(docRef, {
            pdcaStage: stage,
            pdcaHistory: updatedHistory,
            updatedAt: timestamp
        });
    } catch (error) {
        console.error('[capaService] updateCAPAPDCAStage failed:', error);
        throw error;
    }
};

/**
 * Update CAPA effectiveness check results
 */
export const updateCAPAEffectivenessCheck = async (
    capaId: string,
    effectivenessCheckData: {
        completed: boolean;
        completionDate?: string;
        results?: string;
        dueDate?: string;
    }
): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capaId);
        await updateDoc(docRef, {
            effectivenessCheck: effectivenessCheckData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[capaService] updateCAPAEffectivenessCheck failed:', error);
        throw error;
    }
};

/**
 * Link a CAPA to incident(s)
 */
export const linkCAPAToIncident = async (capaId: string, incidentId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capaId);

        // Fetch current CAPA to get existing linked documents
        const capaSnapshot = await getDocs(getTenantQuery('capaReports'));
        const currentCapa = capaSnapshot.docs
            .map(d => ({ ...d.data(), id: d.id } as CAPAReport))
            .find(c => c.id === capaId);

        const linkedDocs = [...new Set([...(currentCapa?.linkedDocumentIds || []), incidentId])];

        await updateDoc(docRef, {
            linkedDocumentIds: linkedDocs,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[capaService] linkCAPAToIncident failed:', error);
        throw error;
    }
};

/**
 * Delete a CAPA report
 */
export const deleteCAPAReport = async (capaId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'capaReports', capaId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('[capaService] deleteCAPAReport failed:', error);
        throw error;
    }
};
