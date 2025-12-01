```typescript
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { AppDocument } from '@/types';
import { storageService } from '@/services/storageService';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (): Promise<AppDocument[]> => {
    const documentSnapshot = await getDocs(documentsCollection);
    return documentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDocument));
};

export const addDocument = async (document: Omit<AppDocument, 'id'>): Promise<AppDocument> => {
    const docRef = await addDoc(documentsCollection, document);
    return { id: docRef.id, ...document } as AppDocument;
};

export const updateDocument = async (document: AppDocument): Promise<void> => {
    const docRef = doc(db, 'documents', document.id);
    const { id, ...documentData } = document;
    await updateDoc(docRef, documentData);
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
};

export const uploadFile = async (file: File, path?: string): Promise<string> => {
    return await storageService.uploadDocument(file, path);
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    return await storageService.deleteDocument(fileUrl);
};
```