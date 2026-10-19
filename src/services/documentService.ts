import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import { freeTierMonitor } from '@/services/freeTierMonitor';
import { AppDocument } from '@/types';
import { storageService } from '@/services/storageService';
import { cloudinaryService } from '@/services/cloudinaryService';
import { getTenantQuery, getTenantStamp, getTenantCollection } from '@/utils/tenantQuery';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (): Promise<AppDocument[]> => {
    const documentSnapshot = await getDocs(getTenantQuery('documents'));
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

        const docRef = await addDoc(documentsCollection, { ...cleanDocument, ...getTenantStamp() });
        freeTierMonitor.recordWrite(1);

        return { id: docRef.id, ...document } as AppDocument;
    } catch (error) {
        console.error('Firebase addDocument error:', (error as Error).message);
        throw error;
    }
};

export const addDocumentWithProjectEvidence = async (
    document: Omit<AppDocument, 'id'>,
    projectId: string,
    checklistItemId: string,
): Promise<AppDocument> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not authenticated. Please log in to upload documents.');
    }

    const documentRef = doc(documentsCollection);
    const projectRef = doc(db, 'projects', projectId);
    const cleanDocument = Object.fromEntries(
        Object.entries(document).filter(([, value]) => value !== undefined),
    );

    await runTransaction(db, async (transaction) => {
        const projectSnapshot = await transaction.get(projectRef);
        if (!projectSnapshot.exists()) {
            throw new Error('Project not found');
        }

        const projectData = projectSnapshot.data();
        if (!Array.isArray(projectData.checklist)) {
            throw new Error('Project checklist is unavailable');
        }

        let itemFound = false;
        const checklist = projectData.checklist.map((item: Record<string, unknown>) => {
            if (item.id !== checklistItemId) return item;
            itemFound = true;
            const evidenceFiles = Array.isArray(item.evidenceFiles)
                ? item.evidenceFiles.filter((value): value is string => typeof value === 'string')
                : [];
            return {
                ...item,
                evidenceFiles: [...new Set([...evidenceFiles, documentRef.id])],
            };
        });
        if (!itemFound) {
            throw new Error('Checklist item not found');
        }

        transaction.set(documentRef, { ...cleanDocument, ...getTenantStamp() });
        transaction.update(projectRef, {
            checklist,
            updatedAt: new Date().toISOString(),
        });
    });

    freeTierMonitor.recordWrite(2);
    return { id: documentRef.id, ...document } as AppDocument;
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