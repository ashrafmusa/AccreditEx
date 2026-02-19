import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { QualityRound, RoundingTemplate, RoundingFinding } from '../types';

// ─── Collections ─────────────────────────────────────────
const ROUNDS_COLLECTION = 'quality_rounds';
const TEMPLATES_COLLECTION = 'rounding_templates';
const FINDINGS_COLLECTION = 'rounding_findings';

const roundsCollection = collection(db, ROUNDS_COLLECTION);
const templatesCollection = collection(db, TEMPLATES_COLLECTION);
const findingsCollection = collection(db, FINDINGS_COLLECTION);

const stripUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

// ─── Templates ───────────────────────────────────────────

export const getRoundingTemplates = async (): Promise<RoundingTemplate[]> => {
    try {
        const q = query(templatesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RoundingTemplate));
    } catch (error) {
        console.error('Failed to fetch rounding templates:', error);
        return [];
    }
};

export const addRoundingTemplate = async (template: Omit<RoundingTemplate, 'id'>): Promise<RoundingTemplate> => {
    try {
        const payload = stripUndefined({ ...template, createdAt: new Date().toISOString() }) as Omit<RoundingTemplate, 'id'>;
        const docRef = await addDoc(templatesCollection, payload);
        return { id: docRef.id, ...payload } as RoundingTemplate;
    } catch (error) {
        console.error('Failed to add rounding template:', error);
        throw error;
    }
};

export const updateRoundingTemplate = async (template: RoundingTemplate): Promise<void> => {
    try {
        const docRef = doc(db, TEMPLATES_COLLECTION, template.id);
        const { id, ...data } = template;
        const payload = stripUndefined({ ...data, updatedAt: new Date().toISOString() }) as Record<string, any>;
        await updateDoc(docRef, payload);
    } catch (error) {
        console.error('Failed to update rounding template:', error);
        throw error;
    }
};

export const deleteRoundingTemplate = async (templateId: string): Promise<void> => {
    try {
        const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to delete rounding template:', error);
        throw error;
    }
};

// ─── Quality Rounds ──────────────────────────────────────

export const getQualityRounds = async (): Promise<QualityRound[]> => {
    try {
        const q = query(roundsCollection, orderBy('scheduledDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as QualityRound));
    } catch (error) {
        console.error('Failed to fetch quality rounds:', error);
        return [];
    }
};

export const getRoundsByDepartment = async (department: string): Promise<QualityRound[]> => {
    try {
        const q = query(roundsCollection, where('department', '==', department), orderBy('scheduledDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as QualityRound));
    } catch (error) {
        console.error('Failed to fetch rounds by department:', error);
        return [];
    }
};

export const getRoundsByStatus = async (status: string): Promise<QualityRound[]> => {
    try {
        const q = query(roundsCollection, where('status', '==', status), orderBy('scheduledDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as QualityRound));
    } catch (error) {
        console.error('Failed to fetch rounds by status:', error);
        return [];
    }
};

export const addQualityRound = async (round: Omit<QualityRound, 'id'>): Promise<QualityRound> => {
    try {
        const payload = stripUndefined({ ...round, createdAt: new Date().toISOString() }) as Omit<QualityRound, 'id'>;
        const docRef = await addDoc(roundsCollection, payload);
        return { id: docRef.id, ...payload } as QualityRound;
    } catch (error) {
        console.error('Failed to add quality round:', error);
        throw error;
    }
};

export const updateQualityRound = async (round: QualityRound): Promise<void> => {
    try {
        const docRef = doc(db, ROUNDS_COLLECTION, round.id);
        const { id, ...data } = round;
        const payload = stripUndefined({ ...data, updatedAt: new Date().toISOString() }) as Record<string, any>;
        await updateDoc(docRef, payload);
    } catch (error) {
        console.error('Failed to update quality round:', error);
        throw error;
    }
};

export const deleteQualityRound = async (roundId: string): Promise<void> => {
    try {
        const docRef = doc(db, ROUNDS_COLLECTION, roundId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to delete quality round:', error);
        throw error;
    }
};

// ─── Findings ────────────────────────────────────────────

export const getRoundingFindings = async (roundId?: string): Promise<RoundingFinding[]> => {
    try {
        let q;
        if (roundId) {
            q = query(findingsCollection, where('roundId', '==', roundId), orderBy('createdAt', 'desc'));
        } else {
            q = query(findingsCollection, orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RoundingFinding));
    } catch (error) {
        console.error('Failed to fetch rounding findings:', error);
        return [];
    }
};

export const addRoundingFinding = async (finding: Omit<RoundingFinding, 'id'>): Promise<RoundingFinding> => {
    try {
        const payload = stripUndefined({ ...finding, createdAt: new Date().toISOString() }) as Omit<RoundingFinding, 'id'>;
        const docRef = await addDoc(findingsCollection, payload);
        return { id: docRef.id, ...payload } as RoundingFinding;
    } catch (error) {
        console.error('Failed to add rounding finding:', error);
        throw error;
    }
};

export const updateRoundingFinding = async (finding: RoundingFinding): Promise<void> => {
    try {
        const docRef = doc(db, FINDINGS_COLLECTION, finding.id);
        const { id, ...data } = finding;
        const payload = stripUndefined({ ...data }) as Record<string, any>;
        await updateDoc(docRef, payload);
    } catch (error) {
        console.error('Failed to update rounding finding:', error);
        throw error;
    }
};

// ─── Analytics Helpers ───────────────────────────────────

export const calculateComplianceRate = (round: QualityRound): number => {
    const total = round.observations.length;
    if (total === 0) return 0;
    const applicable = round.observations.filter(o => o.result !== 'N/A');
    if (applicable.length === 0) return 100;
    const compliant = applicable.filter(o => o.result === 'Compliant').length;
    return Math.round((compliant / applicable.length) * 100);
};

export const calculateOverallScore = (round: QualityRound): number => {
    const total = round.observations.length;
    if (total === 0) return 0;
    const applicable = round.observations.filter(o => o.result !== 'N/A');
    if (applicable.length === 0) return 100;
    const scores = applicable.map(o => {
        switch (o.result) {
            case 'Compliant': return 100;
            case 'Partial': return 50;
            case 'Non-Compliant': return 0;
            default: return 0;
        }
    });
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0 as number) / scores.length);
};
