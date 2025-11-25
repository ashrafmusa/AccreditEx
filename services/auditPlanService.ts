import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AuditPlan } from '../types';

const auditPlansCollection = collection(db, 'auditPlans');

export const getAuditPlans = async (): Promise<AuditPlan[]> => {
    const planSnapshot = await getDocs(auditPlansCollection);
    return planSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditPlan));
};

export const addAuditPlan = async (plan: Omit<AuditPlan, 'id'>): Promise<AuditPlan> => {
    const docRef = await addDoc(auditPlansCollection, plan);
    return { id: docRef.id, ...plan } as AuditPlan;
};

export const updateAuditPlan = async (plan: AuditPlan): Promise<void> => {
    const docRef = doc(db, 'auditPlans', plan.id);
    const { id, ...planData } = plan;
    await updateDoc(docRef, planData);
};

export const deleteAuditPlan = async (planId: string): Promise<void> => {
    const docRef = doc(db, 'auditPlans', planId);
    await deleteDoc(docRef);
};