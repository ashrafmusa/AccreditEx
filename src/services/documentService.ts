import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import { freeTierMonitor } from '@/services/freeTierMonitor';
import { AppDocument } from '@/types';
import { storageService } from '@/services/storageService';
import { cloudinaryService } from '@/services/cloudinaryService';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (): Promise<AppDocument[]> => {
    const documentSnapshot = await getDocs(documentsCollection);
    freeTierMonitor.recordRead(1);
    return documentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppDocument));
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
        const currentUser = auth.currentUser;
        console.log('[deleteDocument] Auth state:', {
            uid: currentUser?.uid,
            email: currentUser?.email,
            isAnonymous: currentUser?.isAnonymous,
            tokenExpiry: currentUser ? new Date((await currentUser.getIdTokenResult()).expirationTime).toISOString() : null,
        });
        console.log('[deleteDocument] Deleting from collection: documents, docId:', documentId);

        const docRef = doc(db, 'documents', documentId);
        await deleteDoc(docRef);
        console.log('[deleteDocument] SUCCESS — delete completed');
        freeTierMonitor.recordDelete(1);
    } catch (error: any) {
        console.error('[deleteDocument] FAILED:', {
            code: error?.code,
            message: error?.message,
            name: error?.name,
            details: error?.details,
            serverResponse: error?.customData,
        });
        throw error;
    }
};

export const uploadFile = async (file: File, path?: string): Promise<string> => {
    return await cloudinaryService.uploadFile(file, path || 'documents');
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    if (fileUrl.includes('cloudinary.com')) {
        console.info('[Cloudinary] File deletion requires backend API — skipping storage delete.');
        return;
    }
    return await storageService.deleteDocument(fileUrl);
};