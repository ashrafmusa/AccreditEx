import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Audit } from '../types';
import { getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';

const auditsCollection = collection(db, 'audits');

export const getAudits = async (): Promise<Audit[]> => {
    const auditSnapshot = await getDocs(getTenantQuery('audits'));
    return auditSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Audit));
};

export const addAudit = async (audit: Omit<Audit, 'id'>): Promise<Audit> => {
    const docRef = await addDoc(auditsCollection, { ...audit, ...getTenantStamp() });
    return { id: docRef.id, ...audit } as Audit;
};

export const updateAudit = async (audit: Audit): Promise<void> => {
    const docRef = doc(db, 'audits', audit.id);
    const { id, ...auditData } = audit;
    await updateDoc(docRef, auditData);
};

export const deleteAudit = async (auditId: string): Promise<void> => {
    const docRef = doc(db, 'audits', auditId);
    await deleteDoc(docRef);
};