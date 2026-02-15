import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Department } from '@/types';

const departmentsCollection = collection(db, 'departments');

export const getDepartments = async (): Promise<Department[]> => {
    const departmentSnapshot = await getDocs(departmentsCollection);
    return departmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
};

export const addDepartment = async (department: Omit<Department, 'id'>): Promise<Department> => {
    const docRef = await addDoc(departmentsCollection, department);
    return { id: docRef.id, ...department } as Department;
};

export const updateDepartment = async (department: Department): Promise<void> => {
    const docRef = doc(db, 'departments', department.id);
    const { id, ...departmentData } = department;
    await updateDoc(docRef, departmentData);
};

export const deleteDepartment = async (departmentId: string): Promise<void> => {
    const docRef = doc(db, 'departments', departmentId);
    await deleteDoc(docRef);
};