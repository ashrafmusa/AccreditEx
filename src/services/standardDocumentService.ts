import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { cloudinaryService } from '@/services/cloudinaryService';
import { storageService } from '@/services/storageService';
import { StandardDocument, Standard } from '@/types';
import { freeTierMonitor } from '@/services/freeTierMonitor';

const standardsCollection = collection(db, 'standards');

/**
 * Upload a document for a standard
 * @param standardId - Standard ID
 * @param file - File to upload
 * @param description - Optional description
 * @param userId - User ID uploading the file
 * @param onProgress - Optional progress callback
 */
export const uploadStandardDocument = async (
  standardId: string,
  file: File,
  description: string | undefined,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<StandardDocument> => {
  try {
    // Upload file to storage
    const fileUrl = await cloudinaryService.uploadFile(
      file,
      `standards/${standardId}`,
      (progress) => {
        onProgress?.(progress.progress);
      }
    );

    // Create document record
    const standardDocument: StandardDocument = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      description: description || '',
      isPublic: true,
    };

    // Add document ID to standard
    const standardRef = doc(standardsCollection, standardId);
    await updateDoc(standardRef, {
      documentIds: arrayUnion(standardDocument.id),
      documents: arrayUnion(standardDocument),
    });

    freeTierMonitor.recordWrite(1);
    return standardDocument;
  } catch (error) {
    console.error('Error uploading standard document:', error);
    throw new Error('Failed to upload standard document');
  }
};

/**
 * Delete a document from a standard
 * @param standardId - Standard ID
 * @param documentId - Document ID to delete
 */
export const deleteStandardDocument = async (
  standardId: string,
  documentId: string
): Promise<void> => {
  try {
    const standardRef = doc(standardsCollection, standardId);
    const standardSnap = await getDoc(standardRef);

    if (!standardSnap.exists()) {
      throw new Error('Standard not found');
    }

    const standardData = standardSnap.data() as Standard;
    const document = standardData.documents?.find(d => d.id === documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from storage (Cloudinary or Firebase Storage)
    try {
      if (document.fileUrl.includes('cloudinary.com')) {
        console.info('[Cloudinary] File deletion requires backend API — metadata cleanup continues.');
      } else {
        await storageService.deleteDocument(document.fileUrl);
      }
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
      // Continue with database cleanup even if storage deletion fails
    }

    // Remove document from standard
    await updateDoc(standardRef, {
      documentIds: arrayRemove(documentId),
      documents: arrayRemove(document),
    });

    freeTierMonitor.recordDelete(1);
  } catch (error) {
    console.error('Error deleting standard document:', error);
    throw new Error('Failed to delete standard document');
  }
};

/**
 * Get all documents for a standard
 * @param standardId - Standard ID
 */
export const getStandardDocuments = async (standardId: string): Promise<StandardDocument[]> => {
  try {
    const standardRef = doc(standardsCollection, standardId);
    const standardSnap = await getDoc(standardRef);

    if (!standardSnap.exists()) {
      return [];
    }

    const standardData = standardSnap.data() as Standard;
    freeTierMonitor.recordRead(1);
    return standardData.documents || [];
  } catch (error) {
    console.error('Error getting standard documents:', error);
    return [];
  }
};

/**
 * Update document description
 * @param standardId - Standard ID
 * @param documentId - Document ID
 * @param description - New description
 */
export const updateStandardDocumentDescription = async (
  standardId: string,
  documentId: string,
  description: string
): Promise<void> => {
  try {
    const standardRef = doc(standardsCollection, standardId);
    const standardSnap = await getDoc(standardRef);

    if (!standardSnap.exists()) {
      throw new Error('Standard not found');
    }

    const standardData = standardSnap.data() as Standard;
    const documents = standardData.documents || [];

    const updatedDocuments = documents.map(d =>
      d.id === documentId ? { ...d, description } : d
    );

    await updateDoc(standardRef, { documents: updatedDocuments });
    freeTierMonitor.recordWrite(1);
  } catch (error) {
    console.error('Error updating standard document description:', error);
    throw new Error('Failed to update document description');
  }
};

/**
 * Download a standard document
 * @param document - Document to download
 */
export const downloadStandardDocument = async (document: StandardDocument): Promise<void> => {
  try {
    const link = document.fileUrl;
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const url = window.URL.createObjectURL(xhr.response);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    };
    xhr.open('GET', link);
    xhr.send();
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
};
