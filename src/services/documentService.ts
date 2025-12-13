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
        // Check authentication
        const currentUser = auth.currentUser;
        console.log('👤 Current user:', currentUser ? currentUser.uid : 'NOT LOGGED IN');

        if (!currentUser) {
            throw new Error('User not authenticated. Please log in to upload documents.');
        }

        console.log('📝 Attempting to save document to Firebase:', {
            collection: 'documents',
            documentType: document.type,
            hasFileUrl: !!document.fileUrl,
            isControlled: document.isControlled,
            userEmail: currentUser.email
        });

        // Remove undefined fields (Firebase doesn't allow them)
        const cleanDocument = Object.fromEntries(
            Object.entries(document).filter(([_, value]) => value !== undefined)
        );

        // Log document size and data for debugging
        const documentSize = JSON.stringify(cleanDocument).length;
        console.log('📦 Document size:', documentSize, 'bytes');
        console.log('📄 Clean document data:', cleanDocument);

        console.log('⏳ Calling addDoc...');

        // Add timeout to catch hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Firebase addDoc timeout after 10 seconds')), 10000);
        });

        const docRef = await Promise.race([
            addDoc(documentsCollection, cleanDocument),
            timeoutPromise
        ]);

        console.log('⏳ addDoc completed, docRef:', docRef.id);

        freeTierMonitor.recordWrite(1);

        console.log('✅ Document saved to Firebase successfully! ID:', docRef.id);

        return { id: docRef.id, ...document } as AppDocument;
    } catch (error) {
        console.error('❌ Firebase addDocument error:', error);
        console.error('Error name:', (error as Error).name);
        console.error('Error message:', (error as Error).message);
        console.error('Document data:', document);
        throw error;
    }
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