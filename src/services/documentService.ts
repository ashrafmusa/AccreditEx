import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { freeTierMonitor } from '@/services/freeTierMonitor';
import { AppDocument } from '@/types';
import { storageService } from '@/services/storageService';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (): Promise<AppDocument[]> => {
    const documentSnapshot = await getDocs(documentsCollection);
    freeTierMonitor.recordRead(1);
    return documentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDocument));
};

export const addDocument = async (document: Omit<AppDocument, 'id'>): Promise<AppDocument> => {
    const docRef = await addDoc(documentsCollection, document);
    freeTierMonitor.recordWrite(1);
    return { id: docRef.id, ...document } as AppDocument;
};

export const updateDocument = async (document: AppDocument): Promise<void> => {
    const docRef = doc(db, 'documents', document.id);
    const { id, ...documentData } = document;
    await updateDoc(docRef, documentData);
    freeTierMonitor.recordWrite(1);
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
    freeTierMonitor.recordDelete(1);
};

export const uploadFile = async (file: File, path?: string): Promise<string> => {
    return await storageService.uploadDocument(file, path || 'documents');
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    return await storageService.deleteDocument(fileUrl);
};