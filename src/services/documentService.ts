import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
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
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not authenticated. Please log in to upload documents.');
        }

        // Remove undefined fields (Firebase doesn't allow them)
        const cleanDocument = Object.fromEntries(
            Object.entries(document).filter(([_, value]) => value !== undefined)
        );

        const docRef = await addDoc(documentsCollection, cleanDocument);
        freeTierMonitor.recordWrite(1);

        return { id: docRef.id, ...document } as AppDocument;
    } catch (error) {
        console.error('Firebase addDocument error:', (error as Error).message);
        throw error;
    }
};

export const updateDocument = async (document: AppDocument): Promise<void> => {
    try {
        const docRef = doc(db, 'documents', document.id);
        const { id, ...documentData } = document;
        // Remove undefined fields for Firebase compatibility
        const cleanData = Object.fromEntries(
            Object.entries(documentData).filter(([_, value]) => value !== undefined)
        );
        await updateDoc(docRef, cleanData);
        freeTierMonitor.recordWrite(1);
    } catch (error) {
        console.error('Firebase updateDocument error:', (error as Error).message);
        throw error;
    }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'documents', documentId);
        await deleteDoc(docRef);
        freeTierMonitor.recordDelete(1);
    } catch (error) {
        console.error('Firebase deleteDocument error:', (error as Error).message);
        throw error;
    }
};

export const uploadFile = async (file: File, path?: string): Promise<string> => {
    return await storageService.uploadDocument(file, path || 'documents');
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    return await storageService.deleteDocument(fileUrl);
};